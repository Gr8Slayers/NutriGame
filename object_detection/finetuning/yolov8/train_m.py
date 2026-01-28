from ultralytics import YOLO
import torch

# YOLOv8m model yükle 
model = YOLO("yolov8m.pt")

# Turkish Food Dataset için fine-tuning
results = model.train(
    data="data.yaml",                   # Dataset config
    epochs=150,                          
    imgsz=640,                           # Standard image size  
    batch=32                            
)
