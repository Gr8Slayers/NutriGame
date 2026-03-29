"""
Tum islenmis datasetleri birlestirip YOLO formatinda yeni dataset olusturur.

Kaynaklar:
  1. final_data_yolo/         (mevcut YOLO dataset - TF25 + Nutrition5k + Roboflow)
  2. processed_datasets/gfsd/ (COCO JSON, images: raw_datasets/GFSD/{split}/images/)
  3. processed_datasets/uecfood256/ (COCO JSON, images: raw_datasets/uecfood256_coco/images/)
     -> once split_uecfood2565.py --apply calistirilmis olmali

Not: TurkishFood25 zaten final_data_yolo icinde mevcut, ayrica eklenmez.

Cikti: finetuning/data/final_data_yolo_v2/
  - images/{train,val,test}/
  - labels/{train,val,test}/
  - data.yaml (nc: 115)

Gorsel kopyalama: once hard link (hizli, ek disk yok), basarisiz olursa copy.

Kullanim:
    python merge_dataset.py              # simule et (gorsel kopyalamaz)
    python merge_dataset.py --apply      # uygula
    python merge_dataset.py --apply --output-dir D:/baska/yol
"""

import json
import os
import shutil
import argparse
from pathlib import Path
from collections import defaultdict


# --- Yol sabitleri ---
BASE = Path("D:/Desktop/Bitirme/NutriGame/object_detection")

EXISTING_YOLO   = BASE / "finetuning/data/final_data_yolo"
PROCESSED_DIR   = BASE / "processed_datasets"
GFSD_IMGS       = BASE / "raw_datasets/GFSD"           # {split}/images/ altinda
UEC_IMGS        = BASE / "raw_datasets/uecfood256_coco/images"

DEFAULT_OUT     = BASE / "finetuning/data/final_data_yolo_v2"

SPLITS = ["train", "val", "test"]

# Hedef 115 sinif listesi (id sirasiyla)
CLASS_NAMES = [
    "Adana_Kebap", "Almond", "Ankara_Tava", "Apple", "Asparagus", "Avocado",
    "Ayran", "Bacon", "Baklava", "Banana", "Beans", "Bell_Pepper",
    "Biber_Dolmasi", "Black_Olives", "Blackberry", "Bread", "Broccoli",
    "Bulgur_Pilavi", "Burger", "Cabbage", "Cacik", "Carrot", "Cauliflower",
    "Cheese", "Cheesecake", "Chips", "Cig_Kofte", "Corn", "Cucumber",
    "Doner_Et", "Doner_Tavuk", "Domates_Corbasi", "Et_Sote", "Etli_Turlu",
    "Ezogelin_Corba", "Fish", "Fried_Chicken", "Fried_Eggs", "Fried_Meat",
    "Grapes", "Green_Beans", "Irmik_Tatlisi", "Iskender_Et", "Iskender_Tavuk",
    "Spinach", "Izmir_Kofte", "Kabak_Mucver", "Kabak_Tatlisi", "Kadinbudu_Kofte",
    "Kasarli_Pide", "Kir_Pidesi", "Kiwi", "Kiymali_Pide", "Kunefe",
    "Kusbasli_Pide", "Lahmacun", "Lemon", "Mandarin", "Melon", "Menemen",
    "Mercimek_Coftesi", "Mercimek_Corbasi", "Midye_Dolma", "Midye_Tava",
    "Mumbar_Dolmasi", "Mushrooms", "Orange", "Pasta", "Patlican_Kebabi",
    "Pineapple", "Pizza", "Porridge", "Potatoes", "Raspberry", "Rice",
    "Salad", "Sausages", "Sehriye_Corbasi", "Strawberry", "Suffle", "Sutlac",
    "Sweet_Potatoes", "Tantuni_Et", "Tantuni_Tavuk", "Tarhana_Corbasi", "Tea",
    "Tomato", "Watermelon", "Yayla_Corbasi", "Zucchini",
    # Yeni 25 sinif (90-114)
    "Apple_Pie", "Blueberry", "Boiled_Eggs", "Borek", "Brownie",
    "Cheburek", "Chocolate", "Churro", "Cookies", "Cream_Puff",
    "Crepe", "Croissant", "Doughnut", "Gozleme", "Grilled_Eggplant",
    "Ice_Cream", "Mashed_Potato", "Muffin", "Pancakes", "Popcorn",
    "Samsa", "Scrambled_Egg", "Simit", "Tiramisu", "Waffle",
]
assert len(CLASS_NAMES) == 115, f"115 sinif olmali, simdi: {len(CLASS_NAMES)}"


