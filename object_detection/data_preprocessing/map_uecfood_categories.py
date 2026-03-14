#!/usr/bin/env python3
"""
UECFOOD-256 kategorilerini proje hedef sinif listesine (85 sinif) maplar.

UECFOOD-256 formatinda her yemek sinifi icin ayri bir klasor vardir.
Bu script o formatı COCO JSON'a cevirip category mapping'i uygular.

Kaynak format:
    uecfood256/
        category.txt        (id<TAB>name formati)
        1/                  (sinif 1: rice)
            bb_info.txt     (bounding box bilgileri)
            image.jpg
        2/                  (sinif 2: eels on rice)
        ...

Kullanim:
    python map_uecfood_categories.py \
        --uecfood-dir path/to/uecfood256 \
        --output-json path/to/uecfood_mapped.json \
        --images-output-dir path/to/uecfood_images

    # Kategori listesini gormek icin:
    python map_uecfood_categories.py \
        --uecfood-dir path/to/uecfood256 \
        --list-categories
"""

import json
import os
import shutil
import argparse
from pathlib import Path
from PIL import Image
from collections import Counter

# Hedef kategori listesini map_cafsd_categories.py'den import et
try:
    from map_cafsd_categories import TARGET_CATEGORIES, TARGET_NAME_TO_ID
except ImportError:
    # Standalone calistirma icin inline tanimla
    from map_cafsd_categories import TARGET_CATEGORIES, TARGET_NAME_TO_ID


