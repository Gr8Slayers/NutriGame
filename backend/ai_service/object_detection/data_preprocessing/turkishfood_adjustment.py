"""
turkish25_coco dataset duzeltme scripti.

Duzeltilen sorunlar:
  1. Boyut uyumsuzlugu: JSON'daki width/height gercek boyutla guncellenir,
     pseudo-label bbox'lari (5% border) yeniden hesaplanir.
  2. Veri sizintisi: train/val/test arasinda ayni dosya adi varsa
     ilgili gorsel ve annotation'lar val/test'ten cikarilir (train'de kalir).

Kullanim:
    python turkishfood_adjustment.py             # simule et (yazma)
    python turkishfood_adjustment.py --apply     # degisiklikleri JSON'a yaz
    python turkishfood_adjustment.py --apply --output-dir D:/baska/path
"""

import json
import struct
import argparse
import shutil
from pathlib import Path



DATASET_DIR = Path("D:/Desktop/Bitirme/NutriGame/object_detection/raw_datasets/turkish25_coco")
SPLITS = ["train", "val", "test"]

BORDER_RATIO = 0.05  # pseudo-label olusturulurken kullanilan kenar orani


# -------------------------------------------------------------------
# Yardimci
# -------------------------------------------------------------------

def get_image_size(image_path: Path):
    """Standart kutuphane gerektirmeden PNG/JPEG boyutunu oku."""
    with image_path.open("rb") as f:
        header = f.read(24)

    if header.startswith(b"\x89PNG\r\n\x1a\n") and len(header) >= 24:
        w, h = struct.unpack(">II", header[16:24])
        return int(w), int(h)

    with image_path.open("rb") as f:
        if f.read(2) != b"\xff\xd8":
            raise ValueError("Desteklenmeyen format (PNG veya JPEG bekleniyor)")
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
            mi = marker[0]
            if mi in {0xD8, 0xD9}:
                continue
            lb = f.read(2)
            if len(lb) != 2:
                break
            sl = struct.unpack(">H", lb)[0]
            if sl < 2:
                break
            if mi in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                sof = f.read(sl - 2)
                if len(sof) < 5:
                    break
                h, w = struct.unpack(">HH", sof[1:5])
                return int(w), int(h)
            f.seek(sl - 2, 1)

    raise ValueError("Gorsel boyutu okunamiyor")


def calc_pseudo_bbox(actual_w: int, actual_h: int):
    """5% border ile tam-gorsel pseudo-label bbox hesapla. [x, y, w, h] dondurur."""
    x = round(BORDER_RATIO * actual_w)
    y = round(BORDER_RATIO * actual_h)
    bw = round((1 - 2 * BORDER_RATIO) * actual_w)
    bh = round((1 - 2 * BORDER_RATIO) * actual_h)
    return [float(x), float(y), float(bw), float(bh)]


