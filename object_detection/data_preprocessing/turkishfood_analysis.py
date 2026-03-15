"""
turkish25_coco dataset analysis
Object detection hatalari ve istatistikleri icin kapsamli kontrol.

Kullanim:
    python turkishfood_analysis.py
    python turkishfood_analysis.py --dataset-dir D:/baska/path
    python turkishfood_analysis.py --fix   # bazi otomatik duzeltmeleri yazar
"""

import json
import argparse
import sys
import struct
from pathlib import Path
from collections import defaultdict, Counter


DATASET_DIR = Path("D:/Desktop/Bitirme/NutriGame/object_detection/raw_datasets/turkish25_coco")
SPLITS = ["train", "val", "test"]

# -------------------------------------------------------------------
# Yardimci fonksiyonlar
# -------------------------------------------------------------------

def load_coco(json_path: Path) -> dict:
    with open(json_path, encoding="utf-8") as f:
        return json.load(f)


def print_section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def print_ok(msg: str):
    print(f"  [OK]   {msg}")


def print_warn(msg: str):
    print(f"  [WARN] {msg}")


def print_err(msg: str):
    print(f"  [ERR]  {msg}")


def get_image_size(image_path: Path) -> tuple[int, int]:
    """Read image dimensions using only the Python standard library."""
    with image_path.open("rb") as f:
        header = f.read(24)

        # PNG: width/height are stored in IHDR bytes 16..24.
        if header.startswith(b"\x89PNG\r\n\x1a\n") and len(header) >= 24:
            width, height = struct.unpack(">II", header[16:24])
            return int(width), int(height)

    # JPEG needs marker scanning, done in a separate open/scan pass.
    with image_path.open("rb") as f:
        if f.read(2) != b"\xff\xd8":
            raise ValueError("Unsupported format (expected PNG or JPEG)")

        while True:
            byte = f.read(1)
            if not byte:
                break
            if byte != b"\xff":
                continue

            marker = f.read(1)
            while marker == b"\xff":
                marker = f.read(1)
            if not marker:
                break

            marker_int = marker[0]
            if marker_int in {0xD8, 0xD9}:
                continue

            length_bytes = f.read(2)
            if len(length_bytes) != 2:
                break
            seg_len = struct.unpack(">H", length_bytes)[0]
            if seg_len < 2:
                raise ValueError("Invalid JPEG segment")

            if marker_int in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                sof_data = f.read(seg_len - 2)
                if len(sof_data) < 5:
                    break
                height, width = struct.unpack(">HH", sof_data[1:5])
                return int(width), int(height)

            f.seek(seg_len - 2, 1)

    raise ValueError("Could not read image dimensions")


# -------------------------------------------------------------------
# 1. Temel istatistikler
# -------------------------------------------------------------------

def check_basic_stats(data: dict, split: str, images_dir: Path):
    print_section(f"{split.upper()} - Temel istatistikler")

    n_images = len(data["images"])
    n_anns = len(data["annotations"])
    n_cats = len(data["categories"])
    print(f"  Gorsel sayisi   : {n_images}")
    print(f"  Annotation sayisi: {n_anns}")
    print(f"  Kategori sayisi : {n_cats}")

    if n_images > 0:
        print(f"  Ann/gorsel ort. : {n_anns / n_images:.2f}")

    fs_images = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpeg"))
    print(f"  Klasordeki dosya: {len(fs_images)}")


# -------------------------------------------------------------------
# 2. ID tutarlilik kontrolleri
# -------------------------------------------------------------------

def check_id_consistency(data: dict, split: str) -> dict:
    print_section(f"{split.upper()} - ID tutarlilik")
    errors = defaultdict(list)

    # Duplicate image ID
    img_ids = [img["id"] for img in data["images"]]
    dup_img = [iid for iid, cnt in Counter(img_ids).items() if cnt > 1]
    if dup_img:
        print_err(f"Duplicate image ID: {dup_img[:10]}")
        errors["dup_image_id"].extend(dup_img)
    else:
        print_ok("Image ID'ler unique")

    # Duplicate annotation ID
    ann_ids = [ann["id"] for ann in data["annotations"]]
    dup_ann = [aid for aid, cnt in Counter(ann_ids).items() if cnt > 1]
    if dup_ann:
        print_err(f"Duplicate annotation ID: {dup_ann[:10]}")
        errors["dup_ann_id"].extend(dup_ann)
    else:
        print_ok("Annotation ID'ler unique")

    # Annotation image_id -> image tablosunda var mi?
    img_id_set = set(img_ids)
    dangling = [ann["id"] for ann in data["annotations"] if ann["image_id"] not in img_id_set]
    if dangling:
        print_err(f"Annotation'da gecersiz image_id (orphan): {len(dangling)} adet, ornekler: {dangling[:5]}")
        errors["dangling_ann"].extend(dangling)
    else:
        print_ok("Tum annotation image_id'leri images tablosunda mevcut")

    # Category ID -> categories tablosunda var mi?
    cat_id_set = {cat["id"] for cat in data["categories"]}
    bad_cat = [ann["id"] for ann in data["annotations"] if ann["category_id"] not in cat_id_set]
    if bad_cat:
        print_err(f"Annotation'da gecersiz category_id: {len(bad_cat)} adet, ornekler: {bad_cat[:5]}")
        errors["bad_category_id"].extend(bad_cat)
    else:
        print_ok("Tum annotation category_id'leri categories tablosunda mevcut")

    return errors


