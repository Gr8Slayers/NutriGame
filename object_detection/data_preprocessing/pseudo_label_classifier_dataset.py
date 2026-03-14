#!/usr/bin/env python3
"""
Siniflandirma (classification) veri setlerinden COCO formatinda
pseudo bounding box annotation'lari uretir.

TurkishFoods-25 gibi sadece gorsel + sinif etiketi olan datasetler icin
iki farkli strateji sunar:

Mod A (full_image): Tum gorseli bbox kabul et (sinir birakilir).
  - Tek objenin buyuk cogunlugu kaplayan goruntuler icin uygundur.
  - Ornekler: Baklava, Kunefe, Sutlac, Lahmacun, Menemen

Mod B (yolo_pseudo): Mevcut YOLOv8 modeli ile confidence=0.15'te inference,
  en yuksek confidence'li bbox'i pseudo-label olarak kullan.
  - Tabak uzerindeki yemekler icin daha dogru sonuc verir.
  - Mevcut best.pt modeli ile maplanan siniflar icin calisir.

HuggingFace TurkishFoods-25 Dataset yapisi:
    turkish25/
        train/
            Baklava/
                image1.jpg
                image2.jpg
            Lahmacun/
                ...
        test/
            ...

Kullanim:
    # Mod A - tum gorsel bbox:
    python pseudo_label_classifier_dataset.py \
        --dataset-dir D:/datasets/turkish25 \
        --output-json D:/datasets/turkish25_coco/instances_train.json \
        --images-output-dir D:/datasets/turkish25_coco/images \
        --mode full_image \
        --split train

    # Mod B - YOLO pseudo-label:
    python pseudo_label_classifier_dataset.py \
        --dataset-dir D:/datasets/turkish25 \
        --output-json D:/datasets/turkish25_coco/instances_train.json \
        --images-output-dir D:/datasets/turkish25_coco/images \
        --mode yolo_pseudo \
        --model-path D:/Desktop/Bitirme/NutriGame/object_detection/finetuning/yolov8/results/weights/best.pt \
        --split train
"""

import json
import shutil
import argparse
from pathlib import Path
from PIL import Image
from collections import Counter

try:
    from map_cafsd_categories import TARGET_CATEGORIES, TARGET_NAME_TO_ID
except ImportError:
    raise ImportError("map_cafsd_categories.py ayni dizinde olmali.")


