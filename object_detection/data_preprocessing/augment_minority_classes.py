#!/usr/bin/env python3
"""
Az ornekli (minority) siniflar icin hedefli veri augmentasyonu.
YOLO formatindaki label dosyalarini koruyarak gorsel augmentasyonu yapar.

Hedef: Her sinif icin minimum 'target_count' annotation saglamak.
Mevcut annotation sayisi 'target_count'un altinda olan siniflar
augmentasyon ile cogualtilir.

Gereksinim:
    pip install albumentations pillow

Kullanim:
    python augment_minority_classes.py \
        --labels-dir path/to/labels/train \
        --images-dir path/to/images/train \
        --output-labels-dir path/to/labels/train_aug \
        --output-images-dir path/to/images/train_aug \
        --data-yaml path/to/data.yaml \
        --target-count 200 \
        --max-multiplier 5
"""

import os
import random
import argparse
import shutil
import yaml
from pathlib import Path
from collections import defaultdict

try:
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    ALBUMENTATIONS_AVAILABLE = True
except ImportError:
    ALBUMENTATIONS_AVAILABLE = False
    print("UYARI: albumentations kurulu degil. pip install albumentations")

try:
    import numpy as np
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


# Augmentasyon pipeline - bbox-safe transformlar
def get_augmentation_pipeline(seed=None):
    """
    Gorsel augmentasyonu icin Albumentations pipeline.
    Tum transformlar bounding box koordinatlarini da donusturur.
    """
    if not ALBUMENTATIONS_AVAILABLE:
        return None

    transforms = [
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(
            brightness_limit=0.2,
            contrast_limit=0.2,
            p=0.6
        ),
        A.HueSaturationValue(
            hue_shift_limit=10,
            sat_shift_limit=20,
            val_shift_limit=10,
            p=0.4
        ),
        A.GaussNoise(var_limit=(5.0, 20.0), p=0.3),
        A.Blur(blur_limit=3, p=0.2),
        A.RandomScale(scale_limit=0.15, p=0.3),
        A.ShiftScaleRotate(
            shift_limit=0.05,
            scale_limit=0.1,
            rotate_limit=10,
            border_mode=0,       # border_mode=0: constant (siyah kenar)
            p=0.4
        ),
        A.ImageCompression(quality_lower=75, quality_upper=100, p=0.2),
    ]

    return A.Compose(
        transforms,
        bbox_params=A.BboxParams(
            format='yolo',       # YOLO: [x_center, y_center, w, h] normalized
            label_fields=['class_labels'],
            min_visibility=0.3,  # En az %30'u gorunur olmali
            min_area=0.001       # Minimum alan orani
        )
    )


def read_yolo_label(label_path):
    """
    YOLO .txt label dosyasini oku.
    Returns:
        list of [class_id, x_center, y_center, width, height]
    """
    annotations = []
    with open(label_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) == 5:
                class_id = int(parts[0])
                coords = [float(x) for x in parts[1:]]
                annotations.append([class_id] + coords)
    return annotations


def write_yolo_label(label_path, annotations):
    """
    YOLO formatinda label dosyasini yaz.
    """
    with open(label_path, 'w') as f:
        for ann in annotations:
            class_id = ann[0]
            coords = ann[1:]
            f.write(f"{class_id} {' '.join(f'{x:.6f}' for x in coords)}\n")


def augment_image(image_path, label_path, transform):
    """
    Tek bir gorsel-label ciftine augmentasyon uygula.

    Returns:
        (augmented_image_array, augmented_annotations) veya (None, None) hata durumunda
    """
    if not PIL_AVAILABLE or not ALBUMENTATIONS_AVAILABLE:
        return None, None

    annotations = read_yolo_label(label_path)
    if not annotations:
        return None, None

    try:
        image = np.array(Image.open(image_path).convert('RGB'))
    except Exception:
        return None, None

    # Albumentations YOLO format: [x_center, y_center, width, height] normalized
    bboxes = [ann[1:] for ann in annotations]
    class_labels = [ann[0] for ann in annotations]

    # Gecersiz bbox'lari filtrele (0-1 disinda olanlar)
    valid_bboxes = []
    valid_labels = []
    for bbox, label in zip(bboxes, class_labels):
        x_c, y_c, w, h = bbox
        if (0 < x_c < 1 and 0 < y_c < 1 and
                0 < w <= 1 and 0 < h <= 1):
            valid_bboxes.append(bbox)
            valid_labels.append(label)

    if not valid_bboxes:
        return None, None

    try:
        result = transform(
            image=image,
            bboxes=valid_bboxes,
            class_labels=valid_labels
        )
    except Exception:
        return None, None

    if not result['bboxes']:
        return None, None

    aug_image = result['image']
    aug_annotations = [
        [label] + list(bbox)
        for bbox, label in zip(result['bboxes'], result['class_labels'])
    ]

    return aug_image, aug_annotations


