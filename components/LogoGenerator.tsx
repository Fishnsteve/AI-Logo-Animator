import React, { useState, useRef, useCallback } from 'react';

interface LogoGeneratorProps {
  onGenerate: (description: string) => void;
  onUpload: (base64: string) => void;
}

const LogoGenerator: React.FC<LogoGeneratorProps> = ({ onGenerate, onUpload }) => {
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onGenerate(description);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await fileToBase64(file);
          onUpload(base64);
        } catch (error) {
          console.error("Error converting file to base64", error);
        }
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  }, [onUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300">
      <h2 className="text-2xl font-semibold text-center text-sky-300 mb-6">Step 1: Create Your Logo</h2>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Option 1: Describe Logo */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <label htmlFor="description" className="font-medium text-gray-300">Describe your company or logo idea:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 'a coffee shop called The Daily Grind with a mountain theme'"
            className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors placeholder-gray-500"
            required
          />
          <button
            type="submit"
            disabled={!description.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
          >
            Generate with AI
          </button>
        </form>

        {/* Separator */}
        <div className="relative hidden md:flex items-center justify-center h-full">
            <div className="h-full w-px bg-gray-600"></div>
            <span className="absolute bg-gray-800 px-3 text-gray-400">OR</span>
        </div>

        {/* Option 2: Upload */}
        <div className="flex flex-col space-y-4 text-center">
          <p className="font-medium text-gray-300 md:pt-0 pt-4 md:border-t-0 border-t border-gray-600">Upload your own image:</p>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 h-32 border-2 ${dragOver ? 'border-sky-500 bg-gray-700/50' : 'border-dashed border-gray-600'} rounded-lg cursor-pointer transition-colors`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-400">
                {dragOver ? "Drop your image here" : "Drag & drop or click to upload"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoGenerator;
