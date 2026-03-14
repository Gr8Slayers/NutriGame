#!/usr/bin/env python3
"""
CAFSD (Central Asian Food Scenes Dataset) ve GGCD kategorilerini
proje hedef sinif listesine (85 sinif) maplar.

Bu script group_remove_categories.py ile ayni pattern'i takip eder.
CAFSD'nin 239 sinifini hedef 85 sinifa maplar. None = at/discard.

Kullanim:
    python map_cafsd_categories.py \
        --input-json path/to/cafsd_coco.json \
        --output-json path/to/cafsd_mapped.json

    # Kategori listesini gormek icin:
    python map_cafsd_categories.py \
        --input-json path/to/cafsd_coco.json \
        --list-categories
"""

import json
import os
import argparse
from pathlib import Path
from collections import Counter


# =============================================================================
# HEDEF KATEGORI LISTESI (85 sinif, kalori hesaplanabilir)
# Projenin nihai sinif listesidir.
# =============================================================================
TARGET_CATEGORIES = [
    {"id": 0,  "name": "Adana_Kebap"},
    {"id": 1,  "name": "Apple"},
    {"id": 2,  "name": "Asparagus"},
    {"id": 3,  "name": "Avocado"},
    {"id": 4,  "name": "Ayran"},
    {"id": 5,  "name": "Bacon"},
    {"id": 6,  "name": "Baklava"},
    {"id": 7,  "name": "Banana"},
    {"id": 8,  "name": "Bell_Pepper"},
    {"id": 9,  "name": "Biber_Dolmasi"},
    {"id": 10, "name": "Black_Olives"},
    {"id": 11, "name": "Blackberry"},
    {"id": 12, "name": "Bread"},
    {"id": 13, "name": "Broccoli"},
    {"id": 14, "name": "Bulgur_Pilavi"},
    {"id": 15, "name": "Burger"},
    {"id": 16, "name": "Cacik"},
    {"id": 17, "name": "Carrot"},
    {"id": 18, "name": "Cheese"},
    {"id": 19, "name": "Chips"},
    {"id": 20, "name": "Cig_Kofte"},
    {"id": 21, "name": "Corn"},
    {"id": 22, "name": "Cucumber"},
    {"id": 23, "name": "Domates_Corbasi"},
    {"id": 24, "name": "Doner_Et"},
    {"id": 25, "name": "Doner_Tavuk"},
    {"id": 26, "name": "Et_Sote"},
    {"id": 27, "name": "Etli_Turlu"},
    {"id": 28, "name": "Ezogelin_Corba"},
    {"id": 29, "name": "Fish"},
    {"id": 30, "name": "Fried_Chicken"},
    {"id": 31, "name": "Fried_Eggs"},
    {"id": 32, "name": "Fried_Meat"},
    {"id": 33, "name": "Grapes"},
    {"id": 34, "name": "Irmik_Tatlisi"},
    {"id": 35, "name": "Iskender_Et"},
    {"id": 36, "name": "Iskender_Tavuk"},
    {"id": 37, "name": "Izmir_Kofte"},
    {"id": 38, "name": "Kabak_Mucver"},
    {"id": 39, "name": "Kabak_Tatlisi"},
    {"id": 40, "name": "Kadinbudu_Kofte"},
    {"id": 41, "name": "Karniyarik"},
    {"id": 42, "name": "Kasarli_Pide"},
    {"id": 43, "name": "Kir_Pidesi"},
    {"id": 44, "name": "Kiymali_Pide"},
    {"id": 45, "name": "Kiwi"},
    {"id": 46, "name": "Kunefe"},
    {"id": 47, "name": "Kusbasli_Pide"},
    {"id": 48, "name": "Lahmacun"},
    {"id": 49, "name": "Lemon"},
    {"id": 50, "name": "Mandarin"},
    {"id": 51, "name": "Melon"},
    {"id": 52, "name": "Menemen"},
    {"id": 53, "name": "Mercimek_Coftesi"},
    {"id": 54, "name": "Mercimek_Corbasi"},
    {"id": 55, "name": "Midye_Dolma"},
    {"id": 56, "name": "Midye_Tava"},
    {"id": 57, "name": "Mumbar_Dolmasi"},
    {"id": 58, "name": "Mushrooms"},
    {"id": 59, "name": "Orange"},
    {"id": 60, "name": "Pasta"},
    {"id": 61, "name": "Patlican_Kebabi"},
    {"id": 62, "name": "Pineapple"},
    {"id": 63, "name": "Pizza"},
    {"id": 64, "name": "Porridge"},
    {"id": 65, "name": "Potatoes"},
    {"id": 66, "name": "Raspberry"},
    {"id": 67, "name": "Rice"},
    {"id": 68, "name": "Salad"},
    {"id": 69, "name": "Sausages"},
    {"id": 70, "name": "Sehriye_Corbasi"},
    {"id": 71, "name": "Spinach"},
    {"id": 72, "name": "Strawberry"},
    {"id": 73, "name": "Sutlac"},
    {"id": 74, "name": "Tantuni_Et"},
    {"id": 75, "name": "Tantuni_Tavuk"},
    {"id": 76, "name": "Tarhana_Corbasi"},
    {"id": 77, "name": "Tea"},
    {"id": 78, "name": "Tomato"},
    {"id": 79, "name": "Watermelon"},
    {"id": 80, "name": "Yayla_Corbasi"},
    {"id": 81, "name": "Zucchini"},
    {"id": 82, "name": "Ankara_Tava"},
    {"id": 83, "name": "Green_Beans"},
    {"id": 84, "name": "Sweet_Potatoes"},
]

