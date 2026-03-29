"""
YOLO format dataset'i COCO JSON formatina donusturur.

Girdi yapisi:
    dataset/
        images/train/  images/val/  images/test/
        labels/train/  labels/val/  labels/test/
        data.yaml

Cikti - standart mod:
    output_dir/
        instances_train.json
        instances_val.json
        instances_test.json

Cikti - RF-DETR modu (--rfdetr):
    output_dir/
        train/  _annotations.coco.json  + gorseller
        valid/  _annotations.coco.json  + gorseller
        test/   _annotations.coco.json  + gorseller

Kullanim:
    python yolo_to_coco.py                        # standart
    python yolo_to_coco.py --rfdetr               # RF-DETR formati (gorsel kopyalar)
    python yolo_to_coco.py --rfdetr --symlink      # gorsel kopyalamak yerine symlink (Linux)
    python yolo_to_coco.py --split train           # tek split
"""

import argparse
import json
import os
import re
import shutil
from pathlib import Path

DATASET_DIR    = Path("D:/Desktop/Bitirme/NutriGame/object_detection/processed_datasets/merged")
OUTPUT_DIR_STD = Path("D:/Desktop/Bitirme/NutriGame/object_detection/processed_datasets/merged_coco")
OUTPUT_DIR_RF  = Path("D:/Desktop/Bitirme/NutriGame/object_detection/processed_datasets/merged_rfdetr")
SPLITS         = ["train", "val", "test"]

IMG_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# RF-DETR val klasoru adi "valid" olmali
RFDETR_SPLIT_MAP = {"train": "train", "val": "valid", "test": "test"}


def read_names_from_yaml(yaml_path: Path) -> list:
    names = []
    in_names = False
    for line in yaml_path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("names:"):
            in_names = True
            continue
        if in_names:
            m = re.match(r"^\s*-\s*(.+)", line)
            if m:
                names.append(m.group(1).strip())
            elif line.strip() and not line.startswith(" ") and not line.startswith("-"):
                break
    return names


def get_image_size(path: Path):
    """JPEG/PNG boyutunu dosya basligindan okur (Pillow gerekmez)."""
    data = path.read_bytes()
    if data[:2] == b"\xff\xd8":  # JPEG
        i = 2
        while i < len(data) - 9:
            if data[i] != 0xFF:
                break
            marker = data[i + 1]
            length = int.from_bytes(data[i + 2:i + 4], "big")
            if marker in (0xC0, 0xC1, 0xC2):
                h = int.from_bytes(data[i + 5:i + 7], "big")
                w = int.from_bytes(data[i + 7:i + 9], "big")
                return w, h
            i += 2 + length
    elif data[:8] == b"\x89PNG\r\n\x1a\n":  # PNG
        w = int.from_bytes(data[16:20], "big")
        h = int.from_bytes(data[20:24], "big")
        return w, h
    return None, None


def convert_split(dataset_dir: Path, split: str, names: list) -> tuple:
    """COCO dict ve islenen gorsel path listesini dondurur."""
    img_dir = dataset_dir / "images" / split
    lbl_dir = dataset_dir / "labels" / split

    categories = [
        {"id": i, "name": name, "supercategory": "food"}
        for i, name in enumerate(names)
    ]

    images      = []
    annotations = []
    img_paths   = []
    ann_id      = 1
    img_id      = 1

    img_files = sorted(p for p in img_dir.glob("*") if p.suffix.lower() in IMG_EXTENSIONS)
    print(f"  [{split}] {len(img_files)} gorsel isleniyor...", flush=True)

    for img_path in img_files:
        w, h = get_image_size(img_path)
        if w is None:
            print(f"    Uyari: boyut okunamadi, atlaniyor: {img_path.name}")
            continue

        images.append({
            "id":        img_id,
            "file_name": img_path.name,
            "width":     w,
            "height":    h,
        })
        img_paths.append(img_path)

        lbl_path = lbl_dir / (img_path.stem + ".txt")
        if lbl_path.exists():
            for line in lbl_path.read_text(encoding="utf-8").strip().splitlines():
                parts = line.split()
                if len(parts) != 5:
                    continue
                cid = int(float(parts[0]))
                cx, cy, bw, bh = map(float, parts[1:])

                x     = (cx - bw / 2) * w
                y     = (cy - bh / 2) * h
                bw_px = bw * w
                bh_px = bh * h

                annotations.append({
                    "id":          ann_id,
                    "image_id":    img_id,
                    "category_id": cid,
                    "bbox":        [round(x, 2), round(y, 2), round(bw_px, 2), round(bh_px, 2)],
                    "area":        round(bw_px * bh_px, 2),
                    "iscrowd":     0,
                })
                ann_id += 1

        img_id += 1

    coco = {
        "info":        {"description": f"NutriGame merged - {split}"},
        "categories":  categories,
        "images":      images,
        "annotations": annotations,
    }
    return coco, img_paths


def main():
    parser = argparse.ArgumentParser(description="YOLO -> COCO donusturucu")
    parser.add_argument("--dataset-dir", default=str(DATASET_DIR))
    parser.add_argument("--output-dir",  default=None,
                        help="Cikti dizini (belirtilmezse mod'a gore otomatik)")
    parser.add_argument("--split",   choices=SPLITS + ["all"], default="all")
    parser.add_argument("--rfdetr",  action="store_true",
                        help="RF-DETR formati: train/valid/test klasorleri + _annotations.coco.json")
    parser.add_argument("--symlink", action="store_true",
                        help="Gorsel kopyalamak yerine sembolik link olustur (Linux)")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = OUTPUT_DIR_RF if args.rfdetr else OUTPUT_DIR_STD

    yaml_path = dataset_dir / "data.yaml"
    if not yaml_path.exists():
        print(f"Hata: data.yaml bulunamadi: {yaml_path}")
        return
    names = read_names_from_yaml(yaml_path)
    print(f"data.yaml okundu: {len(names)} sinif")
    print(f"Mod     : {'RF-DETR' if args.rfdetr else 'Standart COCO'}")
    print(f"Cikti   : {output_dir}")

    splits = SPLITS if args.split == "all" else [args.split]

    for split in splits:
        if not (dataset_dir / "images" / split).exists():
            print(f"[{split}] klasoru yok, atlaniyor.")
            continue

        coco, img_paths = convert_split(dataset_dir, split, names)

        if args.rfdetr:
            split_name = RFDETR_SPLIT_MAP[split]
            split_dir  = output_dir / split_name
            split_dir.mkdir(parents=True, exist_ok=True)

            # Gorsel kopyala / symlink
            print(f"  [{split}] gorseller {'symlink' if args.symlink else 'kopyalaniyor'}...", flush=True)
            for i, img_path in enumerate(img_paths):
                dst = split_dir / img_path.name
                if dst.exists():
                    continue
                if args.symlink:
                    os.symlink(img_path.resolve(), dst)
                else:
                    shutil.copy2(img_path, dst)
                if (i + 1) % 5000 == 0:
                    print(f"    {i + 1}/{len(img_paths)}...", flush=True)

            json_path = split_dir / "_annotations.coco.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(coco, f, ensure_ascii=False, separators=(",", ":"))
            print(f"  Yazildi: {json_path}  ({len(coco['images'])} img, {len(coco['annotations'])} ann)")

        else:
            output_dir.mkdir(parents=True, exist_ok=True)
            out_path = output_dir / f"instances_{split}.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(coco, f, ensure_ascii=False, separators=(",", ":"))
            print(f"  Yazildi: {out_path}  ({len(coco['images'])} img, {len(coco['annotations'])} ann)")


if __name__ == "__main__":
    main()
