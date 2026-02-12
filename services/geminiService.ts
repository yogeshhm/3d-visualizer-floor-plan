import { GoogleGenAI } from "@google/genai";

const MASTER_PROMPT = `
You are an architectural visualization AI. Convert the provided 2D floor plan into a top-down, isometric, photorealistic 3D render. Prioritize structural accuracy and visual consistency above all else.

**1. Structural Blueprint Analysis (Highest Priority):**
- **Goal:** Recreate the 2D blueprint's structure with 100% accuracy. Do not alter proportions, move walls, or change layouts.
- **Extract & Render the following elements precisely as they appear in the 2D plan:**
    - Walls, doors (including swing arcs), and windows.
    - Staircases: Render individual steps, landings, and handrails. Ensure there's a corresponding opening in the floor slab. Match the 'UP' direction arrow exactly.
    - Open-Air Spaces (e.g., 'terrace', 'balcony'): Use low railings or parapet walls, not full-height walls. Their floor should be durable stone/paver tiles (#9E9E9E).
    - Room Labels: Find all text labels on the blueprint (e.g., 'Living', 'Bed 1', 'Utility') and render them as simple, dark gray text (#333333) floating just above the floor in the center of their respective rooms.
    - Exterior Context: Place the entire building on a simple, flat, light concrete ground plane (#D0D0D0) that extends a few feet from the exterior walls.
    - Vehicles: If a car outline is shown in a garage, render a simple 3D car model in its place.

**2. Visual Style (Mandatory & Unchanging):**
- **View:** Fixed top-down isometric.
- **Lighting:** Flat, even, ambient. **RENDER NO SHADOWS.** This is a critical instruction.
- **Style:** Clean, minimalist, and professional.
- **Materials:**
    - Walls: Matte off-white paint (#F5F5F5).
    - Main Flooring: Light-colored porcelain tiles (#E0E0E0) with thin, light gray grout lines (#CCCCCC).
    - Bathroom Flooring: Small, non-slip square gray tiles (#BDBDBD) with slightly darker gray grout (#A0A0A0).
    - Door & Window Frames: Dark gray metal (#424242).

**3. Furnishing (Controlled):**
- Only place furniture if a room's function is clearly identified by a label.
- Keep all entrances, hallways, and major pathways completely clear of objects.
- If a room's purpose is not labeled, leave it completely empty.

**Final Instruction:** Generate one high-quality 3D render based on these rules.
`;

const resizeImage = (file: File): Promise<Blob> => {
  const MAX_WIDTH = 1024;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Could not read file for resizing."));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        if (img.width <= MAX_WIDTH) {
          // If image is already small enough, resolve with the original file blob
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const scaleFactor = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleFactor;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context for resizing.'));
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed.'));
          }
        }, 'image/jpeg', 0.9); // Use jpeg for efficiency
      };
      img.onerror = (err) => reject(new Error(`Image load failed: ${err}`));
    };
    reader.onerror = (err) => reject(new Error(`File reader error: ${err}`));
  });
};


const fileToBase64 = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the data:image/*;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });


export const generate3dFloorPlan = async (floorPlanFile: File, modelName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const resizedImageBlob = await resizeImage(floorPlanFile);
  const floorPlanBase64 = await fileToBase64(resizedImageBlob);

  const finalPrompt = MASTER_PROMPT;
  const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [];

  const floorPlanPart = {
    inlineData: {
      data: floorPlanBase64,
      mimeType: resizedImageBlob.type,
    },
  };

  parts.push({ text: finalPrompt }, floorPlanPart);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: parts },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64Image = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64Image}`;
    }
  }

  throw new Error("No image was generated by the API.");
};