TARGET_NAME_TO_ID = {cat["name"]: cat["id"] for cat in TARGET_CATEGORIES}


# =============================================================================
# CAFSD / GGCD KATEGORI HARITALAMASI
# Kaynak: https://huggingface.co/datasets/issai/Central_Asian_Food_Scenes_Dataset
# 239 sinif -> 85 hedef sinif (None = bu sinifi at)
#
# NOT: CAFSD indirilip kategori listesi kontrol edildikten sonra
# bu mapping guncellenmeli. Asagidaki mapping arastirma raporuna dayanmaktadir.
# --list-categories parametresi ile tanimlanmamis kategorileri gorebilirsiniz.
# =============================================================================
CAFSD_NAME_TO_TARGET = {
    # Beverages
    "airan-katyk":              "Ayran",
    "tea":                      "Tea",
    "green tea":                "Tea",
    "black tea":                "Tea",
    "juice":                    None,
    "coffee":                   None,

    # Breads
    "bread":                    "Bread",
    "lavash":                   "Bread",
    "flat bread":               "Bread",
    "pita bread":               "Bread",
    "nan":                      "Bread",
    "naan":                     "Bread",

    # Rice
    "plov":                     "Rice",
    "rice":                     "Rice",
    "rice dish":                "Rice",
    "boiled rice":              "Rice",

    # Meat dishes
    "fried meat":               "Fried_Meat",
    "cooked food based on meat":"Fried_Meat",
    "boiled meat":              "Fried_Meat",
    "grilled meat":             "Adana_Kebap",
    "kebab":                    "Adana_Kebap",
    "shashlik":                 "Adana_Kebap",
    "meat product":             None,
    "meat":                     "Fried_Meat",

    # Chicken
    "fried chicken":            "Fried_Chicken",
    "boiled chicken":           "Fried_Chicken",
    "grilled chicken":          "Fried_Chicken",
    "chicken":                  "Fried_Chicken",

    # Fish
    "fish":                     "Fish",
    "fried fish":               "Fish",
    "smoked fish":              "Fish",
    "boiled fish":              "Fish",

    # Soups
    "soup":                     None,
    "soup-plain":               None,
    "vegetable soup":           "Domates_Corbasi",
    "meat soup":                "Ezogelin_Corba",
    "lentil soup":              "Mercimek_Corbasi",
    "tomato soup":              "Domates_Corbasi",

    # Salads
    "salad fresh":              "Salad",
    "salad leaves":             "Salad",
    "salad with fried meat veggie": "Salad",
    "salad with sauce":         "Salad",
    "salad":                    "Salad",
    "vegetable salad":          "Salad",

    # Eggs
    "fried eggs":               "Fried_Eggs",
    "egg product":              "Fried_Eggs",
    "eggs":                     "Fried_Eggs",
    "boiled eggs":              "Fried_Eggs",
    "scrambled eggs":           "Fried_Eggs",

    # Noodles / Pasta
    "pasta":                    "Pasta",
    "noodles":                  "Pasta",
    "lagman":                   "Pasta",
    "spaghetti":                "Pasta",
    "macaroni":                 "Pasta",

    # Pizza / Burger
    "pizza":                    "Pizza",
    "burger":                   "Burger",
    "hamburger":                "Burger",
    "hot dog":                  "Sausages",

    # Cheese / Dairy
    "cheese":                   "Cheese",
    "cottage cheese":           "Cheese",
    "sour cream":               None,
    "smetana":                  None,
    "suzbe":                    None,
    "dairy":                    None,

    # Sausages
    "sausages":                 "Sausages",
    "sausage":                  "Sausages",
    "frankfurter":              "Sausages",

    # Bacon
    "bacon":                    "Bacon",

    # Porridge
    "porridge":                 "Porridge",
    "oatmeal":                  "Porridge",
    "buckwheat":                "Porridge",
    "semolina porridge":        "Porridge",

    # Potatoes
    "potatoes":                 "Potatoes",
    "fried potatoes":           "Potatoes",
    "boiled potatoes":          "Potatoes",
    "mashed potato":            "Potatoes",
    "mashed potatoes":          "Potatoes",
    "chips":                    "Chips",
    "potato chips":             "Chips",
    "french fries":             "Chips",
    "sweet potatoes":           "Sweet_Potatoes",

    # Vegetables
    "tomato":                   "Tomato",
    "tomatoes":                 "Tomato",
    "cucumber":                 "Cucumber",
    "cucumbers":                "Cucumber",
    "carrot":                   "Carrot",
    "carrots":                  "Carrot",
    "broccoli":                 "Broccoli",
    "spinach":                  "Spinach",
    "mushrooms":                "Mushrooms",
    "mushroom":                 "Mushrooms",
    "bell pepper":              "Bell_Pepper",
    "pepper":                   "Bell_Pepper",
    "corn":                     "Corn",
    "zucchini":                 "Zucchini",
    "courgette":                "Zucchini",
    "eggplant":                 "Patlican_Kebabi",
    "cooked eggplant":          "Patlican_Kebabi",
    "green beans":              "Green_Beans",
    "asparagus":                "Asparagus",
    "avocado":                  "Avocado",
    "cabbage":                  None,
    "cauliflower":              None,
    "beet":                     None,
    "celery":                   None,
    "onion":                    None,
    "garlic":                   None,
    "pumpkin":                  None,
    "squash":                   None,
    "artichoke":                None,
    "arugula":                  None,
    "leek":                     None,
    "radish":                   None,
    "herbs":                    None,

    # Fruits
    "apple":                    "Apple",
    "banana":                   "Banana",
    "orange":                   "Orange",
    "lemon":                    "Lemon",
    "mandarin":                 "Mandarin",
    "tangerine":                "Mandarin",
    "clementine":               "Mandarin",
    "grapes":                   "Grapes",
    "grape":                    "Grapes",
    "watermelon":               "Watermelon",
    "melon":                    "Melon",
    "strawberry":               "Strawberry",
    "strawberries":             "Strawberry",
    "kiwi":                     "Kiwi",
    "pineapple":                "Pineapple",
    "raspberry":                "Raspberry",
    "raspberries":              "Raspberry",
    "blackberry":               "Blackberry",
    "blackberries":             "Blackberry",
    "mango":                    None,
    "pear":                     None,
    "peach":                    None,
    "cherry":                   None,
    "plum":                     None,
    "blueberry":                None,
    "blueberries":              None,
    "mixed berries":            None,
    "fruits":                   None,

    # Nuts
    "almond":                   None,
    "peanut":                   None,
    "walnut":                   None,
    "pecan":                    None,
    "mixed nuts":               None,
    "nuts":                     None,

    # Desserts
    "baklava":                  "Baklava",
    "dessert":                  None,
    "desserts":                 None,
    "cake":                     None,
    "ice cream":                None,
    "ice-cream":                None,
    "cookies":                  None,
    "crepe":                    None,
    "waffles":                  None,
    "cheesecake":               None,
    "pastry":                   None,
    "sweet":                    None,
    "pie":                      None,

    # Casseroles
    "casserole with meat and vegetables": "Etli_Turlu",
    "cooked food meat with vegetables":   "Etli_Turlu",
    "stew":                     "Et_Sote",
    "meat stew":                "Et_Sote",

    # Generic - remove
    "food-yemek":               None,
    "food":                     None,
    "snacks":                   None,
    "snacks bread":             None,
    "cereal based cooked food": None,
    "legumes":                  None,
    "seafood":                  None,
    "vegetable based cooked food": None,
    "pickled cabbage":          None,
    "pickled squash":           None,
    "sauce":                    None,
    "sauces":                   None,
    "souces":                   None,
    "sandwich":                 None,
    "granola":                  None,
    "hummus":                   None,
    "chickpeas":                None,
    "beans":                    None,
    "peas":                     None,
    "soy product":              None,
    "tushpara-wo-soup":         None,
    "irimshik":                 None,
    "tomato sauce":             None,
    "tomato souce":             None,
}