# =============================================================================
# UECFOOD-256 KATEGORI HARITALAMASI
# Kaynak: http://foodcam.mobi/dataset256.html
# 256 Japonya/uluslararasi yemek sinifi -> 85 hedef sinif
# None = bu sinifi at
#
# UECFOOD agirlikli olarak Japon mutfagi icermektedir.
# Sadece hedef siniflarimizla uyumlu olanlar maplaniyor.
# =============================================================================
UECFOOD_NAME_TO_TARGET = {
    # Rice dishes
    "rice":                         "Rice",
    "fried rice":                   "Rice",
    "pilaf":                        "Rice",
    "rice ball":                    "Rice",
    "rice with egg":                "Rice",
    "mixed rice":                   "Rice",
    "takikomi gohan":               "Rice",
    "chazuke":                      None,       # Japanese tea-over-rice, too specific

    # Noodles / Pasta
    "spaghetti":                    "Pasta",
    "pasta":                        "Pasta",
    "udon noodle":                  "Pasta",
    "soba noodle":                  "Pasta",
    "ramen noodle":                 "Pasta",
    "cold noodle":                  "Pasta",
    "yakisoba":                     "Pasta",
    "hiyashi chuka":                "Pasta",

    # Bread / Sandwiches
    "bread":                        "Bread",
    "toast":                        "Bread",
    "french toast":                 "Bread",
    "croissant":                    "Bread",
    "hot dog":                      "Sausages",
    "sandwich":                     None,       # Too generic

    # Chicken
    "fried chicken":                "Fried_Chicken",
    "chicken":                      "Fried_Chicken",
    "grilled chicken":              "Fried_Chicken",
    "chicken cutlet":               "Fried_Chicken",
    "chicken wing":                 "Fried_Chicken",
    "chicken nugget":               "Fried_Chicken",
    "chicken soup":                 None,
    "chicken teriyaki":             "Fried_Chicken",
    "karaage":                      "Fried_Chicken",   # Japanese fried chicken

    # Beef / Meat
    "beef":                         "Fried_Meat",
    "beef curry":                   "Fried_Meat",
    "beef stew":                    "Et_Sote",
    "beef bowl":                    "Fried_Meat",
    "grilled beef":                 "Adana_Kebap",
    "roast beef":                   "Fried_Meat",
    "minced meat":                  "Fried_Meat",
    "meat sauce":                   None,
    "hamburger steak":              "Burger",
    "hamburg":                      "Burger",
    "meatball":                     "Izmir_Kofte",

    # Pork
    "pork":                         "Fried_Meat",
    "pork cutlet":                  "Fried_Meat",
    "tonkatsu":                     "Fried_Meat",
    "yakitori":                     "Adana_Kebap",
    "pork stir fry":                "Et_Sote",
    "grilled pork":                 "Adana_Kebap",

    # Fish / Seafood
    "fish":                         "Fish",
    "grilled fish":                 "Fish",
    "fried fish":                   "Fish",
    "sashimi":                      "Fish",
    "sushi":                        None,       # Too specific, not in scope
    "salmon":                       "Fish",
    "tuna":                         "Fish",
    "mackerel":                     "Fish",
    "sardine":                      "Fish",

    # Eggs
    "fried egg":                    "Fried_Eggs",
    "egg":                          "Fried_Eggs",
    "egg roll":                     "Fried_Eggs",
    "tamagoyaki":                   "Fried_Eggs",
    "boiled egg":                   "Fried_Eggs",
    "scrambled egg":                "Fried_Eggs",
    "omelette":                     "Fried_Eggs",
    "omelet":                       "Fried_Eggs",

    # Pizza / Burger / Fast food
    "pizza":                        "Pizza",
    "burger":                       "Burger",
    "hamburger":                    "Burger",
    "french fries":                 "Chips",
    "potato chips":                 "Chips",
    "chips":                        "Chips",

    # Sausages
    "sausage":                      "Sausages",
    "sausages":                     "Sausages",
    "frankfurter":                  "Sausages",
    "wiener":                       "Sausages",

    # Cheese
    "cheese":                       "Cheese",

    # Bacon
    "bacon":                        "Bacon",

    # Salad
    "salad":                        "Salad",
    "green salad":                  "Salad",
    "mixed salad":                  "Salad",
    "caesar salad":                 "Salad",
    "coleslaw":                     "Salad",

    # Soup
    "miso soup":                    None,       # Japanese specific
    "soup":                         None,       # Too generic
    "corn soup":                    "Domates_Corbasi",
    "tomato soup":                  "Domates_Corbasi",
    "mushroom soup":                None,

    # Vegetables
    "tomato":                       "Tomato",
    "cucumber":                     "Cucumber",
    "carrot":                       "Carrot",
    "broccoli":                     "Broccoli",
    "spinach":                      "Spinach",
    "mushroom":                     "Mushrooms",
    "mushrooms":                    "Mushrooms",
    "corn":                         "Corn",
    "green bean":                   "Green_Beans",
    "green beans":                  "Green_Beans",
    "asparagus":                    "Asparagus",
    "avocado":                      "Avocado",
    "bell pepper":                  "Bell_Pepper",
    "zucchini":                     "Zucchini",
    "eggplant":                     "Patlican_Kebabi",
    "edamame":                      None,
    "bamboo shoot":                 None,
    "burdock":                      None,
    "lotus root":                   None,
    "tofu":                         None,
    "natto":                        None,
    "seaweed":                      None,
    "daikon":                       None,
    "ginger":                       None,

    # Potatoes
    "potato":                       "Potatoes",
    "potatoes":                     "Potatoes",
    "mashed potato":                "Potatoes",
    "sweet potato":                 "Sweet_Potatoes",
    "sweet potatoes":               "Sweet_Potatoes",

    # Fruits
    "apple":                        "Apple",
    "banana":                       "Banana",
    "orange":                       "Orange",
    "lemon":                        "Lemon",
    "mandarin":                     "Mandarin",
    "grapes":                       "Grapes",
    "watermelon":                   "Watermelon",
    "melon":                        "Melon",
    "strawberry":                   "Strawberry",
    "kiwi":                         "Kiwi",
    "pineapple":                    "Pineapple",
    "raspberry":                    "Raspberry",
    "blackberry":                   "Blackberry",
    "pear":                         None,
    "peach":                        None,

    # Desserts
    "cake":                         None,
    "ice cream":                    None,
    "pudding":                      None,
    "donut":                        None,
    "waffle":                       None,
    "pancake":                      None,
    "crepe":                        None,

    # Porridge
    "porridge":                     "Porridge",
    "oatmeal":                      "Porridge",

    # Curry (common in UECFOOD)
    "curry":                        "Fried_Meat",
    "curry rice":                   "Rice",

    # Remove - too Japanese specific
    "tempura":                      None,
    "takoyaki":                     None,
    "okonomiyaki":                  None,
    "gyoza":                        None,
    "spring roll":                  None,
    "dim sum":                      None,
    "onigiri":                      None,
    "bento":                        None,
    "donburi":                      None,
    "sukiyaki":                     None,
    "shabu shabu":                  None,
    "hot pot":                      None,
    "kimchi":                       None,
    "bibimbap":                     None,
}