# -------------------------------------------------------------------
# 3. Bbox gecerlilik kontrolleri
# -------------------------------------------------------------------

def check_bboxes(data: dict, split: str) -> dict:
    print_section(f"{split.upper()} - Bbox gecerlilik")
    errors = defaultdict(list)

    img_size_map = {img["id"]: (img["width"], img["height"]) for img in data["images"]}

    neg_bbox = []
    zero_area = []
    out_of_bounds = []
    tiny_bbox = []   # min kenar < 2 piksel
    area_mismatch = []

    for ann in data["annotations"]:
        ann_id = ann["id"]
        bbox = ann.get("bbox", [])

        if len(bbox) != 4:
            print_warn(f"Ann {ann_id}: bbox uzunlugu {len(bbox)} (beklenen 4)")
            errors["bad_bbox_format"].append(ann_id)
            continue

        x, y, w, h = bbox

        # Negatif koordinat veya boyut
        if x < 0 or y < 0 or w <= 0 or h <= 0:
            neg_bbox.append(ann_id)

        # Sifir alan
        area_calc = w * h
        if area_calc <= 0:
            zero_area.append(ann_id)

        # Alan uyumsuzlugu (COCO 'area' alani ile hesaplanan fark > %5)
        recorded_area = ann.get("area", -1)
        if recorded_area > 0 and abs(area_calc - recorded_area) / recorded_area > 0.05:
            area_mismatch.append((ann_id, area_calc, recorded_area))

        # Kucuk bbox
        if w < 2 or h < 2:
            tiny_bbox.append(ann_id)

        # Gorsel sinirlarini asiyor mu?
        if ann["image_id"] in img_size_map:
            iw, ih = img_size_map[ann["image_id"]]
            if x + w > iw + 1 or y + h > ih + 1:  # 1px tolerans
                out_of_bounds.append((ann_id, [x, y, w, h], iw, ih))

    if neg_bbox:
        print_err(f"Negatif/sifir boyutlu bbox: {len(neg_bbox)} adet, ornekler: {neg_bbox[:5]}")
        errors["neg_bbox"].extend(neg_bbox)
    else:
        print_ok("Tum bbox koordinatlari pozitif")

    if zero_area:
        print_err(f"Sifir alanli bbox: {len(zero_area)} adet")
        errors["zero_area"].extend(zero_area)
    else:
        print_ok("Sifir alanli bbox yok")

    if tiny_bbox:
        print_warn(f"Cok kucuk bbox (< 2px): {len(tiny_bbox)} adet, ornekler: {tiny_bbox[:5]}")
        errors["tiny_bbox"].extend(tiny_bbox)
    else:
        print_ok("Cok kucuk bbox yok")

    if out_of_bounds:
        print_err(f"Gorsel siniri disan tastan bbox: {len(out_of_bounds)} adet")
        for ann_id, box, iw, ih in out_of_bounds[:5]:
            print(f"    Ann {ann_id}: bbox={box}, gorsel={iw}x{ih}")
        errors["out_of_bounds"].extend([x[0] for x in out_of_bounds])
    else:
        print_ok("Tum bbox'lar gorsel siniri icinde")

    if area_mismatch:
        print_warn(f"Alan uyumsuzlugu (>%5): {len(area_mismatch)} adet, ornekler: {area_mismatch[:3]}")
        errors["area_mismatch"].extend([x[0] for x in area_mismatch])
    else:
        print_ok("Alan degerleri tutarli")

    return errors


# -------------------------------------------------------------------
# 4. Gorsel dosyasi kontrolleri
# -------------------------------------------------------------------

