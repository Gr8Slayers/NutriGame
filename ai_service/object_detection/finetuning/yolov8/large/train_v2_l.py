"""
NutriGame YOLOv8l Fine-tuning - v2
Dataset : processed_datasets/merged  (76816 gorsel, 115 sinif)
Model   : yolov8l.pt (pretrained COCO)
GPU     : H100 80GB
"""

from ultralytics import YOLO
from pathlib import Path

DATA_YAML = Path("data.yaml")
PROJECT   = Path("runs")
RUN_NAME  = "nutrigame_v2_yolov8l"

model = YOLO("yolov8l.pt")

results = model.train(
    data       = str(DATA_YAML),
    epochs     = 100,
    imgsz      = 640,
    batch      = 32,
    workers    = 8,
    device     = 0,
    project    = str(PROJECT),
    name       = RUN_NAME,
    exist_ok   = False,
    pretrained = True,
    optimizer  = "auto",
    patience   = 20,
    save       = True,
    plots      = False,
    val        = True,
    cache      = False,
)

print(f"\nEgitim tamamlandi.")
print(f"En iyi model : {PROJECT / RUN_NAME / 'weights' / 'best.pt'}")
