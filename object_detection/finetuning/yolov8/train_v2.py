"""
YOLOv8m fine-tuning v2 - Iyilestirilmis hyperparametreler.

train_m.py uzerindeki sorunlar:
  - lrf=0.01 (lr0 ile ayni) -> cosine decay calismiyordu
  - cos_lr=False -> learning rate schedule yoktu
  - dropout=0.0 -> 85 sinif icin regularizasyon yetersiz
  - cls=0.5 -> classification loss dusuk, az ornekli siniflar ogrenmiyordu
  - mixup/copy_paste kullanilmiyordu

Kullanim:
  cd object_detection/finetuning/yolov8
  python train_v2.py

  # Farkli model ile:
  python train_v2.py --model yolov8l.pt --epochs 250

  # Resume:
  python train_v2.py --resume path/to/last.pt
"""

import argparse
from pathlib import Path
from ultralytics import YOLO


def train(model_path="yolov8m.pt", data_yaml="data.yaml", epochs=200,
          batch=16, imgsz=640, resume=False, project="results_v2", name="train"):

    if resume:
        model = YOLO(model_path)
    else:
        model = YOLO(model_path)

    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=project,
        name=name,

        # --- Learning rate ---
        lr0=0.01,
        lrf=0.001,          # Cosine decay: lr0 * lrf = final LR (mevcut: 0.01*0.01=ayni)
        cos_lr=True,        # Cosine learning rate schedule (mevcut: False)
        warmup_epochs=5,    # Daha uzun warmup (mevcut: 3)
        warmup_bias_lr=0.1,

        # --- Regularizasyon ---
        weight_decay=0.0005,
        dropout=0.1,        # Light dropout (mevcut: 0.0)

        # --- Loss weights ---
        # cls: siniflandirma loss agirligi
        # Arttirilinca az ornekli siniflar daha iyi ogrenilir
        cls=1.0,            # (mevcut: 0.5)
        box=7.5,            # bbox regression (default)
        dfl=1.5,            # distribution focal loss (default)

        # --- Augmentasyon ---
        mixup=0.1,          # Sinif cesitliligi icin (mevcut: 0.0)
        copy_paste=0.1,     # Kucuk objeler icin (mevcut: 0.0)
        degrees=10.0,       # Hafif rotation (yemek fotograflari icin uygun)
        hsv_h=0.015,        # HSV hue augmentation
        hsv_s=0.7,          # HSV saturation augmentation
        hsv_v=0.4,          # HSV value augmentation
        flipud=0.0,         # Dikey flip yok (yemek fotolari icin genellikle uygun degil)
        fliplr=0.5,         # Yatay flip (default)
        mosaic=1.0,         # Mozaik augmentation (default)
        erasing=0.4,        # Random erasing

        # --- Training control ---
        patience=50,        # Early stopping (mevcut: 100, azaltildi)
        save_period=25,     # Her 25 epoch'ta checkpoint kaydet
        resume=resume,

        # --- Performance ---
        workers=8,
        device=0,           # GPU 0; CPU icin: device='cpu'
        amp=True,           # Automatic Mixed Precision (hiz icin)

        # --- Freeze: Backbone'u dondur, head'i fine-tune et ---
        # YOLOv8m'de block 0-9 backbone'dur (COCO ozelliklerini korur)
        # Yeni dataset kucukse freeze=10 ile baslayip sonra unfreeze edebilirsin
        # Buyuk dataset varsa freeze=0 (tum agirliklar guncellenir)
        freeze=0,           # Buyuk dataset (55K+) icin tum katmanlar acik
                            # Kucuk dataset icin freeze=10 kullan
    )

    print(f"\nEgitim tamamlandi.")
    print(f"En iyi model: {project}/{name}/weights/best.pt")
    print(f"\nSonuclar:")
    print(f"  mAP@0.5:     {results.results_dict.get('metrics/mAP50(B)', 'N/A'):.4f}")
    print(f"  mAP@0.5-0.95: {results.results_dict.get('metrics/mAP50-95(B)', 'N/A'):.4f}")
    print(f"  Precision:   {results.results_dict.get('metrics/precision(B)', 'N/A'):.4f}")
    print(f"  Recall:      {results.results_dict.get('metrics/recall(B)', 'N/A'):.4f}")

    return results


def main():
    parser = argparse.ArgumentParser(description='YOLOv8 Turkish Food Detection - v2 Training')
    parser.add_argument('--model', default='yolov8m.pt',
                        help='Model yolu veya Ultralytics model adi (default: yolov8m.pt)')
    parser.add_argument('--data', default='data.yaml',
                        help='data.yaml dosyasi (default: data.yaml)')
    parser.add_argument('--epochs', type=int, default=200,
                        help='Egitim epoch sayisi (default: 200)')
    parser.add_argument('--batch', type=int, default=16,
                        help='Batch size (default: 16)')
    parser.add_argument('--imgsz', type=int, default=640,
                        help='Gorsel boyutu (default: 640)')
    parser.add_argument('--resume', default=None,
                        help='Resume egitim: last.pt yolu')
    parser.add_argument('--project', default='results_v2',
                        help='Sonuc dizini (default: results_v2)')
    parser.add_argument('--name', default='train',
                        help='Deney ismi (default: train)')

    args = parser.parse_args()

    model_path = args.resume if args.resume else args.model
    resume = args.resume is not None

    print(f"YOLOv8 Turkish Food Detection v2")
    print(f"  Model:  {model_path}")
    print(f"  Data:   {args.data}")
    print(f"  Epochs: {args.epochs}")
    print(f"  Batch:  {args.batch}")
    print(f"  Resume: {resume}")
    print()

    train(
        model_path=model_path,
        data_yaml=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        resume=resume,
        project=args.project,
        name=args.name
    )


if __name__ == "__main__":
    main()
