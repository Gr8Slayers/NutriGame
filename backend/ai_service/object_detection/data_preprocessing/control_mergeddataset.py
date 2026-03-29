"""
Merged YOLO dataset dogrulama scripti.

Kontroller:
  1. Gorsel / label eslesmesi (orphan dosya var mi)
  2. Label formati (5 sutun, float class ID destekli)
  3. Class ID aralik kontrolu [0, NC)
  4. Bbox deger aralik kontrolu [0, 1]
  5. Bos label dosyasi sayisi
  6. Split bazinda sinif dagilimi

Kullanim:
    python control_mergeddataset.py
    python control_mergeddataset.py --merged-dir path/to/merged --nc 115
"""

import argparse
from pathlib import Path
from collections import Counter


MERGED_DIR = Path("D:/Desktop/Bitirme/NutriGame/object_detection/processed_datasets/merged")
NC_DEFAULT = 115


def check_split(split_dir: Path, nc: int, names: list) -> dict:
    img_dir = split_dir / "images"
    lbl_dir = split_dir / "labels"

    img_stems = {p.stem for p in img_dir.glob("*") if p.is_file()}
    lbl_stems = {p.stem for p in lbl_dir.glob("*.txt")}

    only_img = img_stems - lbl_stems
    only_lbl = lbl_stems - img_stems

    empty        = []
    bad_class    = []
    bad_bbox     = []
    float_ids    = 0
    total_anns   = 0
    class_counts = Counter()

    for lbl_path in sorted(lbl_dir.glob("*.txt")):
        text  = lbl_path.read_text(encoding="utf-8").strip()
        lines = text.splitlines() if text else []

        if not lines:
            empty.append(lbl_path.name)
            continue

        for line in lines:
            parts = line.split()
            if len(parts) != 5:
                bad_bbox.append((lbl_path.name, line))
                continue

            if "." in parts[0]:
                float_ids += 1

            try:
                cid = int(float(parts[0]))
            except ValueError:
                bad_class.append((lbl_path.name, parts[0]))
                continue

            try:
                coords = list(map(float, parts[1:]))
            except ValueError:
                bad_bbox.append((lbl_path.name, line))
                continue

            if cid < 0 or cid >= nc:
                bad_class.append((lbl_path.name, cid))
            else:
                class_counts[cid] += 1

            if any(v < -0.001 or v > 1.001 for v in coords):
                bad_bbox.append((lbl_path.name, coords))

            total_anns += 1

    return {
        "img":          len(img_stems),
        "lbl":          len(lbl_stems),
        "only_img":     only_img,
        "only_lbl":     only_lbl,
        "empty":        empty,
        "bad_class":    bad_class,
        "bad_bbox":     bad_bbox,
        "float_ids":    float_ids,
        "total_anns":   total_anns,
        "class_counts": class_counts,
    }


def print_split_report(split: str, r: dict, nc: int, names: list):
    ok = len(r["only_img"]) == 0 and len(r["only_lbl"]) == 0 \
         and len(r["bad_class"]) == 0 and len(r["bad_bbox"]) == 0

    status = "OK" if ok else "HATA"
    print(f"\n[{split}]  {status}")
    print(f"  Gorsel : {r['img']:>6}  |  Label : {r['lbl']:>6}  |  Annotation : {r['total_anns']:>7}")
    print(f"  Sadece gorsel (label yok) : {len(r['only_img'])}")
    print(f"  Sadece label  (gorsel yok): {len(r['only_lbl'])}")
    print(f"  Bos label dosyasi         : {len(r['empty'])}")
    print(f"  Float class ID (uyari)    : {r['float_ids']}")
    print(f"  Gecersiz class ID         : {len(r['bad_class'])}")
    print(f"  Gecersiz bbox degeri      : {len(r['bad_bbox'])}")

    if r["only_img"]:
        sample = sorted(r["only_img"])[:5]
        print(f"  Ornek sadece_gorsel: {sample}")
    if r["only_lbl"]:
        sample = sorted(r["only_lbl"])[:5]
        print(f"  Ornek sadece_label : {sample}")
    if r["bad_class"]:
        print(f"  Ornek gecersiz_class: {r['bad_class'][:5]}")
    if r["bad_bbox"]:
        print(f"  Ornek gecersiz_bbox : {r['bad_bbox'][:3]}")

    # Sinif dagilimi
    print(f"\n  Sinif dagilimi (ilk 20, toplam aktif sinif: {len(r['class_counts'])}/{nc}):")
    missing = [i for i in range(nc) if r["class_counts"].get(i, 0) == 0]
    for cid, cnt in sorted(r["class_counts"].items(), key=lambda x: -x[1])[:20]:
        name = names[cid] if names and cid < len(names) else f"id:{cid}"
        flag = " (aug gerekli)" if cnt < 150 else ""
        print(f"    [{cid:3d}] {name:<30} {cnt:>6}{flag}")
    if missing:
        miss_names = [names[i] if names and i < len(names) else str(i) for i in missing]
        print(f"\n  Veri olmayan siniflar ({len(missing)}): {miss_names[:10]}{'...' if len(missing)>10 else ''}")