def check_images(data: dict, split: str, images_dir: Path, check_size: bool = True) -> dict:
    print_section(f"{split.upper()} - Gorsel dosya kontrolleri")
    errors = defaultdict(list)

    fs_names = {f.name for f in images_dir.iterdir() if f.is_file()}

    missing = []
    corrupt = []
    size_mismatch = []

    for img in data["images"]:
        fname = img["file_name"]
        fpath = images_dir / fname

        if fname not in fs_names:
            missing.append(fname)
            continue

        if check_size:
            try:
                actual_w, actual_h = get_image_size(fpath)
                recorded_w = img.get("width", -1)
                recorded_h = img.get("height", -1)
                if recorded_w > 0 and recorded_h > 0:
                    if actual_w != recorded_w or actual_h != recorded_h:
                        size_mismatch.append({
                            "file": fname,
                            "recorded": (recorded_w, recorded_h),
                            "actual": (actual_w, actual_h),
                        })
            except Exception as e:
                corrupt.append((fname, str(e)))

    if missing:
        print_err(f"JSON'da var ama klasorde yok: {len(missing)} gorsel")
        for name in missing[:5]:
            print(f"    {name}")
        errors["missing_file"].extend(missing)
    else:
        print_ok("Tum JSON gorselleri klasorde mevcut")

    if corrupt:
        print_err(f"Bozuk / acilamayan gorsel: {len(corrupt)} adet")
        for name, reason in corrupt[:5]:
            print(f"    {name}: {reason}")
        errors["corrupt"].extend([x[0] for x in corrupt])
    else:
        print_ok("Tum gorseller acilabilir durumda")

    if size_mismatch:
        print_warn(f"JSON'daki boyut != gercek boyut: {len(size_mismatch)} gorsel")
        for item in size_mismatch[:5]:
            print(f"    {item['file']}: JSON={item['recorded']}, gercek={item['actual']}")
        errors["size_mismatch"].extend([x["file"] for x in size_mismatch])
    else:
        print_ok("Tum gorsel boyutlari JSON ile uyumsuz")

    # Klasorde var ama JSON'da yok
    json_fnames = {img["file_name"] for img in data["images"]}
    extra = [f for f in fs_names if f not in json_fnames]
    if extra:
        print_warn(f"Klasorde var ama JSON'da yok (split={split}): {len(extra)} gorsel, ornekler: {extra[:5]}")
        errors["extra_file"].extend(extra)

    return errors


# -------------------------------------------------------------------
# 5. Kategori dagilimi
# -------------------------------------------------------------------

def check_category_distribution(data: dict, split: str):
    print_section(f"{split.upper()} - Kategori dagilimi")

    cat_id_to_name = {cat["id"]: cat["name"] for cat in data["categories"]}
    ann_per_cat = Counter(ann["category_id"] for ann in data["annotations"])

    # Hic annotationu olmayan kategoriler
    all_cat_ids = set(cat_id_to_name.keys())
    empty_cats = all_cat_ids - set(ann_per_cat.keys())
    if empty_cats:
        print_warn(f"Annotation'u olmayan kategori: {len(empty_cats)} adet")
        for cid in sorted(empty_cats):
            print(f"    [{cid}] {cat_id_to_name.get(cid, '?')}")
    else:
        print_ok("Her kategorinin en az 1 annotation'u var")

    # En fazla / en az annotation
    if ann_per_cat:
        most = ann_per_cat.most_common(5)
        least = ann_per_cat.most_common()[:-6:-1]
        print("\n  En fazla annotation (Top 5):")
        for cid, cnt in most:
            print(f"    [{cid:3d}] {cat_id_to_name.get(cid, '?'):<30} {cnt:6d}")
        print("\n  En az annotation (Bottom 5):")
        for cid, cnt in least:
            print(f"    [{cid:3d}] {cat_id_to_name.get(cid, '?'):<30} {cnt:6d}")

    # Gorsel basina annotation dagitimi
    img_ann_count = Counter(ann["image_id"] for ann in data["annotations"])
    no_ann_images = len(data["images"]) - len(img_ann_count)
    if no_ann_images > 0:
        print_warn(f"Annotation'u olmayan gorsel: {no_ann_images} adet")
    else:
        print_ok("Her gorselin en az 1 annotation'u var")

    multi_ann = sum(1 for cnt in img_ann_count.values() if cnt > 1)
    print(f"  Birden fazla annotation iceren gorsel: {multi_ann}")


