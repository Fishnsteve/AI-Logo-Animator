import { GoogleGenAI } from "@google/genai";
import type { AspectRatio } from '../types';

const VEO_LOADING_MESSAGES = [
  "Warming up the animation engine...",
  "Sketching the keyframes...",
  "Adding digital ink and paint...",
  "Rendering the final cut...",
  "Polishing the pixels...",
  "This is taking a bit longer than usual, but good things are coming!",
  "Finalizing the masterpiece...",
];

export const generateLogo = async (description: string): Promise<{ pngBase64: string; svgCode: string } | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const pngPrompt = `A professional, modern, minimalist logo for a company that does "${description}". Flat design, vector style, on a transparent background, high contrast, PNG format.`;

  const svgPrompt = `You are an expert SVG logo designer. Create the SVG code for a professional, modern, minimalist logo for a company. The logo should be inspired by this description: "${description}".
RULES:
- The SVG code must be a single, self-contained block.
- Use a viewBox="0 0 100 100".
- The background must be transparent.
- Use simple shapes and flat colors.
- Do not include any raster data (like <image> tags).
- Do not include any scripts.
- The entire output should be ONLY the SVG code, starting with <svg> and ending with </svg>. Do not include markdown fences like \`\`\`svg or explanations.`;

  // Run both requests in parallel for efficiency
  const [pngResponse, svgResponse] = await Promise.all([
    ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: pngPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    }),
    ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: svgPrompt,
    })
  ]);

  const pngBase64 = pngResponse.generatedImages?.[0]?.image.imageBytes;
  let svgCode = svgResponse.text?.trim() ?? '';

  // Clean up potential markdown fences from the SVG response
  if (svgCode.startsWith('```svg')) {
    svgCode = svgCode.substring(5).trim();
  } else if (svgCode.startsWith('```')) {
    svgCode = svgCode.substring(3).trim();
  }
  if (svgCode.endsWith('```')) {
    svgCode = svgCode.slice(0, -3).trim();
  }
  
  if (pngBase64 && svgCode) {
    return { pngBase64, svgCode };
  }

  return null;
};


export const generateVideo = async (
  prompt: string,
  imageBase64: string,
  aspectRatio: AspectRatio,
  onProgress: (message: string) => void
): Promise<Blob> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  // Create a new instance every time to ensure the latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let messageIndex = 0;
  onProgress(VEO_LOADING_MESSAGES[messageIndex]);
  const progressInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % VEO_LOADING_MESSAGES.length;
    onProgress(VEO_LOADING_MESSAGES[messageIndex]);
  }, 5000);

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'A cool, dynamic animation of this logo.',
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio,
      },
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    clearInterval(progressInterval);
    onProgress("Fetching your video...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was found.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video. Status: ${videoResponse.statusText}`);
    }
    
    return await videoResponse.blob();

  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
};