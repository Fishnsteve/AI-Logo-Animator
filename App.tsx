import React, { useState, useCallback } from 'react';
import { generateLogo, generateVideo } from './services/geminiService';
import type { AspectRatio } from './types';
import LogoGenerator from './components/LogoGenerator';
import VideoGenerator from './components/VideoGenerator';
import Header from './components/Header';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [step, setStep] = useState<'generate' | 'animate'>('generate');
  const [logoImageBase64, setLogoImageBase64] = useState<string | null>(null);
  const [logoSvgCode, setLogoSvgCode] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(true); // Assume true initially

  const handleLogoGeneration = async (description: string) => {
    setError(null);
    setIsGeneratingLogo(true);
    try {
      const result = await generateLogo(description);
      if (result) {
        setLogoImageBase64(result.pngBase64);
        setLogoSvgCode(result.svgCode);
        setStep('animate');
      } else {
        throw new Error('Logo generation failed to return an image and/or SVG.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during logo generation.');
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleImageUpload = (base64: string) => {
    setError(null);
    setLogoImageBase64(base64);
    setLogoSvgCode(null); // Can't generate SVG for an upload
    setStep('animate');
  };

  const handleVideoGeneration = useCallback(async (prompt: string, aspectRatio: AspectRatio) => {
    if (!logoImageBase64) {
      setError('No logo image available to animate.');
      return;
    }
    
    setError(null);

    // VEO API Key check
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setApiKeySelected(false);
        setError("Please select an API key to generate videos. You may need to enable billing for your project.");
        return;
      }
      setApiKeySelected(true);
    } catch (e) {
       setApiKeySelected(false);
       setError("Could not verify API key. Please select one to proceed.");
       return;
    }


    setIsGeneratingVideo(true);
    setVideoUrl(null);

    try {
      const videoBlob = await generateVideo(
        prompt,
        logoImageBase64,
        aspectRatio,
        (message) => setVideoLoadingMessage(message)
      );
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during video generation.';
      setError(errorMessage);
      if (errorMessage.includes("Requested entity was not found")) {
        setError("Your API key is invalid. Please select a new key and ensure billing is enabled for your project.");
        setApiKeySelected(false);
      }
    } finally {
      setIsGeneratingVideo(false);
      setVideoLoadingMessage('');
    }
  }, [logoImageBase64]);

  const handleSelectKey = async () => {
    try {
        await window.aistudio.openSelectKey();
        // Assume key selection is successful and let the user retry
        setApiKeySelected(true); 
        setError(null); // Clear previous errors
    } catch (e) {
        setError("Failed to open the API key selection dialog.");
    }
  };

  const handleStartOver = () => {
    setStep('generate');
    setLogoImageBase64(null);
    setLogoSvgCode(null);
    setVideoUrl(null);
    setError(null);
    setIsGeneratingLogo(false);
    setIsGeneratingVideo(false);
    setApiKeySelected(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4">
      <Header />
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col justify-center">
        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                {!apiKeySelected && (
                  <div className="mt-2">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline mr-4 text-sm">
                      Billing Info
                    </a>
                    <button onClick={handleSelectKey} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 rounded text-sm">
                      Select API Key
                    </button>
                  </div>
                )}
            </div>
        )}

        {isGeneratingLogo && <Spinner message="Designing your unique logo (PNG & SVG)..." />}
        {isGeneratingVideo && <Spinner message={videoLoadingMessage} />}
        
        {!isGeneratingLogo && !isGeneratingVideo && (
          <>
            {step === 'generate' && (
              <LogoGenerator onGenerate={handleLogoGeneration} onUpload={handleImageUpload} />
            )}
            {step === 'animate' && logoImageBase64 && (
              <VideoGenerator
                logoImage={logoImageBase64}
                logoSvgCode={logoSvgCode}
                videoUrl={videoUrl}
                onGenerate={handleVideoGeneration}
                onStartOver={handleStartOver}
              />
            )}
          </>
        )}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. For demo purposes only.</p>
      </footer>
    </div>
  );
};

export default App;