"""
NutriGame RT-DETR-l Fine-tuning
Dataset : processed_datasets/merged  (76816 gorsel, 115 sinif)
Model   : rtdetr-l.pt (pretrained COCO)
GPU     : H100 80GB

Not: Ultralytics RT-DETR, YOLOv8 ile ayni data.yaml formatini kullanir.
     COCO JSON donusumune gerek yoktur.
"""

from ultralytics import RTDETR
from pathlib import Path

DATA_YAML = Path("data.yaml")
PROJECT   = Path("runs")
RUN_NAME  = "nutrigame_rtdetr_l"

model = RTDETR("rtdetr-l.pt")

results = model.train(
    data      = str(DATA_YAML),
    epochs    = 100,
    imgsz     = 640,
    batch     = 16,
    workers   = 8,
    device    = 0,
    project   = str(PROJECT),
    name      = RUN_NAME,
    exist_ok  = False,
    patience  = 20,
    save      = True,
    plots     = True,
    val       = True,
    cache     = "ram",
    optimizer = "AdamW",
)

print(f"\nEgitim tamamlandi.")
print(f"En iyi model : {PROJECT / RUN_NAME / 'weights' / 'best.pt'}")
