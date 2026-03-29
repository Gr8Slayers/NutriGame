export interface DetectionResult {
    success: boolean;
    detections: Array<{
        class: string;
        confidence: number;
        estimatedCalories: number | null;
    }>;
    totalCalories: number;
    raw_text: string;
    annotated_image: { url: string } | null;
}

export function analyzeFoodFromHF(imagePath: string | Buffer): Promise<DetectionResult>;
export function analyzeBatchFromHF(images: Array<string | Buffer>): Promise<DetectionResult[]>;