# =============================================================================
# TURKISHFOODS-25 SINIF LISTESI -> HEDEF SINIF MAPPING
# HuggingFace klasor isimleri -> TARGET_CATEGORIES isimlerine
# =============================================================================
TURKISHFOODS25_NAME_TO_TARGET = {
    # Gercek sinif adlari (ClassLabel.names listesinden)
    # TurkishFoods-25: ['asure','baklava','biber_dolmasi','borek','cig_kofte',
    #  'enginar','et_sote','gozleme','hamsi','hunkar_begendi','icli_kofte',
    #  'ispanak','izmir_kofte','karniyarik','kebap','kisir','kuru_fasulye',
    #  'lahmacun','lokum','manti','mucver','pirinc_pilavi','simit',
    #  'taze_fasulye','yaprak_sarma']
    "asure":                None,            # Tatli, ambiguous
    "baklava":              "Baklava",
    "biber_dolmasi":        "Biber_Dolmasi",
    "borek":                "Bread",         # Hamur isine en yakin
    "cig_kofte":            "Cig_Kofte",
    "enginar":              None,            # Artichoke, hedef listede yok
    "et_sote":              "Et_Sote",
    "gozleme":              "Bread",         # Yassı ekmek
    "hamsi":                "Fish",
    "hunkar_begendi":       "Et_Sote",       # Patlican pureli et yemegi
    "icli_kofte":           "Izmir_Kofte",   # Ic kofte = dolma kofte
    "ispanak":              "Spinach",
    "izmir_kofte":          "Izmir_Kofte",
    "karniyarik":           "Karniyarik",
    "kebap":                "Adana_Kebap",
    "kisir":                "Salad",         # Bulgur salatasi
    "kuru_fasulye":         None,            # Hedef listede yok
    "lahmacun":             "Lahmacun",
    "lokum":                None,            # Tatli sekeri, detection hedefi degil
    "manti":                "Pasta",         # Turk mantisi = makarna kategorisi
    "mucver":               "Kabak_Mucver",
    "pirinc_pilavi":        "Rice",
    "simit":                "Bread",
    "taze_fasulye":         "Green_Beans",
    "yaprak_sarma":         "Biber_Dolmasi", # Yaprak sarmasi ~ dolma kategorisi

    # Alternatif / bosluk/underscore varyantlari
    "Adana Kebap":          "Adana_Kebap",
    "Ayran":                "Ayran",
    "Baklava":              "Baklava",
    "Cacik":                "Cacik",
    "Cig Kofte":            "Cig_Kofte",
    "Doner":                "Doner_Et",
    "Ezogelin Corbasi":     "Ezogelin_Corba",
    "Iskender":             "Iskender_Et",
    "Kabak Mucver":         "Kabak_Mucver",
    "Karniyarik":           "Karniyarik",
    "Kasarli Pide":         "Kasarli_Pide",
    "Kiymali Pide":         "Kiymali_Pide",
    "Kofte":                "Izmir_Kofte",
    "Kunefe":               "Kunefe",
    "Lahmacun":             "Lahmacun",
    "Menemen":              "Menemen",
    "Mercimek Corbasi":     "Mercimek_Corbasi",
    "Midye Dolma":          "Midye_Dolma",
    "Patlican Kebabi":      "Patlican_Kebabi",
    "Sutlac":               "Sutlac",
    "Tantuni":              "Tantuni_Et",

    # Alternatif isim varyantlari (dataset indirildikten sonra klasor adlarina gore guncellenmeli)
    "adana_kebap":          "Adana_Kebap",
    "ayran":                "Ayran",
    "baklava":              "Baklava",
    "cacik":                "Cacik",
    "cig_kofte":            "Cig_Kofte",
    "doner":                "Doner_Et",
    "doner_et":             "Doner_Et",
    "ezogelin_corba":       "Ezogelin_Corba",
    "iskender":             "Iskender_Et",
    "iskender_et":          "Iskender_Et",
    "kabak_mucver":         "Kabak_Mucver",
    "karniyarik":           "Karniyarik",
    "kasarli_pide":         "Kasarli_Pide",
    "kiymali_pide":         "Kiymali_Pide",
    "kofte":                "Izmir_Kofte",
    "kunefe":               "Kunefe",
    "lahmacun":             "Lahmacun",
    "menemen":              "Menemen",
    "mercimek_corbasi":     "Mercimek_Corbasi",
    "midye_dolma":          "Midye_Dolma",
    "patlican_kebabi":      "Patlican_Kebabi",
    "sutlac":               "Sutlac",
    "tantuni":              "Tantuni_Et",
    "tantuni_et":           "Tantuni_Et",
}


def get_image_size(image_path):
    try:
        with Image.open(image_path) as img:
            return img.width, img.height
    except Exception:
        return None, None


def create_full_image_bbox(img_width, img_height, border_pct=0.05):
    """
    Gorselin tamamini kaplayan COCO bbox olustur.
    border_pct: Kenarlarda birakilacak bosluk orani (default %5)

    Returns:
        [x_min, y_min, width, height] COCO format
    """
    border_x = int(img_width * border_pct)
    border_y = int(img_height * border_pct)
    x_min = border_x
    y_min = border_y
    w = img_width - 2 * border_x
    h = img_height - 2 * border_y
    return [float(x_min), float(y_min), float(max(w, 1)), float(max(h, 1))]


def find_class_dirs(dataset_dir, split="train"):
    """
    Dataset dizinindeki sinif klasorlerini bul.

    Desteklenen yapilar:
        dataset_dir/train/ClassName/images...
        dataset_dir/ClassName/images...   (split yok)
    """
    base = Path(dataset_dir)

    # Split alt dizini var mi?
    split_dir = base / split
    if split_dir.exists() and split_dir.is_dir():
        class_dirs = [d for d in split_dir.iterdir() if d.is_dir()]
        if class_dirs:
            return class_dirs

    # Direkt klasor yapisi
    class_dirs = [d for d in base.iterdir() if d.is_dir()
                  and d.name not in ['train', 'val', 'test', 'valid']]
    return class_dirs


