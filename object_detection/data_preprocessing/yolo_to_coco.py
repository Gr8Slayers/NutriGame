#!/usr/bin/env python3
"""
YOLO formatından COCO JSON formatına dönüştürme scripti.
coco_to_yolo.py'nin tam tersi mantığı.

Kullanım:
    python yolo_to_coco.py \
        --data-yaml path/to/data.yaml \
        --labels-dir path/to/labels/train \
        --images-dir path/to/images/train \
        --output-json path/to/output_train.json \
        --split train
"""

import json
import os
import argparse
import yaml
from pathlib import Path
from PIL import Image


def convert_yolo_bbox_to_coco(x_center, y_center, w_norm, h_norm, img_width, img_height):
    """
    YOLO bbox formatından COCO formatına çevir.
    YOLO: [x_center, y_center, width, height] (normalized 0-1)
    COCO: [x_min, y_min, width, height] (pixel)
    """
    w = w_norm * img_width
    h = h_norm * img_height
    x_min = (x_center - w_norm / 2) * img_width
    y_min = (y_center - h_norm / 2) * img_height
    return [x_min, y_min, w, h]


def get_image_size(image_path):
    """Görsel boyutunu döndür."""
    try:
        with Image.open(image_path) as img:
            return img.width, img.height
    except Exception:
        return None, None


def yolo_to_coco(data_yaml_path, labels_dir, images_dir, output_json_path, split_name="train"):
    """
    Bir split için YOLO formatındaki verileri COCO JSON'a çevir.

    Args:
        data_yaml_path: data.yaml dosyasının yolu (sınıf isimlerini almak için)
        labels_dir: YOLO .txt label dosyalarının bulunduğu dizin
        images_dir: Görsel dosyalarının bulunduğu dizin
        output_json_path: Çıktı COCO JSON dosyasının yolu
        split_name: Split ismi (bilgi amaçlı)
    """
    print(f"\n {split_name.upper()} split işleniyor...")
    print(f"   Labels: {labels_dir}")
    print(f"   Images: {images_dir}")

    # data.yaml'dan sınıf isimlerini oku
    with open(data_yaml_path, 'r', encoding='utf-8') as f:
        data_config = yaml.safe_load(f)

    class_names = data_config.get('names', [])
    num_classes = data_config.get('nc', len(class_names))

    # COCO kategorilerini oluştur (0-indexed)
    categories = [{"id": i, "name": name} for i, name in enumerate(class_names)]

    coco_data = {
        "info": {"description": f"Converted from YOLO format - {split_name} split"},
        "licenses": [],
        "images": [],
        "annotations": [],
        "categories": categories
    }

    labels_path = Path(labels_dir)
    images_path = Path(images_dir)

    image_id = 0
    annotation_id = 0
    missing_images = 0
    processed = 0

    # Desteklenen görsel uzantıları
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

    label_files = sorted(labels_path.glob('*.txt'))
    print(f"   {len(label_files)} label dosyası bulundu.")

    for label_file in label_files:
        stem = label_file.stem

        # İlgili görsel dosyasını bul
        image_file = None
        for ext in image_extensions:
            candidate = images_path / (stem + ext)
            if candidate.exists():
                image_file = candidate
                break

        if image_file is None:
            missing_images += 1
            if missing_images <= 5:
                print(f"    Görsel bulunamadı: {stem}")
            continue

        # Görsel boyutunu al
        img_width, img_height = get_image_size(image_file)
        if img_width is None:
            print(f"    Görsel okunamadı: {image_file.name}")
            continue

        # COCO image kaydı
        image_record = {
            "id": image_id,
            "file_name": image_file.name,
            "width": img_width,
            "height": img_height
        }
        coco_data["images"].append(image_record)

        # Label dosyasını oku
        with open(label_file, 'r') as f:
            lines = f.read().strip().splitlines()

        for line in lines:
            line = line.strip()
            if not line:
                continue

            parts = line.split()
            if len(parts) != 5:
                continue

            class_id = int(parts[0])
            x_center = float(parts[1])
            y_center = float(parts[2])
            w_norm = float(parts[3])
            h_norm = float(parts[4])

            # COCO formatına çevir
            coco_bbox = convert_yolo_bbox_to_coco(
                x_center, y_center, w_norm, h_norm, img_width, img_height
            )

            area = coco_bbox[2] * coco_bbox[3]

            annotation = {
                "id": annotation_id,
                "image_id": image_id,
                "category_id": class_id,
                "bbox": coco_bbox,
                "area": area,
                "segmentation": [],
                "iscrowd": 0
            }
            coco_data["annotations"].append(annotation)
            annotation_id += 1

        image_id += 1
        processed += 1

        if processed % 1000 == 0:
            print(f"   İşlenen: {processed} görsel...")

    # Çıktı dizinini oluştur ve kaydet
    output_path = Path(output_json_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(coco_data, f, indent=2, ensure_ascii=False)

    print(f"    {processed} görsel, {annotation_id} annotation işlendi.")
    if missing_images > 0:
        print(f"    {missing_images} görsel eksikti.")
    print(f"    Kaydedildi: {output_json_path}")

    return coco_data


def main():
    parser = argparse.ArgumentParser(description='YOLO to COCO Converter')
    parser.add_argument('--data-yaml', required=True,
                        help='data.yaml dosyasının yolu (sınıf isimlerini almak için)')
    parser.add_argument('--labels-dir', required=True,
                        help='YOLO .txt label dosyalarının dizini')
    parser.add_argument('--images-dir', required=True,
                        help='Görsel dosyalarının dizini')
    parser.add_argument('--output-json', required=True,
                        help='Çıktı COCO JSON dosyasının yolu')
    parser.add_argument('--split', default='train',
                        help='Split ismi (train/val/test)')

    # Tüm splitleri tek seferde dönüştürme modu
    parser.add_argument('--all-splits', action='store_true',
                        help='Tüm splitleri dönüştür (data.yaml\'daki path\'i kullanır)')
    parser.add_argument('--yolo-root', default=None,
                        help='--all-splits ile kullanılır: YOLO dataset kök dizini')
    parser.add_argument('--output-dir', default=None,
                        help='--all-splits ile kullanılır: Çıktı COCO JSON dizini')

    args = parser.parse_args()

    if args.all_splits:
        if not args.yolo_root or not args.output_dir or not args.data_yaml:
            print("--all-splits için --yolo-root, --output-dir ve --data-yaml gereklidir.")
            return

        root = Path(args.yolo_root)
        out_dir = Path(args.output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        for split in ['train', 'val', 'test']:
            labels_dir = root / 'labels' / split
            images_dir = root / 'images' / split
            if not labels_dir.exists():
                print(f" {split} labels dizini bulunamadı, atlanıyor.")
                continue
            yolo_to_coco(
                data_yaml_path=args.data_yaml,
                labels_dir=str(labels_dir),
                images_dir=str(images_dir),
                output_json_path=str(out_dir / f'instances_{split}.json'),
                split_name=split
            )
        print(f"\n Tüm splitler dönüştürüldü → {args.output_dir}")
    else:
        yolo_to_coco(
            data_yaml_path=args.data_yaml,
            labels_dir=args.labels_dir,
            images_dir=args.images_dir,
            output_json_path=args.output_json,
            split_name=args.split
        )


if __name__ == "__main__":
    main()
