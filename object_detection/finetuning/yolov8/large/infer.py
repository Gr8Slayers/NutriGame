from ultralytics import YOLO
import torch
import os

# YOLOv8m model yükle 
model = YOLO(r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\yolov8\large\yolov8_l_newdata\runs\detect\runs\weights\best.pt")

# Image listesi
image_dir = r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\yolov8\images'
images = [os.path.join(image_dir, img) for img in os.listdir(image_dir) if img.lower().endswith(('.jpg', '.jpeg', '.png'))]

# Inference
results = model(images, conf=0.4)  # Optimal threshold ekledim

# Output klasörü oluştur
output_dir = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\yolov8\large\infer_results"
os.makedirs(output_dir, exist_ok=True)

# Process results
for i, result in enumerate(results):
    # Orijinal dosya adını al
    base_name = os.path.basename(images[i])
    
    # Sonucu kaydet
    output_path = os.path.join(output_dir, base_name)
    result.save(filename=output_path)
    
    print(f"Saved: {base_name}")
    
    # Ekranda göster (isteğe bağlı)
    # result.show()