def read_uecfood_categories(uecfood_dir):
    """
    UECFOOD category.txt dosyasini oku.
    Format: id<TAB>name (her satir)

    Returns:
        dict: {id: name}
    """
    category_file = Path(uecfood_dir) / "category.txt"
    if not category_file.exists():
        # Bazi versiyonlarda farkli isim olabilir
        alt_paths = [
            Path(uecfood_dir) / "categories.txt",
            Path(uecfood_dir) / "UECFOOD256_category.txt",
        ]
        for alt in alt_paths:
            if alt.exists():
                category_file = alt
                break
        else:
            raise FileNotFoundError(
                f"category.txt bulunamadi: {uecfood_dir}\n"
                "Beklenen format: her satir 'id<TAB>name'"
            )

    categories = {}
    with open(category_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split('\t')
            if len(parts) >= 2:
                cat_id = int(parts[0])
                cat_name = parts[1].strip().lower()
                categories[cat_id] = cat_name
            elif len(parts) == 1 and line.isdigit():
                continue

    print(f"  {len(categories)} UECFOOD kategorisi okundu.")
    return categories


def read_bb_info(bb_info_path, image_id, category_id, image_width, image_height):
    """
    UECFOOD bb_info.txt dosyasini oku ve COCO formatinda annotation'lar dondur.
    Format: img_name x1 y1 x2 y2
    """
    annotations = []
    ann_id_counter = [0]  # mutable reference

    if not Path(bb_info_path).exists():
        return annotations

    with open(bb_info_path, 'r') as f:
        lines = f.readlines()

    # Ilk satir header olabilir
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split()
        if len(parts) < 5:
            continue

        try:
            x1, y1, x2, y2 = int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4])
        except ValueError:
            continue

        # Gecerlilik kontrolu
        if x2 <= x1 or y2 <= y1:
            continue

        w = x2 - x1
        h = y2 - y1
        area = w * h

        ann = {
            "id": 0,  # sonradan atanacak
            "image_id": image_id,
            "category_id": category_id,
            "bbox": [float(x1), float(y1), float(w), float(h)],
            "area": float(area),
            "segmentation": [],
            "iscrowd": 0
        }
        annotations.append(ann)

    return annotations