def main():
    parser = argparse.ArgumentParser(description="Merged dataset dogrulama")
    parser.add_argument("--merged-dir", default=str(MERGED_DIR))
    parser.add_argument("--nc",         type=int, default=NC_DEFAULT)
    parser.add_argument("--split",      choices=["train", "val", "test", "all"], default="all")
    args = parser.parse_args()

    merged = Path(args.merged_dir)
    nc     = args.nc

    # data.yaml'dan isim listesini oku
    names = []
    yaml_path = merged / "data.yaml"
    if yaml_path.exists():
        import re
        yaml_text = yaml_path.read_text(encoding="utf-8")
        in_names = False
        for line in yaml_text.splitlines():
            if line.strip().startswith("names:"):
                in_names = True
                continue
            if in_names:
                m = re.match(r"^\s*-\s*(.+)", line)
                if m:
                    names.append(m.group(1).strip())
                elif line.strip() and not line.startswith(" ") and not line.startswith("-"):
                    break

    print(f"Merged dir : {merged}")
    print(f"NC         : {nc}")
    print(f"Sinif ismi : {len(names)} adet okundu")

    splits = ["train", "val", "test"] if args.split == "all" else [args.split]
    all_results = {}

    for split in splits:
        split_dir = merged / split
        if not (split_dir / "images").exists():
            # duz yapi denemesi
            split_dir = merged
            if not (merged / "images" / split).exists():
                print(f"[{split}] dizin bulunamadi, atlaniyor.")
                continue
            r = check_split_flat(merged, split, nc)
        else:
            r = check_split(split_dir, nc, names)

        all_results[split] = r
        print_split_report(split, r, nc, names)

    # Genel ozet
    print("\n" + "="*50)
    print("GENEL OZET")
    total_imgs = sum(r["img"] for r in all_results.values())
    total_anns = sum(r["total_anns"] for r in all_results.values())
    total_errs = sum(
        len(r["only_img"]) + len(r["only_lbl"]) + len(r["bad_class"]) + len(r["bad_bbox"])
        for r in all_results.values()
    )
    print(f"  Toplam gorsel    : {total_imgs}")
    print(f"  Toplam annotation: {total_anns}")
    print(f"  Toplam hata      : {total_errs}")
    if total_errs == 0:
        print("  Sonuc: Dataset temiz.")
    else:
        print("  Sonuc: HATALAR VAR — yukaridaki detaylara bak.")


def check_split_flat(merged: Path, split: str, nc: int):
    """merged/images/split ve merged/labels/split yapisi icin"""
    img_dir = merged / "images" / split
    lbl_dir = merged / "labels" / split

    img_stems = {p.stem for p in img_dir.glob("*") if p.is_file()}
    lbl_stems = {p.stem for p in lbl_dir.glob("*.txt")}

    only_img     = img_stems - lbl_stems
    only_lbl     = lbl_stems - img_stems
    empty        = []
    bad_class    = []
    bad_bbox     = []
    float_ids    = 0
    total_anns   = 0
    class_counts = Counter()

    for lbl_path in sorted(lbl_dir.glob("*.txt")):
        text  = lbl_path.read_text(encoding="utf-8").strip()
        lines = text.splitlines() if text else []

        if not lines:
            empty.append(lbl_path.name)
            continue

        for line in lines:
            parts = line.split()
            if len(parts) != 5:
                bad_bbox.append((lbl_path.name, line))
                continue

            if "." in parts[0]:
                float_ids += 1

            try:
                cid = int(float(parts[0]))
            except ValueError:
                bad_class.append((lbl_path.name, parts[0]))
                continue

            try:
                coords = list(map(float, parts[1:]))
            except ValueError:
                bad_bbox.append((lbl_path.name, line))
                continue

            if cid < 0 or cid >= nc:
                bad_class.append((lbl_path.name, cid))
            else:
                class_counts[cid] += 1

            if any(v < -0.001 or v > 1.001 for v in coords):
                bad_bbox.append((lbl_path.name, coords))

            total_anns += 1

    return {
        "img":          len(img_stems),
        "lbl":          len(lbl_stems),
        "only_img":     only_img,
        "only_lbl":     only_lbl,
        "empty":        empty,
        "bad_class":    bad_class,
        "bad_bbox":     bad_bbox,
        "float_ids":    float_ids,
        "total_anns":   total_anns,
        "class_counts": class_counts,
    }


if __name__ == "__main__":
    main()
