
export interface Floor {
  originalImage: File | null;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}