def generate_full_image_labels(dataset_dir, output_json_path, images_output_dir,
                                split="train", border_pct=0.05):
    """
    Mod A: Tum gorsel = bbox stratejisi ile COCO JSON olustur.
    """
    print(f"\nMod A (full_image) - {split} split isleniyor...")

    class_dirs = find_class_dirs(dataset_dir, split)
    if not class_dirs:
        print(f"  HATA: {dataset_dir}/{split} altinda sinif klasoru bulunamadi.")
        return None

    if images_output_dir:
        Path(images_output_dir).mkdir(parents=True, exist_ok=True)

    coco_images = []
    coco_annotations = []
    image_id = 0
    annotation_id = 0
    skipped = 0
    unmapped_classes = []

    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

    for class_dir in sorted(class_dirs):
        class_name = class_dir.name

        # Hedef sinifi bul
        target_name = TURKISHFOODS25_NAME_TO_TARGET.get(class_name)
        if target_name is None:
            # Case-insensitive deneme
            target_name = TURKISHFOODS25_NAME_TO_TARGET.get(class_name.lower())
        if target_name is None:
            # Bosluk/underscore normalizasyonu
            normalized = class_name.replace(' ', '_').lower()
            target_name = TURKISHFOODS25_NAME_TO_TARGET.get(normalized)

        if target_name is None:
            unmapped_classes.append(class_name)
            continue

        target_id = TARGET_NAME_TO_ID.get(target_name)
        if target_id is None:
            print(f"  WARNING: '{target_name}' hedef listede bulunamadi (kaynak: '{class_name}')")
            continue

        # Gorsel dosyalarini isle
        image_files = [f for f in class_dir.iterdir()
                       if f.is_file() and f.suffix.lower() in image_extensions]

        class_count = 0
        for img_file in image_files:
            img_width, img_height = get_image_size(img_file)
            if img_width is None:
                skipped += 1
                continue

            unique_name = f"tf25_{class_name.replace(' ', '_')}_{img_file.name}"

            image_record = {
                "id": image_id,
                "file_name": unique_name,
                "width": img_width,
                "height": img_height
            }
            coco_images.append(image_record)

            bbox = create_full_image_bbox(img_width, img_height, border_pct)
            ann = {
                "id": annotation_id,
                "image_id": image_id,
                "category_id": target_id,
                "bbox": bbox,
                "area": float(bbox[2] * bbox[3]),
                "segmentation": [],
                "iscrowd": 0
            }
            coco_annotations.append(ann)
            annotation_id += 1

            if images_output_dir:
                dst = Path(images_output_dir) / unique_name
                if not dst.exists():
                    shutil.copy2(img_file, dst)

            image_id += 1
            class_count += 1

        print(f"  [{target_id}] {target_name} ({class_name}): {class_count} gorsel")

    if unmapped_classes:
        print(f"\n  UYARI - Maplenemeyen siniflar ({len(unmapped_classes)}):")
        for name in unmapped_classes:
            print(f"    '{name}' -> TURKISHFOODS25_NAME_TO_TARGET'e ekle")

    coco_output = {
        "info": {"description": f"TurkishFoods-25 pseudo-labels (full_image mode) - {split}"},
        "licenses": [],
        "images": coco_images,
        "annotations": coco_annotations,
        "categories": TARGET_CATEGORIES
    }

    output_path = Path(output_json_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(coco_output, f, indent=2, ensure_ascii=False)

    print(f"\n  Toplam: {len(coco_images)} gorsel, {len(coco_annotations)} annotation")
    print(f"  Atlanan: {skipped} gorsel")
    print(f"  Kaydedildi: {output_json_path}")

    return coco_output


def generate_yolo_pseudo_labels(dataset_dir, output_json_path, images_output_dir,
                                 model_path, split="train", conf_thresh=0.15):
    """
    Mod B: Mevcut YOLO modeli ile inference yaparak pseudo-label uret.
    Modelin zaten bildigi siniflarla uyumlu goruntulerde daha iyi sonuc verir.
    Eger model o sinifi bulamazsa full_image bbox'a fallback yapar.
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        raise ImportError("ultralytics kurulu olmali: pip install ultralytics")

    print(f"\nMod B (yolo_pseudo) - {split} split isleniyor...")
    print(f"  Model: {model_path}")
    print(f"  Confidence threshold: {conf_thresh}")

    model = YOLO(model_path)

    class_dirs = find_class_dirs(dataset_dir, split)
    if not class_dirs:
        print(f"  HATA: {dataset_dir}/{split} altinda sinif klasoru bulunamadi.")
        return None

    if images_output_dir:
        Path(images_output_dir).mkdir(parents=True, exist_ok=True)

    coco_images = []
    coco_annotations = []
    image_id = 0
    annotation_id = 0
    skipped = 0
    fallback_count = 0
    unmapped_classes = []

    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

    for class_dir in sorted(class_dirs):
        class_name = class_dir.name

        target_name = TURKISHFOODS25_NAME_TO_TARGET.get(class_name)
        if target_name is None:
            target_name = TURKISHFOODS25_NAME_TO_TARGET.get(class_name.lower())
        if target_name is None:
            normalized = class_name.replace(' ', '_').lower()
            target_name = TURKISHFOODS25_NAME_TO_TARGET.get(normalized)

        if target_name is None:
            unmapped_classes.append(class_name)
            continue

        target_id = TARGET_NAME_TO_ID.get(target_name)
        if target_id is None:
            continue

        image_files = [f for f in class_dir.iterdir()
                       if f.is_file() and f.suffix.lower() in image_extensions]

        class_count = 0
        class_fallback = 0

        for img_file in image_files:
            img_width, img_height = get_image_size(img_file)
            if img_width is None:
                skipped += 1
                continue

            unique_name = f"tf25_{class_name.replace(' ', '_')}_{img_file.name}"

            image_record = {
                "id": image_id,
                "file_name": unique_name,
                "width": img_width,
                "height": img_height
            }
            coco_images.append(image_record)

            # YOLO inference
            bbox_used = None
            try:
                results = model(str(img_file), conf=conf_thresh, verbose=False)
                if results and len(results) > 0:
                    result = results[0]
                    if result.boxes is not None and len(result.boxes) > 0:
                        # En yuksek confidence'li box'u al
                        boxes = result.boxes
                        best_idx = int(boxes.conf.argmax())
                        xyxy = boxes.xyxy[best_idx].cpu().numpy()
                        x1, y1, x2, y2 = xyxy
                        w = float(x2 - x1)
                        h = float(y2 - y1)
                        if w > 0 and h > 0:
                            bbox_used = [float(x1), float(y1), w, h]
            except Exception as e:
                pass  # Fallback'e gec

            # YOLO bulamamissa full_image fallback
            if bbox_used is None:
                bbox_used = create_full_image_bbox(img_width, img_height)
                class_fallback += 1
                fallback_count += 1

            ann = {
                "id": annotation_id,
                "image_id": image_id,
                "category_id": target_id,
                "bbox": bbox_used,
                "area": float(bbox_used[2] * bbox_used[3]),
                "segmentation": [],
                "iscrowd": 0
            }
            coco_annotations.append(ann)
            annotation_id += 1

            if images_output_dir:
                dst = Path(images_output_dir) / unique_name
                if not dst.exists():
                    shutil.copy2(img_file, dst)

            image_id += 1
            class_count += 1

        print(f"  [{target_id}] {target_name}: {class_count} gorsel "
              f"({class_fallback} full_image fallback)")

    if unmapped_classes:
        print(f"\n  Maplenemeyen siniflar: {unmapped_classes}")

    print(f"\n  Toplam: {len(coco_images)} gorsel, {len(coco_annotations)} annotation")
    print(f"  Full-image fallback: {fallback_count}")
    print(f"  Atlanan: {skipped}")

    coco_output = {
        "info": {"description": f"TurkishFoods-25 pseudo-labels (yolo_pseudo mode) - {split}"},
        "licenses": [],
        "images": coco_images,
        "annotations": coco_annotations,
        "categories": TARGET_CATEGORIES
    }

    output_path = Path(output_json_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(coco_output, f, indent=2, ensure_ascii=False)

    print(f"  Kaydedildi: {output_json_path}")
    return coco_output


def list_dataset_classes(dataset_dir):
    """Dataset dizinindeki sinif klasorlerini listele (mapping kontrolu icin)."""
    base = Path(dataset_dir)
    print(f"\nDataset dizini: {dataset_dir}")

    for split in ['train', 'val', 'test', 'valid', '']:
        if split:
            split_dir = base / split
        else:
            split_dir = base

        if not split_dir.exists():
            continue

        class_dirs = [d for d in split_dir.iterdir() if d.is_dir()]
        if not class_dirs:
            continue

        print(f"\n{split or 'root'} split ({len(class_dirs)} sinif):")
        print(f"{'Klasor Adi':<35}  {'Hedef Sinif'}")
        print("-" * 60)

        for class_dir in sorted(class_dirs):
            name = class_dir.name
            target = TURKISHFOODS25_NAME_TO_TARGET.get(name)
            if target is None:
                target = TURKISHFOODS25_NAME_TO_TARGET.get(name.lower())
            if target is None:
                normalized = name.replace(' ', '_').lower()
                target = TURKISHFOODS25_NAME_TO_TARGET.get(normalized)

            status = f"-> {target}" if target else "TANIMLANMAMIS - mapping'e ekle"
            img_count = len([f for f in class_dir.iterdir()
                             if f.is_file() and f.suffix.lower() in
                             {'.jpg', '.jpeg', '.png', '.bmp'}])
            print(f"{name:<35}  {status}  ({img_count} gorsel)")

        break  # Ilk bulunan split yeterli


def main():
    parser = argparse.ArgumentParser(
        description='Classification dataset icin COCO pseudo-label annotation uret'
    )
    parser.add_argument('--dataset-dir', required=True,
                        help='Siniflandirma dataset dizini (TurkishFoods-25 vb.)')
    parser.add_argument('--output-json', default=None,
                        help='Cikti COCO JSON dosyasi')
    parser.add_argument('--images-output-dir', default=None,
                        help='Gorsellerin kopyalanacagi dizin')
    parser.add_argument('--mode', choices=['full_image', 'yolo_pseudo'],
                        default='full_image',
                        help='Pseudo-label stratejisi (default: full_image)')
    parser.add_argument('--split', default='train',
                        help='Islenecek split (train/val/test)')
    parser.add_argument('--model-path', default=None,
                        help='yolo_pseudo modu icin YOLOv8 model yolu (best.pt)')
    parser.add_argument('--conf-thresh', type=float, default=0.15,
                        help='yolo_pseudo icin confidence threshold (default: 0.15)')
    parser.add_argument('--border-pct', type=float, default=0.05,
                        help='full_image icin sinir boslugu orani (default: 0.05)')
    parser.add_argument('--list-classes', action='store_true',
                        help='Dataset siniflarini ve mapping durumunu listele')

    args = parser.parse_args()

    if args.list_classes:
        list_dataset_classes(args.dataset_dir)
        return

    if not args.output_json:
        print("--output-json parametresi gereklidir.")
        return

    if args.mode == 'full_image':
        generate_full_image_labels(
            dataset_dir=args.dataset_dir,
            output_json_path=args.output_json,
            images_output_dir=args.images_output_dir,
            split=args.split,
            border_pct=args.border_pct
        )
    elif args.mode == 'yolo_pseudo':
        if not args.model_path:
            print("yolo_pseudo modu icin --model-path gereklidir.")
            return
        generate_yolo_pseudo_labels(
            dataset_dir=args.dataset_dir,
            output_json_path=args.output_json,
            images_output_dir=args.images_output_dir,
            model_path=args.model_path,
            split=args.split,
            conf_thresh=args.conf_thresh
        )


if __name__ == "__main__":
    main()