def apply_mapping(input_json_path, output_json_path, source_name="CAFSD"):
    """
    Verilen COCO JSON dosyasina CAFSD kategori mapping'ini uygular.

    Args:
        input_json_path: Kaynak COCO JSON (CAFSD/GGCD formatinda)
        output_json_path: Cikti COCO JSON (hedef kategorilerle)
        source_name: Log icin kaynak ismi
    """
    print(f"\n{source_name} mapping uygulanıyor...")
    print(f"  Kaynak: {input_json_path}")

    with open(input_json_path, 'r', encoding='utf-8') as f:
        coco_data = json.load(f)

    source_categories = {cat['id']: cat['name'].lower().strip()
                         for cat in coco_data['categories']}

    # Kaynak kategori ID -> Hedef ID mapping'i olustur
    source_id_to_target_id = {}
    mapped_count = 0

    for src_id, src_name in source_categories.items():
        target_name = CAFSD_NAME_TO_TARGET.get(src_name)
        if target_name is not None:
            target_id = TARGET_NAME_TO_ID.get(target_name)
            if target_id is not None:
                source_id_to_target_id[src_id] = target_id
                mapped_count += 1
            else:
                print(f"  WARNING: Hedef sinif bulunamadi: '{target_name}' (kaynak: '{src_name}')")

    print(f"  Maplanan sinif: {mapped_count}/{len(source_categories)}")
    print(f"  Atilan sinif: {len(source_categories) - mapped_count}")

    # Annotation'lari filtrele ve yeniden mapla
    new_annotations = []
    valid_image_ids = set()
    skipped = 0

    for ann in coco_data['annotations']:
        old_cat_id = ann['category_id']
        new_cat_id = source_id_to_target_id.get(old_cat_id)

        if new_cat_id is not None:
            new_ann = ann.copy()
            new_ann['category_id'] = new_cat_id
            new_annotations.append(new_ann)
            valid_image_ids.add(ann['image_id'])
        else:
            skipped += 1

    new_images = [img for img in coco_data['images']
                  if img['id'] in valid_image_ids]

    for i, ann in enumerate(new_annotations):
        ann['id'] = i + 1

    new_coco = {
        "info": coco_data.get('info', {"description": f"Mapped from {source_name}"}),
        "licenses": coco_data.get('licenses', []),
        "images": new_images,
        "annotations": new_annotations,
        "categories": TARGET_CATEGORIES
    }

    output_path = Path(output_json_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(new_coco, f, indent=2, ensure_ascii=False)

    print(f"  {len(new_images)} gorsel, {len(new_annotations)} annotation korundu")
    print(f"  {skipped} annotation atildi")
    print(f"  Kaydedildi: {output_json_path}")

    id_to_name = {cat['id']: cat['name'] for cat in TARGET_CATEGORIES}
    dist = Counter(ann['category_id'] for ann in new_annotations)
    print(f"\n  Top 10 sinif (annotation sayisina gore):")
    for cat_id, count in dist.most_common(10):
        print(f"    [{cat_id}] {id_to_name.get(cat_id, '?')}: {count}")

    return new_coco


def print_unmapped_categories(input_json_path):
    """Mapping'de karsiligi olmayan kategorileri listele (kesif icin)."""
    with open(input_json_path, 'r', encoding='utf-8') as f:
        coco_data = json.load(f)

    print("\nDataset kategorileri ve mapping durumu:")
    print(f"{'ID':>4}  {'Kategori Adi':<40}  {'Hedef'}")
    print("-" * 70)

    for cat in sorted(coco_data['categories'], key=lambda x: x['name']):
        src_name = cat['name'].lower().strip()
        if src_name in CAFSD_NAME_TO_TARGET:
            target = CAFSD_NAME_TO_TARGET[src_name]
            status = f"-> {target}" if target else "ATILACAK"
        else:
            status = "TANIMLANMAMIS - mapping'e ekle"
        print(f"{cat['id']:>4}  {cat['name']:<40}  {status}")


def main():
    parser = argparse.ArgumentParser(
        description='CAFSD/GGCD kategorilerini hedef 85 sinifa mapla'
    )
    parser.add_argument('--input-json', required=True,
                        help='Kaynak CAFSD/GGCD COCO JSON dosyasi')
    parser.add_argument('--output-json', default=None,
                        help='Cikti COCO JSON dosyasi (hedef kategorilerle)')
    parser.add_argument('--source-name', default='CAFSD',
                        help='Kaynak dataset ismi (log icin)')
    parser.add_argument('--list-categories', action='store_true',
                        help='Dataset kategorilerini ve mapping durumunu listele')

    args = parser.parse_args()

    if args.list_categories:
        print_unmapped_categories(args.input_json)
    else:
        if not args.output_json:
            print("--output-json parametresi gereklidir.")
            return
        apply_mapping(args.input_json, args.output_json, args.source_name)


if __name__ == "__main__":
    main()
