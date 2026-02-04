export interface ClipSegment {
  title: string;
  start: string; // Format "MM:SS" or "HH:MM:SS"
  end: string;   // Format "MM:SS" or "HH:MM:SS"
  description: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number; // 0 to 100
  currentTask: string;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  name: string;
}