# -------------------------------------------------------------------
# Yardimci fonksiyonlar
# -------------------------------------------------------------------

def link_or_copy(src: Path, dst: Path):
    """Hard link olustur, basarisiz olursa kopyala."""
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def coco_bbox_to_yolo(bbox, img_w, img_h):
    """COCO [x_min, y_min, w, h] -> YOLO [x_c, y_c, w_n, h_n] (normalize)."""
    x, y, w, h = bbox
    x_c = (x + w / 2) / img_w
    y_c = (y + h / 2) / img_h
    w_n = w / img_w
    h_n = h / img_h
    # Guvenlik: [0,1] araliginda tut
    x_c = max(0.0, min(1.0, x_c))
    y_c = max(0.0, min(1.0, y_c))
    w_n = max(0.0, min(1.0, w_n))
    h_n = max(0.0, min(1.0, h_n))
    return x_c, y_c, w_n, h_n


def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_yaml(path: Path, out_dir: Path):
    lines = [
        f"path: {out_dir}",
        "train: images/train",
        "val:   images/val",
        "test:  images/test",
        f"nc: {len(CLASS_NAMES)}",
        "names:",
    ]
    for name in CLASS_NAMES:
        lines.append(f"- {name}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  Yazildi: {path}")


# -------------------------------------------------------------------
# Kaynak 1: Mevcut YOLO dataset
# -------------------------------------------------------------------

def add_existing_yolo(split: str, out_img_dir: Path, out_lbl_dir: Path, apply: bool):
    src_img = EXISTING_YOLO / "images" / split
    src_lbl = EXISTING_YOLO / "labels" / split

    if not src_img.exists():
        print(f"  [WARN] {src_img} bulunamadi, atlaniyor.")
        return 0

    files = list(src_img.glob("*.*"))
    if apply:
        for img_path in files:
            link_or_copy(img_path, out_img_dir / img_path.name)
            lbl_path = src_lbl / (img_path.stem + ".txt")
            if lbl_path.exists():
                link_or_copy(lbl_path, out_lbl_dir / lbl_path.name)
    return len(files)


# -------------------------------------------------------------------
# Kaynak 2 & 3: COCO JSON -> YOLO
# -------------------------------------------------------------------

def add_coco_dataset(
    json_path: Path,
    images_dir: Path,
    prefix: str,
    out_img_dir: Path,
    out_lbl_dir: Path,
    apply: bool,
) -> tuple:
    """
    COCO JSON'dan YOLO label dosyalari olusturur ve gorselleri kopyalar.
    Gorsel dosya ismine 'prefix' ekler (cakismalari onlemek icin).
    Returns: (copied, skipped)
    """
    if not json_path.exists():
        print(f"  [WARN] {json_path} bulunamadi, atlaniyor.")
        return 0, 0

    data = load_json(json_path)

    img_info = {img["id"]: img for img in data["images"]}
    ann_by_img = defaultdict(list)
    for ann in data["annotations"]:
        ann_by_img[ann["image_id"]].append(ann)

    copied = 0
    skipped = 0

    for img_id, img in img_info.items():
        src_img = images_dir / img["file_name"]
        if not src_img.exists():
            skipped += 1
            continue

        anns = ann_by_img.get(img_id, [])
        if not anns:
            skipped += 1
            continue

        img_w = img.get("width", 0)
        img_h = img.get("height", 0)
        if img_w <= 0 or img_h <= 0:
            skipped += 1
            continue

        if apply:
            dst_name = prefix + img["file_name"]
            dst_img  = out_img_dir / dst_name
            dst_lbl  = out_lbl_dir / (Path(dst_name).stem + ".txt")
            link_or_copy(src_img, dst_img)
            label_lines = []
            for ann in anns:
                cid = ann["category_id"]
                x_c, y_c, w_n, h_n = coco_bbox_to_yolo(ann["bbox"], img_w, img_h)
                label_lines.append(f"{cid} {x_c:.6f} {y_c:.6f} {w_n:.6f} {h_n:.6f}")
            dst_lbl.write_text("\n".join(label_lines) + "\n", encoding="utf-8")

        copied += 1

    return copied, skipped


