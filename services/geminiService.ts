import { GoogleGenAI } from "@google/genai";

const MASTER_PROMPT = `
ARCHITECTURAL 3D PROJECT MODE - UNIFIED BUILDING DIRECTIVE

CRITICAL DIRECTIVE: You are generating one floor of a SINGLE, UNIFIED multi-floor building. Visual consistency is the absolute highest priority. Every floor you generate for this project MUST look like it belongs to the same building, designed by the same architect, with the same materials and style. ANY deviation will be considered a failure.

You are a professional architectural visualization system.
Convert the provided 2D floor plan into a photorealistic, top-down isometric 3D render.

------------------------------------------------------------
STRUCTURAL EXTRACTION MODE (HIGHEST PRIORITY)
------------------------------------------------------------
Treat the input image as a technical architectural blueprint.

Before rendering:
1. Identify all wall segments.
2. Identify all door openings.
3. Identify all door swing arcs.
4. Identify all window openings.
5. Identify staircase location and direction.
6. Identify areas labeled 'terrace', 'balcony', or 'patio'.
7. Identify all text labels for rooms and spaces (e.g., 'Living', 'Bed 1', 'Utility', 'Passage').

Then reproduce them EXACTLY.

STRICT REQUIREMENTS:
- Do NOT move walls, resize rooms, or alter proportions.
- Structural precision is more important than visual beautification.

------------------------------------------------------------
ROOM IDENTIFICATION & LABELING (HIGH PRIORITY)
------------------------------------------------------------
- Find all text labels on the 2D blueprint that identify rooms or areas (e.g., "Living Room", "Kitchen", "Utility", "Passage", "W.C.").
- Render these labels as simple, non-intrusive text floating just above the floor in the center of their corresponding rooms in the 3D model.
- The text must be clean, sans-serif, dark gray (#333333), and easily readable.
- This labeling is critical for making the plan understandable.

------------------------------------------------------------
EXTERIOR CONTEXT
------------------------------------------------------------
- To showcase the "inside" vs "outside", render a simple, flat ground plane around the entire building footprint.
- This ground should be a neutral light concrete texture (Hex: #D0D0D0) and extend a few virtual feet from all exterior walls.
- This provides context and prevents the building from looking like it is floating in a void.

------------------------------------------------------------
TERRACE & BALCONY RULES (HIGH PRIORITY)
------------------------------------------------------------
- Areas marked as 'terrace', 'balcony', or 'patio' are OPEN-AIR spaces.
- Do NOT render full-height walls around these areas.
- Do NOT add windows to these areas.
- Instead, enclose these spaces with a low-profile, modern railing or a short parapet wall (approximately 1 meter high).
- The floor of the terrace/balcony should be rendered with durable, large-format stone or concrete paver tiles (Hex: #9E9E9E) with visible, dark gray grout lines (Hex: #616161).

------------------------------------------------------------
STAIRCASE RULES (HIGHEST STRUCTURAL PRIORITY)
------------------------------------------------------------
- The staircase is the most critical connection between floors. Its accuracy is paramount.
- The lines within the staircase rectangle on the blueprint represent individual steps. Render them as such.
- Position and orientation MUST match the blueprint exactly.
- Identify the direction of ascent from the blueprint (often indicated by an arrow and/or the label 'UP'). The 3D stairs must follow this direction precisely.
- Render each individual step, any landings, and simple, modern handrails.
- Crucially, render a corresponding void or opening in the floor slab for the staircase to pass through.
- The staircase must be a passable, functional, and unobstructed 3D object that clearly connects to the level above or below.
- Do NOT rotate, resize, redesign, or misinterpret the staircase.

------------------------------------------------------------
DOOR & WINDOW RULES
------------------------------------------------------------
- Door and window count and placement must match exactly.
- Door swing direction must match exactly.
- Do NOT add or remove any doors or windows.

------------------------------------------------------------
GLOBAL VISUAL LOCK (NON-NEGOTIABLE)
------------------------------------------------------------
This visual identity is LOCKED for the entire project. Do NOT deviate.

CAMERA:
- Fixed top-down isometric view only.
- NO perspective variation.

MATERIALS & STYLE (MANDATORY):
- WALLS: Matte, off-white paint (Hex: #F5F5F5). No textures.
- FLOORING: Light-colored porcelain tiles (Hex: #E0E0E0) laid in a grid pattern with thin, light gray grout lines (Hex: #CCCCCC). The tiles should have a subtle, non-uniform texture.
- BATHROOM FLOORING: Small, non-slip square gray tiles (Hex: #BDBDBD) with slightly darker gray grout lines (Hex: #A0A0A0).
- DOORS & WINDOW FRAMES: Simple, dark gray metal (Hex: #424242).
- STYLE: A clean, minimalist, and professional architectural visualization.
- High realism is required.

The material and color palette specified above is MANDATORY. Do not introduce new colors or materials.

LIGHTING & SHADOWS:
- Use flat, even, ambient lighting ONLY.
- The final render must be completely SHADOWLESS. Do NOT render any shadows from walls, furniture, or any other objects. This is a strict requirement.

------------------------------------------------------------
INTERIOR PLACEMENT RULES (CONTROLLED MODE)
------------------------------------------------------------
- CRITICAL: Entrances, hallways, and major pathways must remain completely clear. Do NOT place any objects that would obstruct movement.
- Only place furniture if the room function is clearly identifiable from its label.
- Do NOT guess room purpose or invent decorative elements if not labeled.
- Maintain clear walking paths and realistic spacing. Do NOT block doors or windows.
- If room purpose is unclear, leave the room empty.

------------------------------------------------------------
EXTERIOR & VEHICLE RULES
------------------------------------------------------------
- If the blueprint shows a garage containing the outline of a car, render a simple, modern 3D model of a car in that position.
- Do NOT add cars if they are not explicitly drawn in the 2D plan.

------------------------------------------------------------
FINAL INSTRUCTION
------------------------------------------------------------
Generate ONE high-quality 3D render for this floor only.
Follow all structural and visual rules strictly.
`;

const fileToBase64 = (file: File): Promise<string> =>
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


export const generate3dFloorPlan = async (floorPlanFile: File): Promise<string> => {
  // if (!process.env.API_KEY) {
  //   throw new Error("API_KEY environment variable not set");
  // }

  // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });


  const floorPlanBase64 = await fileToBase64(floorPlanFile);

  const finalPrompt = MASTER_PROMPT;
  const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [];

  const floorPlanPart = {
    inlineData: {
      data: floorPlanBase64,
      mimeType: floorPlanFile.type,
    },
  };

  parts.push({ text: finalPrompt }, floorPlanPart);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
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