import React, { useState } from 'react';
import type { AspectRatio } from '../types';

interface VideoGeneratorProps {
  logoImage: string;
  logoSvgCode: string | null;
  videoUrl: string | null;
  onGenerate: (prompt: string, aspectRatio: AspectRatio) => void;
  onStartOver: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ logoImage, logoSvgCode, videoUrl, onGenerate, onStartOver }) => {
  const [prompt, setPrompt] = useState('A dynamic, professional animation of this logo.');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(prompt, aspectRatio);
  };

  const handlePngDownload = () => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${logoImage}`;
    link.download = 'logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSvgDownload = () => {
    if (!logoSvgCode) return;
    const blob = new Blob([logoSvgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-sky-300">Step 2: Animate Your Logo</h2>
        <button onClick={onStartOver} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
          Start Over
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Result Column */}
        <div className="flex flex-col items-center justify-center bg-gray-900 p-4 rounded-lg h-80 relative group">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="max-w-full max-h-full rounded-lg"
            />
          ) : (
            <>
              <img
                src={`data:image/png;base64,${logoImage}`}
                alt="Generated Logo"
                className="max-h-64 object-contain rounded-lg shadow-lg"
              />
              <div className="absolute bottom-4 flex justify-center w-full space-x-2">
                <button
                    onClick={handlePngDownload}
                    className="bg-sky-600/80 backdrop-blur-sm hover:bg-sky-500/90 text-white font-bold py-2 px-4 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2"
                >
                    Download PNG
                </button>
                {logoSvgCode && (
                   <button
                        onClick={handleSvgDownload}
                        className="bg-indigo-600/80 backdrop-blur-sm hover:bg-indigo-500/90 text-white font-bold py-2 px-4 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2"
                    >
                        Download SVG
                    </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Controls Column */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          <div>
            <label htmlFor="animation-prompt" className="block font-medium text-gray-300 mb-2">Animation Style (Optional):</label>
            <input
              id="animation-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'exploding with sparkles'"
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-300 mb-2">Aspect Ratio:</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-3 px-4 rounded-lg transition-colors ${aspectRatio === '16:9' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                16:9 Landscape
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-3 px-4 rounded-lg transition-colors ${aspectRatio === '9:16' ? 'bg-sky-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                9:16 Portrait
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            Generate Animation
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoGenerator;