"""
GFSD (Global Food Scene Dataset) kategori eslesme ve donusum scripti.

GFSD: 241 kategori, 27303 train gorsel, 81056 annotation (COCO format)
Kaynak: raw_datasets/GFSD/annotations/instances_{train,val,test}.json

Eleme kurallari (None):
  VAGUE     : cok genis kapsam, kalori hesaplanamaz
  CONDIMENT : sos, baharat, yag, tatlandirici
  BEVERAGE  : icecekler (tea haric)
  HERB      : ot/baharat garniturleri
  INGREDIENT: tek basina yenmeyen malzeme
  REGIONAL  : proje kapsami disinda, yeterli verisi yok
  LOW_DATA  : 80 annotation altinda, model ogrenemiyor
  SUBCAT    : baska sinifin muglak alt dali

Kullanim:
    python gfsd_category_adjustment.py              # simule et
    python gfsd_category_adjustment.py --apply      # JSON'lari yaz
    python gfsd_category_adjustment.py --apply --output-dir D:/cikti
"""

import json
import argparse
from pathlib import Path
from collections import Counter


DATASET_DIR = Path("D:/Desktop/Bitirme/NutriGame/object_detection/raw_datasets/GFSD")
ANN_DIR     = DATASET_DIR / "annotations"
SPLITS      = ["train", "val", "test"]

# -------------------------------------------------------------------
# Genisletilmis hedef sinif sistemi (90 + 25 yeni = 115 sinif)
# data.yaml ile senkronize tutulmali.
# -------------------------------------------------------------------
TARGET_NAME_TO_ID = {
    "Adana_Kebap": 0,  "Almond": 1,       "Ankara_Tava": 2,  "Apple": 3,
    "Asparagus": 4,    "Avocado": 5,       "Ayran": 6,        "Bacon": 7,
    "Baklava": 8,      "Banana": 9,        "Beans": 10,       "Bell_Pepper": 11,
    "Biber_Dolmasi": 12, "Black_Olives": 13, "Blackberry": 14, "Bread": 15,
    "Broccoli": 16,    "Bulgur_Pilavi": 17, "Burger": 18,     "Cabbage": 19,
    "Cacik": 20,       "Carrot": 21,       "Cauliflower": 22, "Cheese": 23,
    "Cheesecake": 24,  "Chips": 25,        "Cig_Kofte": 26,   "Corn": 27,
    "Cucumber": 28,    "Doner_Et": 29,     "Doner_Tavuk": 30, "Domates_Corbasi": 31,
    "Et_Sote": 32,     "Etli_Turlu": 33,   "Ezogelin_Corba": 34, "Fish": 35,
    "Fried_Chicken": 36, "Fried_Eggs": 37, "Fried_Meat": 38, "Grapes": 39,
    "Green_Beans": 40, "Irmik_Tatlisi": 41, "Iskender_Et": 42, "Iskender_Tavuk": 43,
    "Spinach": 44,     "Izmir_Kofte": 45,  "Kabak_Mucver": 46, "Kabak_Tatlisi": 47,
    "Kadinbudu_Kofte": 48, "Kasarli_Pide": 49, "Kir_Pidesi": 50, "Kiwi": 51,
    "Kiymali_Pide": 52, "Kunefe": 53,      "Kusbasli_Pide": 54, "Lahmacun": 55,
    "Lemon": 56,       "Mandarin": 57,     "Melon": 58,       "Menemen": 59,
    "Mercimek_Coftesi": 60, "Mercimek_Corbasi": 61, "Midye_Dolma": 62, "Midye_Tava": 63,
    "Mumbar_Dolmasi": 64, "Mushrooms": 65, "Orange": 66,      "Pasta": 67,
    "Patlican_Kebabi": 68, "Pineapple": 69, "Pizza": 70,      "Porridge": 71,
    "Potatoes": 72,    "Raspberry": 73,    "Rice": 74,        "Salad": 75,
    "Sausages": 76,    "Sehriye_Corbasi": 77, "Strawberry": 78, "Suffle": 79,
    "Sutlac": 80,      "Sweet_Potatoes": 81, "Tantuni_Et": 82, "Tantuni_Tavuk": 83,
    "Tarhana_Corbasi": 84, "Tea": 85,      "Tomato": 86,      "Watermelon": 87,
    "Yayla_Corbasi": 88, "Zucchini": 89,
    "Apple_Pie": 90,   "Blueberry": 91,    "Boiled_Eggs": 92, "Borek": 93,
    "Brownie": 94,     "Cheburek": 95,     "Chocolate": 96,   "Churro": 97,
    "Cookies": 98,     "Cream_Puff": 99,   "Crepe": 100,      "Croissant": 101,
    "Doughnut": 102,   "Gozleme": 103,     "Grilled_Eggplant": 104, "Ice_Cream": 105,
    "Mashed_Potato": 106, "Muffin": 107,   "Pancakes": 108,   "Popcorn": 109,
    "Samsa": 110,      "Scrambled_Egg": 111, "Simit": 112,    "Tiramisu": 113,
    "Waffle": 114,
}

# -------------------------------------------------------------------
# GFSD kaynak kategori adi (kucuk harf)  ->  hedef sinif adi
# -------------------------------------------------------------------
GFSD_TO_TARGET = {
    # --- Meyveler ---
    "apple":            "Apple",
    "apricot":          None,       # hedefte yok
    "avocado":          "Avocado",
    "banana":           "Banana",
    "blackberry":       "Blackberry",
    "blueberry":        "Blueberry",      # 431 ann - EKLE
    "cherry":           None,             # hedefte yok
    "dates":            None,             # hedefte yok
    "dragon fruit":     None,             # hedefte yok
    "dried fruits":     None,             # VAGUE
    "figs":             None,             # hedefte yok
    "grapefruit":       None,             # hedefte yok
    "grapes":           "Grapes",
    "kiwi":             "Kiwi",
    "lemon":            "Lemon",
    "lime":             "Lemon",
    "mango":            None,             # hedefte yok
    "melon":            "Melon",
    "mixed berries":    None,             # VAGUE
    "orange":           "Orange",
    "peach":            None,             # hedefte yok
    "pear":             None,             # hedefte yok
    "persimmon":        None,             # hedefte yok
    "pineapple":        "Pineapple",
    "plum":             None,             # hedefte yok
    "pomegranate":      None,             # hedefte yok
    "quince":           None,             # hedefte yok
    "raspberry":        "Raspberry",
    "redcurrant":       None,             # hedefte yok
    "strawberry":       "Strawberry",
    "watermelon":       "Watermelon",
    "mandarin":         "Mandarin",

    # --- Sebzeler ---
    "artichoke":        None,             # LOW_DATA (55 ann)
    "arugula":          None,             # SUBCAT - salata turu
    "asparagus":        "Asparagus",
    "beet":             None,             # hedefte yok
    "bell pepper":      "Bell_Pepper",
    "broccoli":         "Broccoli",
    "cabbage":          "Cabbage",
    "carrot":           "Carrot",
    "cauliflower":      "Cauliflower",
    "celery":           None,             # INGREDIENT
    "chili pepper":     None,             # INGREDIENT/CONDIMENT
    "cooked eggplant":  "Grilled_Eggplant",  # 120 ann - patlican pismis hali
    "cooked tomatoes":  "Tomato",
    "cooked zucchini":  "Zucchini",
    "corn":             "Corn",
    "cucumber":         "Cucumber",
    "eggplant":         None,             # ham sebze, Patlican_Kebabi != ham patlican
    "garlic":           None,             # INGREDIENT
    "green beans":      "Green_Beans",
    "green olives":     "Black_Olives",
    "black olives":     "Black_Olives",
    "mushrooms":        "Mushrooms",
    "okra":             None,             # hedefte yok
    "onion":            None,             # INGREDIENT
    "peas":             None,             # hedefte yok
    "pickled cabbage":  None,             # SUBCAT - islenmis
    "pickled cucumber": None,             # SUBCAT - islenmis
    "pickled ginger":   None,             # INGREDIENT
    "pickled squash":   None,             # SUBCAT
    "pumpkin":          None,             # hedefte yok
    "radish":           None,             # hedefte yok
    "scallion":         None,             # INGREDIENT
    "spinach":          "Spinach",
    "sweet potatoes":   "Sweet_Potatoes",
    "tomato":           "Tomato",
    "zucchini":         "Zucchini",
    "mashed potato":    "Mashed_Potato",  # 125 ann - farkli gorselden kalorisi farkli

    # --- Ekmek / Hamur ---
    "bauyrsak":         "Bread",          # Kazak kizarmis hamur
    "bread":            "Bread",
    "crepe":            "Crepe",          # 152 ann - ince pankek
    "crepe w filling":  "Crepe",          # doldurulmus crepe de ayni sinif
    "croissant":        "Croissant",      # 114 ann - hilal sekilli
    "croissant sandwich": "Croissant",    # ayni gorsel sinif
    "hachapuri":        "Bread",          # Guvec peynirli ekmek
    "kattama-nan":      "Bread",
    "lavash":           "Bread",
    "pancakes":         "Pancakes",       # 127 ann
    "shelpek":          "Bread",
    "snacks bread":     None,             # VAGUE
    "taba-nan":         "Bread",
    "waffles":          "Waffle",         # 105 ann

    # --- Pirinc / Bulgur ---
    "buckwheat":        None,             # hedefte tam karsiligi yok
    "plov":             "Rice",
    "rice":             "Rice",
    "porridge":         "Porridge",

    # --- Makarna ---
    "lagman-fried":     "Pasta",
    "lagman-w-soup":    "Pasta",
    "noodles soup":     "Pasta",
    "pasta":            "Pasta",
    "manty":            "Pasta",

    # --- Et ---
    "beef shashlyk":    "Fried_Meat",
    "beef shashlyk-v":  "Fried_Meat",
    "boiled chicken":   None,             # SUBCAT - haslama farkli kalori profili ama gorselde zor ayirt edilir
    "boiled meat":      None,             # VAGUE
    "brizol":           "Fried_Meat",
    "casserole with meat and vegetables": None,  # VAGUE
    "chicken shashlyk": "Fried_Chicken",
    "chicken shashlyk-v": "Fried_Chicken",
    "cooked food based on meat": None,    # VAGUE
    "cooked food meat with vegetables":   None,  # VAGUE
    "cutlet":           "Fried_Meat",
    "doner-lavash":     "Doner_Et",
    "doner-nan":        "Doner_Et",
    "fried chicken":    "Fried_Chicken",
    "fried meat":       "Fried_Meat",
    "kuyrdak":          None,             # REGIONAL
    "meat based soup":  None,             # VAGUE
    "meat product":     None,             # VAGUE
    "minced meat shashlyk": "Adana_Kebap",
    "ribs":             "Fried_Meat",
    "sheep-head":       None,             # REGIONAL
    "wings":            "Fried_Chicken",

    # --- Balik ---
    "fish":             "Fish",
    "fried fish":       "Fish",
    "smoked fish":      "Fish",

    # --- Yumurta ---
    "boiled eggs":      "Boiled_Eggs",    # 541 ann - haslama yumurta, fried_eggs'ten farkli
    "egg product":      None,             # VAGUE
    "fried eggs":       "Fried_Eggs",

    # --- Bakliyat ---
    "beans":            "Beans",
    "bean soup":        "Mercimek_Corbasi",
    "chickpeas":        "Beans",
    "legumes":          None,             # VAGUE
    "peanut":           "Almond",
    "cashew":           "Almond",
    "hazelnut":         "Almond",
    "pecan":            "Almond",
    "pistachio":        "Almond",
    "walnut":           "Almond",
    "mixed nuts":       None,             # VAGUE
    "chestnuts":        None,             # LOW_DATA (50 ann)

    # --- Salata ---
    "achichuk":         "Salad",
    "olivie":           "Salad",
    "salad fresh":      "Salad",
    "salad leaves":     "Salad",
    "salad with fried meat veggie": "Salad",
    "salad with sauce": "Salad",
    "tomato-cucumber-salad": "Salad",

    # --- Corba ---
    "borsch":           None,             # REGIONAL
    "okroshka":         None,             # REGIONAL
    "seafood soup":     None,             # VAGUE
    "shorpa":           None,             # REGIONAL
    "shorpa chicken":   None,             # REGIONAL
    "soup-plain":       None,             # VAGUE

    # --- Tatli / Pastane ---
    "baklava":          "Baklava",
    "cakes":            None,             # VAGUE (cak-chak, torta, kek hepsi dahil)
    "chak-chak":        None,             # REGIONAL - tatar tatlisi
    "chocolate":        "Chocolate",      # 120 ann - tanim net (cikolata tablet/parce)
    "chocolate paste":  None,             # CONDIMENT
    "cinnabons":        None,             # LOW_DATA
    "cookies":          "Cookies",        # 225 ann
    "cream puff":       None,             # GFSD'de yok, UECFOOD'da var
    "desserts":         None,             # VAGUE
    "granola":          None,             # hedefte yok
    "honey":            None,             # CONDIMENT
    "hvorost":          None,             # REGIONAL
    "ice-cream":        "Ice_Cream",      # 130 ann
    "jam":              None,             # CONDIMENT
    "muffin":           "Muffin",         # 111 ann
    "pastry":           None,             # VAGUE
    "pie":              None,             # VAGUE (farkli cesit - apple pie ayri)
    "sweets":           None,             # VAGUE
    "talkan-zhent":     None,             # REGIONAL

    # --- Orta Asya Ozgul ---
    "asip":             None,             # REGIONAL
    "beshbarmak":       None,             # REGIONAL
    "cheburek":         "Cheburek",       # 314 ann - yarim ay kizarmis hamur, kalori hesaplanabilir
    "hinkali":          None,             # REGIONAL
    "karta":            None,             # REGIONAL
    "kazy-karta":       None,             # REGIONAL
    "naryn":            None,             # REGIONAL
    "nauryz-kozhe":     None,             # REGIONAL
    "orama":            None,             # REGIONAL
    "samsa":            "Samsa",          # 606 ann - ucgen hamur borek, kalori hesaplanabilir
    "syrniki":          None,             # REGIONAL
    "tushpara-fried":   None,             # REGIONAL
    "tushpara-w-soup":  None,             # REGIONAL
    "tushpara-wo-soup": None,             # REGIONAL
    "vareniki":         None,             # REGIONAL

    # --- Sos / Baharat / Herb ---
    "basil":            None,             # HERB
    "butter":           None,             # CONDIMENT
    "caviar":           None,             # CONDIMENT
    "cheese souce":     None,             # CONDIMENT
    "condensed milk":   None,             # CONDIMENT
    "dill":             None,             # HERB
    "herbs":            None,             # VAGUE/HERB
    "ketchup":          None,             # CONDIMENT
    "mayonnaise":       None,             # CONDIMENT
    "mint":             None,             # HERB
    "oil":              None,             # CONDIMENT
    "parsley":          None,             # HERB
    "rosemary":         None,             # HERB
    "smetana":          None,             # CONDIMENT
    "souces":           None,             # VAGUE/CONDIMENT
    "sugar":            None,             # CONDIMENT
    "tartar":           None,             # CONDIMENT
    "tomato souce":     None,             # CONDIMENT
    "wasabi":           None,             # CONDIMENT

    # --- Icecek ---
    "airan-katyk":      "Ayran",
    "beer":             None,             # BEVERAGE
    "beverages":        None,             # VAGUE/BEVERAGE
    "coffee":           None,             # BEVERAGE
    "juice":            None,             # BEVERAGE
    "kymyz-kymyran":    None,             # BEVERAGE/REGIONAL
    "milk":             None,             # BEVERAGE
    "soda":             None,             # BEVERAGE
    "spirits":          None,             # BEVERAGE
    "tea":              "Tea",
    "water":            None,             # BEVERAGE
    "wine":             None,             # BEVERAGE

    # --- Sut Urunleri ---
    "cheese":           "Cheese",
    "irimshik":         None,             # DAIRY/REGIONAL
    "kurt":             None,             # DAIRY/REGIONAL
    "suzbe":            None,             # DAIRY/REGIONAL

    # --- Fast Food ---
    "burger":           None,             # GFSD'de hamburger var (asagida)
    "hamburger":        "Burger",
    "chips":            "Chips",
    "french fries":     "Chips",
    "hot dog":          "Sausages",
    "nuggets":          "Fried_Chicken",
    "onion rings":      None,             # SUBCAT
    "pizza":            "Pizza",
    "sandwich":         None,             # VAGUE
    "sausages":         "Sausages",

    # --- Diger ---
    "almond":           "Almond",
    "bacon":            "Bacon",
    "cereal based cooked food": None,     # VAGUE
    "fruits":           None,             # VAGUE
    "seafood":          None,             # VAGUE
    "snacks":           None,             # VAGUE
    "soy product":      None,             # REGIONAL/VAGUE
    "soy souce":        None,             # CONDIMENT
    "sushi":            None,             # REGIONAL
    "sushi fish":       None,             # SUBCAT
    "sushi nori":       None,             # INGREDIENT
    "sushki":           None,             # REGIONAL
    "vegetable based cooked food": None,  # VAGUE
    "vegetable soup":   None,             # VAGUE
}


def build_target_categories():
    return [{"id": v, "name": k} for k, v in sorted(TARGET_NAME_TO_ID.items(), key=lambda x: x[1])]


def convert_split(json_path: Path):
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    src_cat_map = {c["id"]: c["name"].lower() for c in data["categories"]}

    src_to_target = {}
    for cid, cname in src_cat_map.items():
        target_name = GFSD_TO_TARGET.get(cname)
        if target_name is not None:
            src_to_target[cid] = TARGET_NAME_TO_ID[target_name]

    kept_anns = []
    discarded = 0
    for ann in data["annotations"]:
        new_cid = src_to_target.get(ann["category_id"])
        if new_cid is None:
            discarded += 1
            continue
        new_ann = dict(ann)
        new_ann["category_id"] = new_cid
        kept_anns.append(new_ann)

    used_img_ids = {ann["image_id"] for ann in kept_anns}
    kept_images  = [img for img in data["images"] if img["id"] in used_img_ids]

    result = dict(data)
    result["categories"]  = build_target_categories()
    result["images"]      = kept_images
    result["annotations"] = kept_anns

    cat_counter = Counter(ann["category_id"] for ann in kept_anns)
    stats = {
        "total_src_anns": len(data["annotations"]),
        "kept_anns":      len(kept_anns),
        "discarded_anns": discarded,
        "kept_images":    len(kept_images),
        "src_images":     len(data["images"]),
        "cat_counter":    cat_counter,
    }
    return result, stats


def print_stats(stats: dict, split: str):
    s = stats
    keep_pct = s["kept_anns"] / s["total_src_anns"] * 100 if s["total_src_anns"] else 0
    print(f"\n  [{split}]  {s['kept_images']}/{s['src_images']} gorsel  |  "
          f"{s['kept_anns']}/{s['total_src_anns']} ann kaldi ({keep_pct:.1f}%)  |  "
          f"{s['discarded_anns']} discard")
    print(f"  Aktif hedef sinif: {len(s['cat_counter'])}")
    target_id_to_name = {v: k for k, v in TARGET_NAME_TO_ID.items()}
    for tid, cnt in sorted(s["cat_counter"].items(), key=lambda x: -x[1])[:20]:
        aug_note = " (aug gerekli)" if cnt < 150 else ""
        print(f"    [{tid:3d}] {target_id_to_name[tid]:<25} {cnt:5d}{aug_note}")


def main():
    parser = argparse.ArgumentParser(description="GFSD kategori donusum")
    parser.add_argument("--dataset-dir", default=str(DATASET_DIR))
    parser.add_argument("--output-dir",  default=None)
    parser.add_argument("--apply",       action="store_true")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    ann_dir     = dataset_dir / "annotations"
    output_dir  = Path(args.output_dir) if args.output_dir else dataset_dir / "annotations_adjusted"

    print("GFSD Kategori Donusumu")
    print(f"  Kaynak : {ann_dir}")
    print(f"  Cikti  : {output_dir}")
    print(f"  Mod    : {'UYGULAMA' if args.apply else 'SIMULE (--apply ile yaz)'}")

    kept    = sum(1 for v in GFSD_TO_TARGET.values() if v is not None)
    discard = sum(1 for v in GFSD_TO_TARGET.values() if v is None)
    unique  = len(set(v for v in GFSD_TO_TARGET.values() if v))
    print(f"\n  Mapping: {kept} eslestirildi -> {unique} hedef sinif  |  {discard} discard")

    if args.apply:
        output_dir.mkdir(parents=True, exist_ok=True)

    for split in SPLITS:
        src = ann_dir / f"instances_{split}.json"
        if not src.exists():
            print(f"\n  [{split}] BULUNAMADI, atlaniyor.")
            continue
        result, stats = convert_split(src)
        print_stats(stats, split)
        if args.apply:
            dst = output_dir / f"instances_{split}.json"
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
            print(f"    Yazildi: {dst}")

    if not args.apply:
        print("\nNot: --apply ekle, hicbir dosya degistirilmedi.")


if __name__ == "__main__":
    main()