# -------------------------------------------------------------------
# 6. Split cakisma kontrolu
# -------------------------------------------------------------------

def check_split_overlap(all_data: dict):
    print_section("Split cakismasi (train/val/test)")

    split_img_ids = {}
    split_fnames = {}
    for split, data in all_data.items():
        split_img_ids[split] = set(img["id"] for img in data["images"])
        split_fnames[split] = set(img["file_name"] for img in data["images"])

    # Not: her split kendi ayri JSON'una sahip oldugunda image ID'lerin
    # splitler arasinda tekrarlamasi normaldir; sadece dosya adi cakismasi kontrol edilir.
    splits = list(all_data.keys())
    found_any = False
    for i in range(len(splits)):
        for j in range(i + 1, len(splits)):
            s1, s2 = splits[i], splits[j]
            fn_overlap = split_fnames[s1] & split_fnames[s2]
            if fn_overlap:
                print_err(f"{s1}/{s2} dosya adi cakismasi: {len(fn_overlap)} adet, ornekler: {list(fn_overlap)[:5]}")
                found_any = True

    if not found_any:
        print_ok("Splitler arasinda gorsel cakismasi yok")


# -------------------------------------------------------------------
# 7. Kategori tutarlilik (tum splitlerde ayni mi?)
# -------------------------------------------------------------------

def check_category_consistency(all_data: dict):
    print_section("Kategori tutarlilik (tum splitler)")

    cat_sets = {}
    for split, data in all_data.items():
        cat_sets[split] = {(cat["id"], cat["name"]) for cat in data["categories"]}

    ref_split = list(cat_sets.keys())[0]
    ref_cats = cat_sets[ref_split]

    for split, cats in cat_sets.items():
        if split == ref_split:
            continue
        diff = ref_cats.symmetric_difference(cats)
        if diff:
            print_err(f"{ref_split} vs {split} kategoriler farkli: {diff}")
        else:
            print_ok(f"{ref_split} vs {split}: kategoriler ayni")


# -------------------------------------------------------------------
# Ana
# -------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Turkish25 COCO dataset analizi")
    parser.add_argument("--dataset-dir", type=str, default=str(DATASET_DIR),
                        help="Dataset kok dizini (images/ ve *.json iceren)")
    parser.add_argument("--no-size-check", action="store_true",
                        help="Gorsel boyut kontrolunu atla (cok yavas olursa)")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    images_dir = dataset_dir / "images"

    if not dataset_dir.exists():
        print(f"[ERR] Dataset dizini bulunamadi: {dataset_dir}")
        sys.exit(1)
    if not images_dir.exists():
        print(f"[ERR] images/ klasoru bulunamadi: {images_dir}")
        sys.exit(1)

    print(f"\nDataset: {dataset_dir}")
    print(f"Gorsel klasoru: {images_dir}")

    # Tum splitleri yukle
    all_data = {}
    for split in SPLITS:
        json_path = dataset_dir / f"instances_{split}.json"
        if not json_path.exists():
            print_warn(f"instances_{split}.json bulunamadi, atlaniyor.")
            continue
        all_data[split] = load_coco(json_path)

    if not all_data:
        print("[ERR] Hicbir JSON dosyasi bulunamadi.")
        sys.exit(1)

    # Her split icin bireysel kontroller
    total_errors = defaultdict(int)
    for split, data in all_data.items():
        check_basic_stats(data, split, images_dir)
        errs = check_id_consistency(data, split)
        for k, v in errs.items():
            total_errors[k] += len(v)

        errs = check_bboxes(data, split)
        for k, v in errs.items():
            total_errors[k] += len(v)

        errs = check_images(data, split, images_dir, check_size=not args.no_size_check)
        for k, v in errs.items():
            total_errors[k] += len(v)

        check_category_distribution(data, split)

    # Splitler arasi kontroller
    check_split_overlap(all_data)
    check_category_consistency(all_data)

    # Ozet
    print_section("OZET")
    if not total_errors:
        print_ok("Hic kritik hata bulunamadi.")
    else:
        print(f"  Toplam sorun turu : {len(total_errors)}")
        for err_type, cnt in sorted(total_errors.items(), key=lambda x: -x[1]):
            tag = "[ERR]" if err_type in {"neg_bbox", "zero_area", "missing_file",
                                          "dup_image_id", "dup_ann_id",
                                          "dangling_ann", "bad_category_id",
                                          "out_of_bounds", "corrupt"} else "[WARN]"
            print(f"  {tag} {err_type:<25} : {cnt}")

    print()


if __name__ == "__main__":
    main()