def count_class_annotations(labels_dir):
    """
    Labels dizinindeki sinif annotation sayilarini say.
    Returns:
        defaultdict: {class_id: annotation_count}
        dict: {image_stem: label_path}  (class_id -> [image_stems])
    """
    class_counts = defaultdict(int)
    class_to_images = defaultdict(list)

    labels_path = Path(labels_dir)
    for label_file in labels_path.glob('*.txt'):
        annotations = read_yolo_label(label_file)
        seen = set()
        for ann in annotations:
            class_id = ann[0]
            class_counts[class_id] += 1
            if label_file.stem not in seen:
                class_to_images[class_id].append(label_file.stem)
                seen.add(label_file.stem)

    return class_counts, class_to_images


def copy_originals(labels_dir, images_dir, output_labels_dir, output_images_dir):
    """
    Orjinal dosyalari cikti dizinine kopyala.
    """
    labels_path = Path(labels_dir)
    images_path = Path(images_dir)
    out_labels = Path(output_labels_dir)
    out_images = Path(output_images_dir)

    out_labels.mkdir(parents=True, exist_ok=True)
    out_images.mkdir(parents=True, exist_ok=True)

    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    copied = 0

    for label_file in labels_path.glob('*.txt'):
        dst_label = out_labels / label_file.name
        if not dst_label.exists():
            shutil.copy2(label_file, dst_label)

        # Ilgili gorseli bul ve kopyala
        for ext in image_extensions:
            img_file = images_path / (label_file.stem + ext)
            if img_file.exists():
                dst_img = out_images / img_file.name
                if not dst_img.exists():
                    shutil.copy2(img_file, dst_img)
                copied += 1
                break

    print(f"  {copied} orjinal gorsel kopyalandi.")
    return copied


def augment_minority_classes(labels_dir, images_dir, output_labels_dir, output_images_dir,
                              class_names=None, target_count=200, max_multiplier=5,
                              seed=42):
    """
    Az ornekli siniflar icin augmentasyon uygula.

    Args:
        labels_dir: Kaynak YOLO label dizini
        images_dir: Kaynak gorsel dizini
        output_labels_dir: Cikti label dizini
        output_images_dir: Cikti gorsel dizini
        class_names: Sinif ismi listesi (log icin)
        target_count: Hedef minimum annotation sayisi
        max_multiplier: Maksimum kac kat cogaltilacak (orijinal sayisi * max_multiplier)
        seed: Random seed
    """
    if not ALBUMENTATIONS_AVAILABLE:
        print("HATA: albumentations kurulu degil.")
        print("  pip install albumentations")
        return

    if not PIL_AVAILABLE:
        print("HATA: Pillow veya numpy kurulu degil.")
        return

    random.seed(seed)
    np.random.seed(seed)

    print(f"\nAugmentasyon basliyor...")
    print(f"  Hedef annotation sayisi: {target_count}")
    print(f"  Maksimum cogaltma: {max_multiplier}x")

    # Mevcut annotation sayilarini hesapla
    class_counts, class_to_images = count_class_annotations(labels_dir)

    if not class_counts:
        print("  HATA: Hicbir annotation bulunamadi.")
        return

    # Az ornekli siniflari belirle
    minority_classes = {
        cls_id: count for cls_id, count in class_counts.items()
        if count < target_count
    }

    if not minority_classes:
        print(f"  Tum siniflar zaten {target_count} annotationin ustunde, augmentasyon gerekli degil.")
        return

    print(f"\n  Az ornekli siniflar ({len(minority_classes)} adet):")
    for cls_id, count in sorted(minority_classes.items(), key=lambda x: x[1]):
        name = class_names[cls_id] if class_names and cls_id < len(class_names) else f"class_{cls_id}"
        needed = target_count - count
        print(f"    [{cls_id}] {name}: {count} annotation (eksik: {needed})")

    # Orjinalleri kopyala
    print(f"\n  Orjinal dosyalar kopyalaniyor...")
    copy_originals(labels_dir, images_dir, output_labels_dir, output_images_dir)

    # Augmentasyon pipeline
    transform = get_augmentation_pipeline(seed=seed)

    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    images_path = Path(images_dir)
    out_labels = Path(output_labels_dir)
    out_images = Path(output_images_dir)

    total_generated = 0

    for cls_id, current_count in sorted(minority_classes.items(), key=lambda x: x[1]):
        name = class_names[cls_id] if class_names and cls_id < len(class_names) else f"class_{cls_id}"
        needed = target_count - current_count

        # Bu sinif icin kaynak gorsellerini bul
        source_stems = class_to_images.get(cls_id, [])
        if not source_stems:
            print(f"    [{cls_id}] {name}: Kaynak gorsel bulunamadi, atlaniyor.")
            continue

        # Max multiplier siniri
        max_can_generate = len(source_stems) * max_multiplier
        to_generate = min(needed, max_can_generate)

        if to_generate <= 0:
            continue

        print(f"\n    [{cls_id}] {name}: {to_generate} augmented gorsel uretiliyor...")

        generated = 0
        attempts = 0
        max_attempts = to_generate * 3  # 3x deneme hakki

        while generated < to_generate and attempts < max_attempts:
            # Rastgele bir kaynak gorsel sec
            stem = random.choice(source_stems)

            # Gorsel ve label dosyalarini bul
            img_file = None
            for ext in image_extensions:
                candidate = images_path / (stem + ext)
                if candidate.exists():
                    img_file = candidate
                    break

            if img_file is None:
                attempts += 1
                continue

            label_file = Path(labels_dir) / (stem + '.txt')
            if not label_file.exists():
                attempts += 1
                continue

            # Augmentasyon uygula
            aug_image, aug_annotations = augment_image(str(img_file), str(label_file), transform)

            if aug_image is None:
                attempts += 1
                continue

            # Cikti dosya adlarini olustur
            aug_stem = f"aug_{cls_id}_{generated:05d}_{stem}"
            out_img_path = out_images / (aug_stem + img_file.suffix)
            out_label_path = out_labels / (aug_stem + '.txt')

            # Gorseli kaydet
            try:
                Image.fromarray(aug_image).save(str(out_img_path))
                write_yolo_label(str(out_label_path), aug_annotations)
                generated += 1
                total_generated += 1
            except Exception as e:
                pass

            attempts += 1

        print(f"      {generated}/{to_generate} uretildi ({attempts} deneme)")

    print(f"\n  Toplam uretilen augmented gorsel: {total_generated}")
    print(f"  Cikti dizini: {output_labels_dir}")