def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(data: dict, path: Path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  Yazildi: {path}")


# -------------------------------------------------------------------
# Duzeltme 1: Boyut uyumsuzlugu
# -------------------------------------------------------------------

def fix_size_mismatch(data: dict, images_dir: Path, split: str) -> tuple:
    """
    JSON'daki her gorsel icin gercek boyutu okur.
    Eger farkli ise width/height gunceller ve bbox'i yeniden hesaplar.
    """
    ann_map = {ann["image_id"]: ann for ann in data["annotations"]}
    fixed_count = 0
    preview_shown = 0

    for img in data["images"]:
        fpath = images_dir / img["file_name"]
        if not fpath.exists():
            continue

        try:
            actual_w, actual_h = get_image_size(fpath)
        except Exception as e:
            print(f"  [WARN] {img['file_name']} okunamadi: {e}")
            continue

        recorded_w = img.get("width", -1)
        recorded_h = img.get("height", -1)

        if actual_w == recorded_w and actual_h == recorded_h:
            continue

        old_size = (recorded_w, recorded_h)
        img["width"] = actual_w
        img["height"] = actual_h

        ann = ann_map.get(img["id"])
        old_bbox = None
        if ann is not None:
            old_bbox = ann["bbox"][:]
            new_bbox = calc_pseudo_bbox(actual_w, actual_h)
            ann["bbox"] = new_bbox
            ann["area"] = float(new_bbox[2] * new_bbox[3])

        fixed_count += 1

        if preview_shown < 5:
            old_bbox_str = [round(v) for v in old_bbox] if old_bbox is not None else "ann yok"
            new_bbox_str = [round(v) for v in ann["bbox"]] if ann is not None else "ann yok"
            print(f"    {img['file_name']}: boyut {old_size} -> ({actual_w},{actual_h}), "
                  f"bbox: {old_bbox_str} -> {new_bbox_str}")
            preview_shown += 1

    if fixed_count > 5:
        print(f"    ... ve {fixed_count - 5} gorsel daha")
    print(f"  [{split}] Boyut duzeltilen: {fixed_count} gorsel")
    return data, fixed_count


# -------------------------------------------------------------------
# Duzeltme 2: Veri sizintisi
# -------------------------------------------------------------------

def remove_overlap(data: dict, exclude_fnames: set, ref_label: str, split_label: str):
    """exclude_fnames'te olan gorselleri data'dan cikarir."""
    overlap = {img["file_name"] for img in data["images"]} & exclude_fnames
    if not overlap:
        print(f"  [{split_label}] {ref_label} ile veri sizintisi yok")
        return data

    overlap_ids = {img["id"] for img in data["images"] if img["file_name"] in overlap}
    old_imgs = len(data["images"])
    old_anns = len(data["annotations"])

    data["images"] = [img for img in data["images"] if img["file_name"] not in overlap]
    data["annotations"] = [ann for ann in data["annotations"]
                            if ann["image_id"] not in overlap_ids]

    removed_imgs = old_imgs - len(data["images"])
    removed_anns = old_anns - len(data["annotations"])
    print(f"  [{split_label}] {removed_imgs} gorsel ve {removed_anns} annotation kaldirildi "
          f"({ref_label} ile cakisan: {len(overlap)} dosya adi)")
    return data


def fix_data_leakage(all_data: dict) -> dict:
    """
    Splitler arasinda ayni dosya adina sahip gorsel varsa:
      - train > val > test oncelik sirasi: once train'de birakip val/test'ten cikar,
        sonra val'de birakip test'ten cikar.
    """
    if "train" in all_data:
        train_fnames = {img["file_name"] for img in all_data["train"]["images"]}
        for split in ["val", "test"]:
            if split in all_data:
                all_data[split] = remove_overlap(all_data[split], train_fnames, "train", split)

    # val/test cakismasi: val'de birakip test'ten cikar
    if "val" in all_data and "test" in all_data:
        val_fnames = {img["file_name"] for img in all_data["val"]["images"]}
        all_data["test"] = remove_overlap(all_data["test"], val_fnames, "val", "test")

    return all_data


# -------------------------------------------------------------------
# Ana
# -------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Turkish25 COCO dataset duzeltme")
    parser.add_argument("--dataset-dir", type=str, default=str(DATASET_DIR))
    parser.add_argument("--output-dir", type=str, default=None,
                        help="Cikti dizini (varsayilan: dataset-dir, yerinde gunceller)")
    parser.add_argument("--apply", action="store_true",
                        help="Degisiklikleri diske yaz (yoksa sadece simule eder)")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    images_dir = dataset_dir / "images"
    output_dir = Path(args.output_dir) if args.output_dir else dataset_dir

    if not dataset_dir.exists():
        print(f"[ERR] Dizin bulunamadi: {dataset_dir}")
        return
    if not images_dir.exists():
        print(f"[ERR] images/ bulunamadi: {images_dir}")
        return

    mode = "UYGULAMA" if args.apply else "SIMULE (degisiklikler yazilmaz, --apply ile yaz)"
    print(f"\nMod     : {mode}")
    print(f"Dataset : {dataset_dir}")
    print(f"Cikti   : {output_dir}")

    # JSON'lari yukle
    all_data = {}
    for split in SPLITS:
        p = dataset_dir / f"instances_{split}.json"
        if not p.exists():
            print(f"[WARN] {p.name} bulunamadi, atlaniyor.")
            continue
        all_data[split] = load_json(p)

    # --- Duzeltme 1: Boyut uyumsuzlugu ---
    print("\n--- Duzeltme 1: Boyut uyumsuzlugu ---")
    total_fixed = 0
    for split, data in all_data.items():
        data, n = fix_size_mismatch(data, images_dir, split)
        total_fixed += n

    # --- Duzeltme 2: Veri sizintisi ---
    print("\n--- Duzeltme 2: Veri sizintisi ---")
    if "train" not in all_data:
        print("  [WARN] train JSON'u yok, sizinti kontrolu atlandi.")
    else:
        all_data = fix_data_leakage(all_data)

    # --- Sonuc ---
    print("\n--- Sonuc ---")
    for split, data in all_data.items():
        print(f"  [{split}] {len(data['images'])} gorsel, {len(data['annotations'])} annotation")
    print(f"  Toplam boyut duzeltmesi: {total_fixed} gorsel")

    # --- Kaydet ---
    if args.apply:
        if output_dir != dataset_dir:
            output_dir.mkdir(parents=True, exist_ok=True)
            print(f"\nNot: sadece JSON'lar yaziliyor, images/ kopyalanmiyor.")
        else:
            # Yerinde guncelleme: once yedek al
            for split in all_data:
                src = dataset_dir / f"instances_{split}.json"
                bak = dataset_dir / f"instances_{split}.json.bak"
                if not bak.exists():
                    shutil.copy2(src, bak)
                    print(f"  Yedek alindi: {bak.name}")

        print()
        for split, data in all_data.items():
            out_path = output_dir / f"instances_{split}.json"
            save_json(data, out_path)
    else:
        print("\nNot: --apply ekle, degisiklikler diske yazilmadi.")


if __name__ == "__main__":
    main()
