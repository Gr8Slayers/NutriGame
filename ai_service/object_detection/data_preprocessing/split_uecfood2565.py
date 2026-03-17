"""
UECFOOD256 processed_datasets/uecfood256/instances_all.json dosyasini
train/val/test olarak boler.

Oran: 75% train, 15% val, 10% test
Seed: 42 (tekrarlanabilir)

Kullanim:
    python split_uecfood2565.py              # simule et
    python split_uecfood2565.py --apply      # JSON'lari yaz
"""

import json
import random
import argparse
from pathlib import Path
from collections import defaultdict


INPUT_FILE   = Path("D:/Desktop/Bitirme/NutriGame/object_detection/processed_datasets/uecfood256/instances_all.json")
OUTPUT_DIR   = INPUT_FILE.parent
SPLIT_RATIOS = {"train": 0.75, "val": 0.15, "test": 0.10}
SEED         = 42


def main():
    parser = argparse.ArgumentParser(description="UECFOOD256 train/val/test split")
    parser.add_argument("--input",      default=str(INPUT_FILE))
    parser.add_argument("--output-dir", default=str(OUTPUT_DIR))
    parser.add_argument("--apply",      action="store_true")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)

    print(f"Kaynak  : {input_path}")
    print(f"Cikti   : {output_dir}")
    print(f"Mod     : {'UYGULAMA' if args.apply else 'SIMULE (--apply ile yaz)'}")

    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    images = list(data["images"])
    ann_by_img = defaultdict(list)
    for ann in data["annotations"]:
        ann_by_img[ann["image_id"]].append(ann)

    random.seed(SEED)
    random.shuffle(images)

    n       = len(images)
    n_train = int(n * SPLIT_RATIOS["train"])
    n_val   = int(n * SPLIT_RATIOS["val"])

    split_images = {
        "train": images[:n_train],
        "val":   images[n_train : n_train + n_val],
        "test":  images[n_train + n_val :],
    }

    print(f"\nToplam: {n} gorsel")
    for split, imgs in split_images.items():
        anns = [a for img in imgs for a in ann_by_img[img["id"]]]
        print(f"  [{split}] {len(imgs):5d} gorsel  |  {len(anns):5d} annotation")

    if args.apply:
        output_dir.mkdir(parents=True, exist_ok=True)
        for split, imgs in split_images.items():
            img_ids = {img["id"] for img in imgs}
            anns    = [a for a in data["annotations"] if a["image_id"] in img_ids]

            out = dict(data)
            out["images"]      = imgs
            out["annotations"] = anns

            dst = output_dir / f"instances_{split}.json"
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
            print(f"  Yazildi: {dst}")
    else:
        print("\nNot: --apply ekle, hicbir dosya yazilmadi.")


if __name__ == "__main__":
    main()
