import * as Mp4Muxer from "https://esm.sh/mp4-muxer@5.1.4";

// Type declarations for WebCodecs
declare class AudioEncoder {
  constructor(init: {
    output: (chunk: any, meta?: any) => void;
    error: (e: any) => void;
  });
  configure(config: {
    codec: string;
    sampleRate: number;
    numberOfChannels: number;
    bitrate?: number;
  }): void;
  encode(data: any): void;
  flush(): Promise<void>;
  close(): void;
}

declare class AudioData {
  constructor(init: {
    format: string;
    sampleRate: number;
    numberOfFrames: number;
    numberOfChannels: number;
    timestamp: number;
    data: BufferSource;
  });
  close(): void;
}

interface ExportOptions {
  sourceFile: File;
  startTime: number;
  endTime: number;
  onProgress: (progress: number) => void;
}

export const exportClip = async ({
  sourceFile,
  startTime,
  endTime,
  onProgress,
}: ExportOptions): Promise<Blob> => {
  
  // 1. Setup Video Element for Frame Extraction
  const tempVideo = document.createElement("video");
  tempVideo.src = URL.createObjectURL(sourceFile);
  tempVideo.muted = true;
  tempVideo.playsInline = true; 
  tempVideo.crossOrigin = "anonymous";
  tempVideo.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    tempVideo.onloadedmetadata = () => resolve();
    tempVideo.onerror = (e) => reject(new Error("Failed to load video metadata"));
  });

  const width = tempVideo.videoWidth;
  const height = tempVideo.videoHeight;
  const videoDuration = tempVideo.duration;
  const FPS = 30; // Standardize output FPS
  
  // Dimensions must be even for AVC (H.264)
  const displayWidth = width % 2 === 0 ? width : width - 1;
  const displayHeight = height % 2 === 0 ? height : height - 1;
  const requestedDuration = endTime - startTime;
  
  // Sanity checks
  if (displayWidth === 0 || displayHeight === 0) throw new Error("Invalid video dimensions");
  if (requestedDuration <= 0) throw new Error("Invalid duration");

  // PADDING STRATEGY:
  // Add 30 frames (1 second) of padding to the end.
  // If the player cuts off the end, it cuts off the static padding, not the content.
  const paddingFrames = 30; 
  const contentFrames = Math.ceil(requestedDuration * FPS);
  const totalFrames = contentFrames + paddingFrames;

  // Canvas for safe frame extraction
  const canvas = document.createElement("canvas");
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Failed to create canvas context");

  // 2. Muxer Setup
  // @ts-ignore
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: "avc", width: displayWidth, height: displayHeight },
    audio: { codec: "aac", numberOfChannels: 2, sampleRate: 44100 },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset', 
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("Video Encoder error:", e),
  });

  videoEncoder.configure({
    codec: "avc1.42001f",
    width: displayWidth,
    height: displayHeight,
    bitrate: 2_500_000, 
    framerate: FPS,
    latencyMode: "quality",
  });

  // 3. Process Video Frames
  let frameIndex = 0;
  
  // Helper to extract specific frame time using Canvas
  const extractFrame = async (time: number): Promise<VideoFrame> => {
      // Clamp the SEEK time to the video duration to prevent errors
      // But we allow the frame timestamp to keep increasing
      const seekTime = Math.min(time, videoDuration);

      return new Promise((resolve) => {
          // If we are in the "padding" zone (past requested end time),
          // we don't seek. We just draw the existing canvas (repeating the last frame).
          if (time > endTime || time > videoDuration) {
              const timestamp = Math.round(frameIndex * (1e6/FPS));
              const frame = new VideoFrame(canvas, { timestamp });
              resolve(frame);
              return;
          }

          tempVideo.currentTime = seekTime;
          
          const drawAndResolve = () => {
             try {
                if (tempVideo.readyState >= 2) {
                    ctx.drawImage(tempVideo, 0, 0, displayWidth, displayHeight);
                } else if (frameIndex === 0) {
                    // First frame fallback
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(0, 0, displayWidth, displayHeight);
                }
                
                const timestamp = Math.round(frameIndex * (1e6/FPS));
                const frame = new VideoFrame(canvas, { timestamp });
                resolve(frame);
             } catch (e) {
                 console.error("Frame capture failed", e);
                 const timestamp = Math.round(frameIndex * (1e6/FPS));
                 ctx.fillStyle = "black";
                 ctx.fillRect(0, 0, displayWidth, displayHeight);
                 resolve(new VideoFrame(canvas, { timestamp }));
             }
          };

          // Wait for seek
          const onSeeked = () => {
             resolveSeek(); 
             drawAndResolve();
          };

          let isResolved = false;
          const resolveSeek = () => {
              if(isResolved) return;
              isResolved = true;
              tempVideo.removeEventListener('seeked', onSeeked);
          };
          
          tempVideo.addEventListener('seeked', onSeeked, { once: true });

          if ('requestVideoFrameCallback' in (tempVideo as any)) {
              (tempVideo as any).requestVideoFrameCallback(() => {
                  resolveSeek();
                  drawAndResolve();
              });
          }

          // Safety timeout
          setTimeout(() => {
              if (!isResolved) {
                  resolveSeek();
                  drawAndResolve();
              }
          }, 1000); 
      });
  };
  
  // Pre-load
  tempVideo.currentTime = startTime;
  await new Promise(r => setTimeout(r, 500));

  for (let i = 0; i < totalFrames; i++) {
    frameIndex = i;
    // Calculate time. If we are in padding frames, this time will extend past endTime
    const time = startTime + (i / FPS);
    
    // Yield to main thread every 5 frames
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    
    // Progress calculation based on content frames only, so it sits at 100% during padding
    const progressPercent = Math.min(100, Math.round((i / contentFrames) * 80));
    onProgress(progressPercent);

    const frame = await extractFrame(time);
    
    // Force keyframe every 1 second (30 frames)
    // AND force keyframe on the very last frame of the entire set
    const keyFrame = (i % 30 === 0) || (i === totalFrames - 1);
    
    videoEncoder.encode(frame, { keyFrame });
    frame.close();
  }

  await videoEncoder.flush();
  videoEncoder.close(); 
  
  // Total duration including padding
  const totalExportDuration = totalFrames / FPS;

  // 4. Process Audio
  try {
      onProgress(85);
      
      const audioContext = new AudioContext();
      const fileBuffer = await sourceFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(fileBuffer);
      
      const targetSampleRate = 44100;
      
      // Audio duration must match video duration (including padding)
      // OfflineCtx fills the end with silence automatically if source runs out
      const offlineCtx = new OfflineAudioContext(
          2, 
          Math.ceil(totalExportDuration * targetSampleRate), 
          targetSampleRate
      );
      
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      
      // Start playing
      source.start(0, startTime, totalExportDuration);
      
      const renderedBuffer = await offlineCtx.startRendering();
      
      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error("Audio error:", e),
      });
      
      audioEncoder.configure({
        codec: "mp4a.40.2",
        numberOfChannels: 2,
        sampleRate: targetSampleRate,
        bitrate: 128_000,
      });

      const samples = renderedBuffer.length;
      const chunkDuration = 0.5;
      const chunkSamples = Math.floor(targetSampleRate * chunkDuration);
      
      for (let i = 0; i < samples; i += chunkSamples) {
          if (i % (chunkSamples * 2) === 0) {
              onProgress(85 + Math.round((i/samples) * 15));
              await new Promise(r => setTimeout(r, 0)); 
          }
          
          const remaining = Math.min(chunkSamples, samples - i);
          const data = new Float32Array(remaining * 2);
          
          const l = renderedBuffer.getChannelData(0);
          const r = renderedBuffer.getChannelData(1); 
          
          for (let j = 0; j < remaining; j++) {
              data[j * 2] = l[i + j];
              data[j * 2 + 1] = r[i + j];
          }
          
          const audioData = new AudioData({
              format: 'f32',
              sampleRate: targetSampleRate,
              numberOfFrames: remaining,
              numberOfChannels: 2,
              timestamp: Math.round((i / targetSampleRate) * 1e6),
              data: data
          });
          
          audioEncoder.encode(audioData);
          audioData.close();
      }
      
      await audioEncoder.flush();
      audioEncoder.close(); 
      audioContext.close();

  } catch (e) {
      console.warn("Audio processing failed:", e);
  }

  onProgress(100);
  
  // Allow pending writes to complete
  await new Promise(r => setTimeout(r, 200));
  
  muxer.finalize();
  
  URL.revokeObjectURL(tempVideo.src);
  tempVideo.remove();
  canvas.remove();
  
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
};