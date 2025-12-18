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

  // Step 1: Generate the PNG logo first.
  const pngPrompt = `A professional, modern, minimalist logo for a company that does "${description}". Flat design, vector style, on a transparent background, high contrast, PNG format.`;
  
  const pngResponse = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: pngPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '1:1',
    },
  });

  const pngBase64 = pngResponse.generatedImages?.[0]?.image.imageBytes;

  if (!pngBase64) {
    throw new Error("Failed to generate the initial PNG logo image.");
  }

  // Step 2: Use the generated PNG as a visual reference to generate the SVG.
  const svgPrompt = `You are an expert vector artist specializing in SVG conversion.
Analyze the provided PNG image of a logo and convert it into clean, simple, flat-style SVG code.
The original text description for this logo was: "${description}".

RULES:
- The SVG code must be a single, self-contained block.
- Replicate the shapes, colors, and overall style of the provided image as closely as possible.
- Use a viewBox="0 0 100 100".
- The background MUST be transparent.
- Use simple shapes (<path>, <circle>, <rect>, etc.) and flat colors. No gradients or complex filters.
- Do not include any raster data (like <image> tags).
- Do not include any scripts.
- The entire output should be ONLY the SVG code, starting with <svg> and ending with </svg>. Do not include markdown fences like \`\`\`svg or any explanations.`;

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: pngBase64,
    },
  };
  const textPart = { text: svgPrompt };
  
  const svgResponse = await ai.models.generateContent({
    model: 'gemini-2.5-pro', // Using a powerful model for visual analysis
    contents: { parts: [imagePart, textPart] },
  });

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
  
  // If SVG generation fails, we still have the PNG, but we'll treat it as a failure for consistency
  // since the user expects both.
  throw new Error("Successfully generated PNG, but failed to convert it to SVG.");
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