def main():
    parser = argparse.ArgumentParser(
        description='Az ornekli siniflar icin hedefli augmentasyon'
    )
    parser.add_argument('--labels-dir', required=True,
                        help='Kaynak YOLO label dizini (train)')
    parser.add_argument('--images-dir', required=True,
                        help='Kaynak gorsel dizini (train)')
    parser.add_argument('--output-labels-dir', required=True,
                        help='Cikti label dizini')
    parser.add_argument('--output-images-dir', required=True,
                        help='Cikti gorsel dizini')
    parser.add_argument('--data-yaml', default=None,
                        help='data.yaml (sinif isimlerini log icin okur)')
    parser.add_argument('--target-count', type=int, default=200,
                        help='Hedef minimum annotation sayisi (default: 200)')
    parser.add_argument('--max-multiplier', type=int, default=5,
                        help='Maksimum cogaltma katsayisi (default: 5)')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed (default: 42)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Sadece hangi siniflarin augmentasyona ihtiyaci oldugunuu goster')

    args = parser.parse_args()

    # Sinif isimlerini yükle
    class_names = None
    if args.data_yaml and Path(args.data_yaml).exists():
        with open(args.data_yaml, 'r', encoding='utf-8') as f:
            data_config = yaml.safe_load(f)
        class_names = data_config.get('names', [])

    if args.dry_run:
        print("\nDRY RUN - Augmentasyon uygulanmayacak, sadece analiz:")
        class_counts, class_to_images = count_class_annotations(args.labels_dir)

        minority = {
            cls_id: count for cls_id, count in class_counts.items()
            if count < args.target_count
        }

        if not minority:
            print(f"Tum siniflar zaten {args.target_count} annotationin ustunde.")
            return

        print(f"\n{'ID':>4}  {'Sinif':<30}  {'Mevcut':>8}  {'Gerekli':>8}  {'Gorsel':>7}")
        print("-" * 65)
        for cls_id, count in sorted(minority.items(), key=lambda x: x[1]):
            name = (class_names[cls_id] if class_names and cls_id < len(class_names)
                    else f"class_{cls_id}")
            needed = args.target_count - count
            img_count = len(class_to_images.get(cls_id, []))
            print(f"{cls_id:>4}  {name:<30}  {count:>8}  {needed:>8}  {img_count:>7}")
        return

    augment_minority_classes(
        labels_dir=args.labels_dir,
        images_dir=args.images_dir,
        output_labels_dir=args.output_labels_dir,
        output_images_dir=args.output_images_dir,
        class_names=class_names,
        target_count=args.target_count,
        max_multiplier=args.max_multiplier,
        seed=args.seed
    )


if __name__ == "__main__":
    main()
