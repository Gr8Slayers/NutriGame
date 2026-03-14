#!/usr/bin/env python3
"""
YOLO formatındaki label .txt dosyalarından sınıf dağılımını analiz eden script.
analyze_grouped_dataset.py'nin YOLO formatı için karşılığı.

Kullanım:
    python count_class_distribution.py \
        --labels-dir path/to/labels \
        --data-yaml path/to/data.yaml \
        [--min-samples 50]
"""

import os
import sys
import argparse
from pathlib import Path
from collections import defaultdict
import yaml

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def count_from_yolo_labels(labels_dir, class_names=None):
    """
    YOLO .txt label dosyalarından sınıf dağılımını sayar.

    Args:
        labels_dir: YOLO .txt label dosyalarının dizini (train/val/test alt dizinleri içerebilir)
        class_names: Sınıf isimleri listesi (opsiyonel)

    Returns:
        dict: {class_id: annotation_count}
    """
    labels_path = Path(labels_dir)
    class_counts = defaultdict(int)
    image_counts = defaultdict(int)  # Kaç görselde geçtiği
    total_files = 0
    empty_files = 0

    # Alt dizinleri de tara (train/val/test)
    txt_files = list(labels_path.rglob('*.txt'))

    if not txt_files:
        print(f" {labels_dir} dizininde .txt dosyası bulunamadı.")
        return {}

    for label_file in txt_files:
        total_files += 1
        seen_classes = set()

        with open(label_file, 'r') as f:
            lines = f.read().strip().splitlines()

        if not lines or (len(lines) == 1 and lines[0] == ''):
            empty_files += 1
            continue

        for line in lines:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 5:
                continue
            class_id = int(parts[0])
            class_counts[class_id] += 1
            seen_classes.add(class_id)

        for cls in seen_classes:
            image_counts[cls] += 1

    print(f"   Taranan label dosyası: {total_files}")
    print(f"   Boş label dosyası: {empty_files}")

    return class_counts, image_counts


def print_distribution_report(class_counts, image_counts, class_names, min_samples=50):
    """Dağılım raporunu yazdır."""
    if not class_counts:
        print("Sınıf verisi bulunamadı.")
        return

    total_annotations = sum(class_counts.values())
    num_classes = len(class_counts)

    # Sınıfları annotation sayısına göre sırala
    sorted_classes = sorted(class_counts.items(), key=lambda x: x[1], reverse=True)

    print(f"\n{'='*65}")
    print(f"SINIF DAĞILIMI RAPORU")
    print(f"{'='*65}")
    print(f"Toplam annotation: {total_annotations:,}")
    print(f"Sınıf sayısı: {num_classes}")
    print(f"Ortalama annotation/sınıf: {total_annotations/num_classes:.0f}")

    # Threshold analizi
    above_200 = sum(1 for _, c in sorted_classes if c >= 200)
    above_100 = sum(1 for _, c in sorted_classes if c >= 100)
    above_50  = sum(1 for _, c in sorted_classes if c >= 50)
    below_50  = sum(1 for _, c in sorted_classes if c < 50)

    print(f"\n Threshold Analizi:")
    print(f"   >= 200 annotation: {above_200} sinif  ({above_200/num_classes*100:.1f}%)")
    print(f"   >= 100 annotation: {above_100} sinif  ({above_100/num_classes*100:.1f}%)")
    print(f"   >=  50 annotation: {above_50} sinif  ({above_50/num_classes*100:.1f}%)")
    print(f"   <   50 annotation: {below_50} sinif   ZAYIF")

    # Detaylı liste
    print(f"\n{'ID':>4}  {'Sinif Ismi':<30}  {'Annotation':>10}  {'Gorsel':>7}  {'Durum'}")
    print(f"{'-'*65}")

    for class_id, count in sorted_classes:
        name = class_names[class_id] if class_names and class_id < len(class_names) else f"class_{class_id}"
        img_count = image_counts.get(class_id, 0)

        if count >= 200:
            status = " İYİ"
        elif count >= 100:
            status = " ORTA"
        elif count >= 50:
            status = " AZ"
        else:
            status = " ZAYIF"

        print(f"{class_id:>4}  {name:<30}  {count:>10,}  {img_count:>7,}  {status}")

    # Zayıf sınıfları özetle
    weak_classes = [(cid, cnt) for cid, cnt in sorted_classes if cnt < min_samples]
    if weak_classes:
        print(f"\n {min_samples} altında annotation olan sınıflar ({len(weak_classes)} adet):")
        for cid, cnt in weak_classes:
            name = class_names[cid] if class_names and cid < len(class_names) else f"class_{cid}"
            print(f"   [{cid}] {name}: {cnt} annotation")

    print(f"{'='*65}\n")


def main():
    parser = argparse.ArgumentParser(description='YOLO Label Sınıf Dağılımı Analizi')
    parser.add_argument('--labels-dir', required=True,
                        help='YOLO label .txt dizini (train/val/test alt dizinleri dahil)')
    parser.add_argument('--data-yaml', default=None,
                        help='data.yaml dosyası (sınıf isimlerini almak için)')
    parser.add_argument('--min-samples', type=int, default=50,
                        help='Minimum örnek eşiği (default: 50)')
    parser.add_argument('--split', default=None,
                        help='Belirli bir split analiz et (train/val/test). Belirtilmezse hepsini tarar.')

    args = parser.parse_args()

    # Sınıf isimlerini yükle
    class_names = None
    if args.data_yaml and Path(args.data_yaml).exists():
        with open(args.data_yaml, 'r', encoding='utf-8') as f:
            data_config = yaml.safe_load(f)
        class_names = data_config.get('names', [])
        print(f" {len(class_names)} sınıf ismi yüklendi: {args.data_yaml}")

    labels_root = Path(args.labels_dir)

    if args.split:
        # Belirli bir split
        split_dir = labels_root / args.split if (labels_root / args.split).exists() else labels_root
        print(f"\n {args.split.upper()} split analiz ediliyor: {split_dir}")
        class_counts, image_counts = count_from_yolo_labels(str(split_dir), class_names)
        print_distribution_report(class_counts, image_counts, class_names, args.min_samples)
    else:
        # Tüm dizini tara (alt dizinler dahil)
        print(f"\n Tüm label dizini analiz ediliyor: {labels_root}")

        # Her split ayrı ayrı göster
        splits_found = []
        for split in ['train', 'val', 'test']:
            split_dir = labels_root / split
            if split_dir.exists():
                splits_found.append(split)

        if splits_found:
            # Toplam (tüm splitler birleşik)
            combined_counts = defaultdict(int)
            combined_img_counts = defaultdict(int)

            for split in splits_found:
                split_dir = labels_root / split
                print(f"\n--- {split.upper()} ---")
                cc, ic = count_from_yolo_labels(str(split_dir), class_names)
                for cid, cnt in cc.items():
                    combined_counts[cid] += cnt
                    combined_img_counts[cid] += ic.get(cid, 0)

            print(f"\n{'='*65}")
            print(f"TÜM SPLİTLER BİRLEŞİK RAPOR")
            print_distribution_report(combined_counts, combined_img_counts, class_names, args.min_samples)
        else:
            # Doğrudan dizin
            class_counts, image_counts = count_from_yolo_labels(str(labels_root), class_names)
            print_distribution_report(class_counts, image_counts, class_names, args.min_samples)


if __name__ == "__main__":
    main()