def convert_uecfood_to_coco(uecfood_dir, output_json_path, images_output_dir=None):
    """
    UECFOOD-256 formatini COCO JSON'a cevirir ve hedef mapping'i uygular.

    Args:
        uecfood_dir: UECFOOD-256 kök dizini (category.txt + sayisal klasorler)
        output_json_path: Cikti COCO JSON yolu
        images_output_dir: Gorselleri kopyalanacak dizin (None = kopyalama)
    """
    print(f"\nUECFOOD-256 donusturme basliyor...")
    print(f"  Kaynak: {uecfood_dir}")

    uecfood_path = Path(uecfood_dir)

    # Kategorileri oku
    uecfood_categories = read_uecfood_categories(uecfood_dir)

    # Mapping olustur
    cat_id_to_target_id = {}
    mapped_count = 0

    for uec_id, uec_name in uecfood_categories.items():
        target_name = UECFOOD_NAME_TO_TARGET.get(uec_name)
        if target_name is not None:
            target_id = TARGET_NAME_TO_ID.get(target_name)
            if target_id is not None:
                cat_id_to_target_id[uec_id] = target_id
                mapped_count += 1

    print(f"  Maplanan sinif: {mapped_count}/{len(uecfood_categories)}")

    if images_output_dir:
        Path(images_output_dir).mkdir(parents=True, exist_ok=True)

    coco_images = []
    coco_annotations = []
    image_id = 0
    annotation_id = 0
    skipped_categories = 0

    # Her sinif klasorunu isle
    for uec_cat_id, uec_cat_name in uecfood_categories.items():
        target_id = cat_id_to_target_id.get(uec_cat_id)
        if target_id is None:
            skipped_categories += 1
            continue

        class_dir = uecfood_path / str(uec_cat_id)
        if not class_dir.exists():
            continue

        bb_info_file = class_dir / "bb_info.txt"
        if not bb_info_file.exists():
            continue

        # bb_info.txt dosyasindan gorsel-bbox ciftlerini oku
        with open(bb_info_file, 'r') as f:
            lines = f.readlines()

        # Gorsel bazli bbox'lari topla
        image_bboxes = {}
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split()
            if len(parts) < 5:
                continue
            try:
                img_name = parts[0]
                x1, y1, x2, y2 = int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4])
                if img_name not in image_bboxes:
                    image_bboxes[img_name] = []
                if x2 > x1 and y2 > y1:
                    image_bboxes[img_name].append([x1, y1, x2 - x1, y2 - y1])
            except (ValueError, IndexError):
                continue

        # Her gorsel icin kayit olustur
        for img_filename, bboxes in image_bboxes.items():
            img_path = class_dir / img_filename
            if not img_path.exists():
                # .jpg uzantisi olmayabilir
                for ext in ['.jpg', '.jpeg', '.png']:
                    candidate = class_dir / (img_filename + ext)
                    if candidate.exists():
                        img_path = candidate
                        img_filename = img_path.name
                        break
                else:
                    continue

            # Gorsel boyutu
            try:
                with Image.open(img_path) as img:
                    img_width, img_height = img.size
            except Exception:
                continue

            # Benzersiz dosya adi olustur (class_id prefix ile)
            unique_name = f"uec_{uec_cat_id}_{img_filename}"

            image_record = {
                "id": image_id,
                "file_name": unique_name,
                "width": img_width,
                "height": img_height
            }
            coco_images.append(image_record)

            for bbox in bboxes:
                ann = {
                    "id": annotation_id,
                    "image_id": image_id,
                    "category_id": target_id,
                    "bbox": [float(b) for b in bbox],
                    "area": float(bbox[2] * bbox[3]),
                    "segmentation": [],
                    "iscrowd": 0
                }
                coco_annotations.append(ann)
                annotation_id += 1

            # Gorseli kopyala
            if images_output_dir:
                dst = Path(images_output_dir) / unique_name
                if not dst.exists():
                    shutil.copy2(img_path, dst)

            image_id += 1

    coco_output = {
        "info": {"description": "Converted from UECFOOD-256"},
        "licenses": [],
        "images": coco_images,
        "annotations": coco_annotations,
        "categories": TARGET_CATEGORIES
    }

    output_path = Path(output_json_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(coco_output, f, indent=2, ensure_ascii=False)

    print(f"  {len(coco_images)} gorsel, {len(coco_annotations)} annotation islendi")
    print(f"  {skipped_categories} sinif atildi (mapping yok)")
    print(f"  Kaydedildi: {output_json_path}")

    id_to_name = {cat['id']: cat['name'] for cat in TARGET_CATEGORIES}
    dist = Counter(ann['category_id'] for ann in coco_annotations)
    print(f"\n  Top 10 sinif:")
    for cat_id, count in dist.most_common(10):
        print(f"    [{cat_id}] {id_to_name.get(cat_id, '?')}: {count}")

    return coco_output


def print_category_mapping(uecfood_dir):
    """UECFOOD kategorilerini ve mapping durumlarini listele."""
    uecfood_categories = read_uecfood_categories(uecfood_dir)

    print(f"\nUECFOOD-256 kategorileri ve mapping durumu:")
    print(f"{'ID':>4}  {'Kategori Adi':<35}  {'Hedef'}")
    print("-" * 65)

    for uec_id in sorted(uecfood_categories.keys()):
        uec_name = uecfood_categories[uec_id]
        if uec_name in UECFOOD_NAME_TO_TARGET:
            target = UECFOOD_NAME_TO_TARGET[uec_name]
            status = f"-> {target}" if target else "ATILACAK"
        else:
            status = "TANIMLANMAMIS"
        print(f"{uec_id:>4}  {uec_name:<35}  {status}")


def main():
    parser = argparse.ArgumentParser(
        description='UECFOOD-256 kategorilerini hedef 85 sinifa mapla ve COCO JSON uret'
    )
    parser.add_argument('--uecfood-dir', required=True,
                        help='UECFOOD-256 kok dizini (category.txt ve sinif klasorleri)')
    parser.add_argument('--output-json', default=None,
                        help='Cikti COCO JSON dosyasi')
    parser.add_argument('--images-output-dir', default=None,
                        help='Gorsellerin kopyalanacagi dizin (opsiyonel)')
    parser.add_argument('--list-categories', action='store_true',
                        help='Kategorileri ve mapping durumunu listele')

    args = parser.parse_args()

    if args.list_categories:
        print_category_mapping(args.uecfood_dir)
    else:
        if not args.output_json:
            print("--output-json parametresi gereklidir.")
            return
        convert_uecfood_to_coco(
            uecfood_dir=args.uecfood_dir,
            output_json_path=args.output_json,
            images_output_dir=args.images_output_dir
        )


if __name__ == "__main__":
    main()
