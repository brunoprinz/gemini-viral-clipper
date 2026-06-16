import React, { useState, useRef } from 'react';
import { GeminiIntegration } from './components/GeminiIntegration';
import { ClipList } from './components/ClipList';
import { ClipSegment } from './types';
import { Upload, Video, Code2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // --- COLE EXATAMENTE DAQUI PARA BAIXO ---
  // Estados para o Payload Premium do Colab
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(''); // Estado para o Input do YouTube

  // Função para copiar o Payload estruturado para a área de transferência
  const handleCopyPayload = async () => {
    const payload = {
      videoUrl: youtubeUrlInput || "https://www.youtube.com/watch?v=ciQOEETOSqc", // Usa o input ou o padrão de teste
      cuts: clips.map((clip, index) => ({
        id: index + 1,
        title: clip.title,
        start: clip.start,
        end: clip.end
      }))
    };
    
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  // --- ATÉ AQUI ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setClips([]); // Reset clips on new file
    }
  };

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    setParseError(null);

    try {
      // Find JSON array in the text (Gemini sometimes adds extra text)
      const jsonMatch = val.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0 && 'start' in parsed[0]) {
          setClips(parsed);
        } else {
           // Not throwing, just waiting for valid input
        }
      }
    } catch (err) {
      // Allow user to keep typing without aggressive errors
    }
  };

  const manualParse = () => {
    try {
       // Helper to clean markdown json blocks
       let cleanJson = jsonInput;
       if (cleanJson.includes('```json')) {
         cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '');
       }
       
       const parsed = JSON.parse(cleanJson);
       if (!Array.isArray(parsed)) throw new Error("Result is not an array");
       setClips(parsed);
       setParseError(null);
    } catch (err) {
      setParseError("Invalid JSON format. Please ensure it matches the example.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gemini Viral Clipper</h1>
          </div>
          <div className="text-xs font-mono text-gray-500 hidden sm:block">
            Local Processing • Privacy Focused
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Step 1: Upload */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 w-2 h-6 rounded-full"></span>
            0. Upload Video
          </h2>
          
          <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors bg-gray-900/50">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {videoFile ? (
              <div className="flex flex-col items-center gap-2">
                <Video className="w-12 h-12 text-cyan-400" />
                <p className="font-medium text-white text-lg">{videoFile.name}</p>
                <p className="text-sm text-gray-400">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-xs text-green-400 mt-2">Ready for processing</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="w-12 h-12 mb-2" />
                <p className="font-medium text-gray-300">Click or drag video here</p>
                <p className="text-xs">Supports MP4, MOV, WEBM</p>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="mt-4 rounded-lg overflow-hidden bg-black aspect-video max-h-64 mx-auto border border-gray-700">
              <video src={videoUrl} controls className="w-full h-full object-contain" />
            </div>
          )}

          {/* --- NOVO: Campo dinâmico para a URL do YouTube --- */}
          <div className="mt-5 pt-4 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
              🔗 Link do Vídeo no YouTube (Necessário para o Processamento em Nuvem)
            </label>
            <input
              type="text"
              value={youtubeUrlInput}
              onChange={(e) => setYoutubeUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none font-mono"
            />
          </div>

        </section>

        {/* Step 2: Gemini Instructions */}
        <GeminiIntegration />

        {/* Step 3: JSON Input */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 w-2 h-6 rounded-full"></span>
            2. Paste AI Response
          </h2>
          
          <div className="relative">
            <textarea
              value={jsonInput}
              onChange={handleJsonPaste}
              placeholder='Paste the JSON array from Gemini here. Example: [{"title": "Wow", "start": "00:10", "end": "00:20", "description": "..."}]'
              className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-y"
            />
            <div className="absolute top-2 right-2">
                <Code2 className="text-gray-600" size={20} />
            </div>
          </div>

          {parseError && (
            <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {parseError}
            </div>
          )}
          
          <button 
             onClick={manualParse}
             className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Force Parse JSON
          </button>
        </section>

        {/* --- NOVO: Seção de Exportação Industrial e Modal do Mestre das Gambiarras --- */}
        {clips.length > 0 && (
          <section className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg text-center">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 justify-center">
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 w-2 h-6 rounded-full"></span>
              3. Exportação Industrial em Nuvem
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Gere o código de processamento e envie os dados direto para o seu notebook do Google Colab.
            </p>
            
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
            >
              🚀 Gerar Payload para Google Colab
            </button>
          </section>
        )}

{isExportModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-6 my-8">
              
              {/* Header do Modal */}
              <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Code2 size={22} />
                  <h3 className="text-lg font-bold text-white">Central de Exportação Nuvem (Google Colab)</h3>
                </div>
                <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
              </div>

              <p className="text-sm text-gray-300">
                Siga os passos abaixo para processar seus shorts na velocidade da nuvem usando o Google Colab gratuitamente.
              </p>

              {/* PASSO 1: Instalação das Dependências */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Passo 1: Instalar Dependências no Colab</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("!pip install -U pytube moviepy");
                      alert("Passo 1 copiado!");
                    }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 px-2 py-1 rounded border border-gray-600 transition-colors"
                  >
                    📋 Copiar Comando
                  </button>
                </div>
                <pre className="bg-gray-950 p-3 rounded-lg text-xs text-gray-300 font-mono border border-gray-900 overflow-x-auto">
                  {"!pip install yt-dlp moviepy"}
                </pre>
              </div>

{/* PASSO 2: O Motor em Python com Chamada Posicional (À Prova de Erros do MoviePy) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Passo 2: Código do Script de Corte (Crie uma nova célula)</span>
                  <button
                    onClick={() => {
                      const pythonScript = `import json\nimport os\nimport re\nimport sys\nfrom pytubefix import YouTube\nfrom moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip\n\n# ==========================================\n# 🚀 SEU JSON FOI GERADO E INJETADO AUTOMATICAMENTE AQUI\n# ==========================================\ndados_payload = """\n${JSON.stringify({
                        videoUrl: youtubeUrlInput || "https://www.youtube.com/watch?v=ciQOEETOSqc",
                        cuts: clips.map((clip, index) => ({
                          id: index + 1,
                          title: clip.title,
                          start: clip.start,
                          end: clip.end
                        }))
                      }, null, 2)}\n"""\n# ==========================================\n\nconfig = json.loads(dados_payload)\nurl_video = config["videoUrl"]\noutput_original = "/content/video_completo.mp4"\n\ndef para_segundos(tempo_str):\n    partes = list(map(int, tempo_str.split(':')))\n    if len(partes) == 3: return partes[0] * 3600 + partes[1] * 60 + partes[2]\n    return partes[0] * 60 + partes[1]\n\nif not os.path.exists(output_original):\n    try:\n        print(f"📥 Conectando ao YouTube via PytubeFix...")\n        yt = YouTube(url_video)\n        print(f"🎬 Vídeo encontrado: {yt.title}")\n        print("⏳ Baixando stream de maior resolução (MP4)...")\n        stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()\n        stream.download(output_path="/content/", filename="video_completo.mp4")\n        print("✅ Download concluído com sucesso!")\n    except Exception as e:\n        print(f"\\n❌ ERRO CRÍTICO NO DOWNLOAD: {str(e)}")\n        os._exit(1)\nelse:\n    print("♻️ Usando vídeo mestre já existente em /content/")\n\nprint("\\n--- Iniciando os cortes automáticos ---")\nfor corte in config["cuts"]:\n    start_sec = para_segundos(corte["start"])\n    end_sec = para_segundos(corte["end"])\n    titulo_limpo = re.sub(r'[\\\\/*?:"<>|!]', "", corte["title"]).replace(" ", "_")\n    nome_arquivo = f"/content/Corte_{corte[\'id\']}_{titulo_limpo}.mp4"\n    print(f"Rendering: {nome_arquivo}...")\n    # Mudança posicional livre de parâmetros nomeados para evitar conflito de versão\n    ffmpeg_extract_subclip(output_original, start_sec, end_sec, nome_arquivo)\n\nprint("\\n🚀 Sucesso! Atualize a pasta lateral do Colab para baixar.")`;
                      navigator.clipboard.writeText(pythonScript);
                      alert("Script Python Atualizado Copiado! Cole no Colab.");
                    }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 px-2 py-1 rounded border border-gray-600 transition-colors"
                  >
                    📋 Copiar Script Python
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-gray-950 p-3 rounded-lg border border-gray-900 max-h-48 overflow-y-auto text-[11px] text-gray-400 font-mono leading-relaxed text-left select-all cursor-pointer block" title="Clique para selecionar tudo e dar Ctrl+C">
{`import json
import os
import re
import sys
from pytubefix import YouTube
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip

dados_payload = """${JSON.stringify({
  videoUrl: youtubeUrlInput || "https://www.youtube.com/watch?v=ciQOEETOSqc",
  cuts: clips.map((clip, index) => ({
    id: index + 1,
    title: clip.title,
    start: clip.start,
    end: clip.end
  }))
}, null, 2)}"""

config = json.loads(dados_payload)
url_video = config["videoUrl"]
output_original = "/content/video_completo.mp4"

def para_segundos(tempo_str):
    partes = list(map(int, tempo_str.split(':')))
    if len(partes) == 3: return partes[0] * 3600 + partes[1] * 60 + partes[2]
    return partes[0] * 60 + partes[1]

if not os.path.exists(output_original):
    try:
        print(f"📥 Conectando ao YouTube via PytubeFix...")
        yt = YouTube(url_video)
        print(f"🎬 Vídeo encontrado: {yt.title}")
        stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
        stream.download(output_path="/content/", filename="video_completo.mp4")
        print("✅ Download concluído!")
    except Exception as e:
        print(f"\\n❌ ERRO: {str(e)}")
        os._exit(1)

print("\\n--- Iniciando os cortes automáticos ---")
for corte in config["cuts"]:
    start_sec = para_segundos(corte["start"])
    end_sec = para_segundos(corte["end"])
    titulo_limpo = re.sub(r'[\\\\/*?:"<>|!]', "", corte["title"]).replace(" ", "_")
    nome_arquivo = f"/content/Corte_{corte['id']}_{titulo_limpo}.mp4"
    print(f"Rendering: {nome_arquivo}...")
    # Passando os dados estritamente por ordem posicional
    ffmpeg_extract_subclip(output_original, start_sec, end_sec, nome_arquivo)

print("\\n🚀 Sucesso! Atualize a pasta lateral do Colab para baixar.")`}
                  </pre>
                </div>
              </div>
              
              {/* PASSO 3: O Payload Dinâmico */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Passo 3: Seus Dados de Recorte (Crie um arquivo 'payload.json' ou cole no script)</span>
                  <button
                    onClick={handleCopyPayload}
                    className={`text-xs px-3 py-1 rounded font-bold transition-all ${
                      isCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isCopied ? '✅ Copiado!' : '📑 Copiar Meu JSON'}
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-gray-950 p-4 rounded-xl overflow-x-auto text-xs text-green-400 max-h-40 border border-gray-900 font-mono select-all">
                    {JSON.stringify({
                      videoUrl: youtubeUrlInput || "https://www.youtube.com/watch?v=InsiraOLink",
                      cuts: clips.map((clip, index) => ({
                        id: index + 1,
                        title: clip.title,
                        start: clip.start,
                        end: clip.end
                      }))
                    }, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="flex gap-3 pt-2 border-t border-gray-700">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-xl transition-colors text-sm"
                >
                  Fechar Central de Exportação
                </button>
              </div>

            </div>
          </div>
        )}
        {/* --- FIM DA INSERÇÃO --- */}

        {/* Step 4: Output */}
        <ClipList clips={clips} videoFile={videoFile} />

      </main>
    </div>
  );
}
