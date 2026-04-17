"""
NutriGame YOLOv8l - Model Evaluation Script
Test seti üzerinde mAP, precision, recall ve per-class metrikler hesaplar.
"""

from ultralytics import YOLO
from pathlib import Path
import pandas as pd
import numpy as np
import yaml
import json

# ─── AYARLAR 
WEIGHTS    = Path(__file__).parent / "weights" / "best.pt"
DATA_YAML  = Path(__file__).parent / "yolov8_l_newdata" / "data.yaml"
IMGSZ      = 640
CONF_THRES = 0.5   # confidence threshold
IOU_THRES  = 0.50   # IoU threshold for mAP50
SAVE_JSON  = True   # COCO JSON formatında sonuçları kaydet
SAVE_TXT   = False  # Her görsel için .txt sonuç kaydet


def load_class_names(data_yaml: Path) -> list[str]:
    with open(data_yaml) as f:
        data = yaml.safe_load(f)
    return data["names"]


def run_validation(model: YOLO, data_yaml: Path) -> dict:
    metrics = model.val(
        data=str(data_yaml),
        split="test",          
        imgsz=IMGSZ,
        conf=CONF_THRES,
        iou=IOU_THRES,
        save_json=SAVE_JSON,
        save_txt=SAVE_TXT,
        plots=True,
        verbose=True,
    )
    return metrics


def print_overall_metrics(metrics) -> dict:
    print("\n" + "=" * 60)
    print("  GENEL METRİKLER (tüm sınıflar ortalaması)")
    print("=" * 60)

    results = {
        "acc"
        "mAP50":      float(metrics.box.map50),
        "mAP50-95":   float(metrics.box.map),
        "Precision":  float(metrics.box.mp),
        "Recall":     float(metrics.box.mr),
    }

    for name, val in results.items():
        print(f"  {name:<15} : {val:.4f}  ({val*100:.2f}%)")

    print("=" * 60)
    return results



def save_results(overall: dict, df: pd.DataFrame, out_dir: Path):
    """Sonuçları JSON ve CSV olarak kaydeder."""
    out_dir.mkdir(parents=True, exist_ok=True)

    # Genel metrikler
    json_path = out_dir / "test_metrics_overall.json"
    with open(json_path, "w") as f:
        json.dump(overall, f, indent=2)
    print(f"  Genel metrikler : {json_path}")




def main():
    print(f"Model ağırlıkları : {WEIGHTS}")
    print(f"Data YAML         : {DATA_YAML}")

    if not WEIGHTS.exists():
        raise FileNotFoundError(f"Model ağırlığı bulunamadı: {WEIGHTS}")
    if not DATA_YAML.exists():
        raise FileNotFoundError(f"data.yaml bulunamadı: {DATA_YAML}")

    class_names = load_class_names(DATA_YAML)
    print(f"Sınıf sayısı      : {len(class_names)}")

    model = YOLO(str(WEIGHTS))

    metrics = run_validation(model, DATA_YAML)

    overall = print_overall_metrics(metrics)

    out_dir = Path(__file__).parent / "test_results"



if __name__ == "__main__":
    main()