# -------------------------------------------------------------------
# Ana
# -------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Dataset birlestirme")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUT))
    parser.add_argument("--apply",      action="store_true")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    mode    = "UYGULAMA" if args.apply else "SIMULE (gorsel kopyalanmaz, --apply ile uygula)"

    print(f"\nMerge Dataset")
    print(f"  Cikti : {out_dir}")
    print(f"  Mod   : {mode}\n")

    # uecfood split JSON'larinin varligini kontrol et
    for split in SPLITS:
        p = PROCESSED_DIR / "uecfood256" / f"instances_{split}.json"
        if not p.exists():
            print(f"[ERR] {p} bulunamadi!")
            print("      Once: python split_uecfood2565.py --apply")
            return

    total_counts = {split: {"yolo": 0, "gfsd": 0, "uec": 0, "skip": 0} for split in SPLITS}

    for split in SPLITS:
        print(f"--- {split} ---")

        if args.apply:
            out_img = out_dir / "images" / split
            out_lbl = out_dir / "labels" / split
            out_img.mkdir(parents=True, exist_ok=True)
            out_lbl.mkdir(parents=True, exist_ok=True)
        else:
            out_img = out_lbl = None  # simule modunda kullanilmaz

        # 1. Mevcut YOLO
        n_yolo = add_existing_yolo(split, out_img, out_lbl, args.apply)
        total_counts[split]["yolo"] = n_yolo
        print(f"  final_data_yolo [{split}]: {n_yolo} gorsel")

        # 2. GFSD
        gfsd_json = PROCESSED_DIR / "gfsd" / f"instances_{split}.json"
        gfsd_img_dir = GFSD_IMGS / split / "images"
        n_gfsd, skip_gfsd = add_coco_dataset(
            gfsd_json, gfsd_img_dir, "gfsd_", out_img, out_lbl, args.apply
        )
        total_counts[split]["gfsd"]  = n_gfsd
        total_counts[split]["skip"] += skip_gfsd
        print(f"  GFSD      [{split}]: {n_gfsd} gorsel  ({skip_gfsd} atlandi)")

        # 3. UECFOOD256
        uec_json = PROCESSED_DIR / "uecfood256" / f"instances_{split}.json"
        n_uec, skip_uec = add_coco_dataset(
            uec_json, UEC_IMGS, "uec_", out_img, out_lbl, args.apply
        )
        total_counts[split]["uec"]   = n_uec
        total_counts[split]["skip"] += skip_uec
        print(f"  UECFOOD   [{split}]: {n_uec} gorsel  ({skip_uec} atlandi)")

        split_total = n_yolo + n_gfsd + n_uec
        print(f"  Toplam    [{split}]: {split_total} gorsel\n")

    # Ozet
    print("--- Ozet ---")
    grand_total = 0
    for split in SPLITS:
        c = total_counts[split]
        t = c["yolo"] + c["gfsd"] + c["uec"]
        grand_total += t
        print(f"  [{split}]  yolo={c['yolo']}  gfsd={c['gfsd']}  uec={c['uec']}  "
              f"toplam={t}  (atlanan={c['skip']})")
    print(f"  Genel toplam: {grand_total} gorsel")

    # data.yaml
    if args.apply:
        write_yaml(out_dir / "data.yaml", out_dir)
    else:
        print("\nNot: --apply ekle, hicbir dosya olusturulmadi.")


if __name__ == "__main__":
    main()
