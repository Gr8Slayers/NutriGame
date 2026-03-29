"""
TurkishFood25 COCO kategori eslesme ve donusum scripti.

Kaynak: raw_datasets/turkish25_coco/instances_{train,val,test}.json
  - 85 kategori var (proje genelinde kullanilan liste kopyalanmis)
  - Fiilen kullanilan 16 sinif:
      asure->None, baklava->Baklava, biber_dolmasi->Biber_Dolmasi,
      borek->Borek (613 ann), cig_kofte->Cig_Kofte, enginar->None,
      et_sote->Et_Sote, gozleme->Gozleme (414 ann), hamsi->Fish,
      hunkar_begendi->Et_Sote, icli_kofte->Izmir_Kofte, ispanak->Spinach,
      izmir_kofte->Izmir_Kofte, karniyarik->Etli_Turlu, kebap->Adana_Kebap,
      kisir->Salad, kuru_fasulye->None, lahmacun->Lahmacun, lokum->None,
      manti->Pasta, mucver->Kabak_Mucver, pirinc_pilavi->Rice,
      simit->Simit (391 ann), taze_fasulye->Green_Beans,
      yaprak_sarma->Biber_Dolmasi

Gorev: JSON'daki category_id'leri 115'lik hedef sisteme remap eder.

Kullanim:
    python turkishfood_category_adjustment.py           # simule et
    python turkishfood_category_adjustment.py --apply   # JSON'lari yaz
"""

import json
import argparse
from pathlib import Path
from collections import Counter


DATASET_DIR = Path("D:/Desktop/Bitirme/NutriGame/object_detection/raw_datasets/turkish25_coco")
SPLITS      = ["train", "val", "test"]

# Genisletilmis hedef sinif sistemi (115 sinif)
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

# ----------------------------------------------------------------------
# TurkishFood25 kaynak sinif adi (kucuk harf)  ->  hedef 90 sinif adi
# Eleme nedenleri:
#   VAGUE     : kalorik hesap yapılamayacak kadar genis
#   REGIONAL  : sadece Turkce mutfaga ozgu, hedefte eslesi yok
#   NOBOX     : siniflandirma dataseti olmasi nedeniyle bbox anlamsiz
# ----------------------------------------------------------------------
TF25_TO_TARGET = {
    # --- Kullanilan 25 sinif ---
    "asure":          None,          # REGIONAL - bugday tatlisi, hedefte yok
    "baklava":        "Baklava",
    "biber_dolmasi":  "Biber_Dolmasi",
    "borek":          "Borek",        # 613 ann - katmanli hamur, Bread'den ayri sinif
    "cig_kofte":      "Cig_Kofte",
    "enginar":        None,          # LOW_DATA - yeterli gorsel yok
    "et_sote":        "Et_Sote",
    "gozleme":        "Gozleme",     # 414 ann - buyuk duz ucgen hamur, Bread'den ayri
    "hamsi":          "Fish",        # hamsi = balik
    "hunkar_begendi": "Et_Sote",     # patlican uzerine et = Et_Sote en yakini
    "icli_kofte":     "Izmir_Kofte", # ic yagi olan kofte = Izmir_Kofte'ye yakin
    "ispanak":        "Spinach",
    "izmir_kofte":    "Izmir_Kofte",
    "karniyarik":     "Etli_Turlu",  # karniyarik = Etli_Turlu (patlican+kiymali)
    "kebap":          "Adana_Kebap", # genel kebap -> Adana (en yaygin sis kebabi)
    "kisir":          "Salad",       # kisir = bulgur salatasi -> Salad
    "kuru_fasulye":   None,          # REGIONAL - hedefte dogrudan karsiligi yok
    "lahmacun":       "Lahmacun",
    "lokum":          None,          # REGIONAL - Turk lokumu, hedefte yok
    "manti":          "Pasta",       # manti = hamur yemegi -> Pasta
    "mucver":         "Kabak_Mucver",
    "pirinc_pilavi":  "Rice",
    "simit":          "Simit",        # 391 ann - halka + susam, cok net gorsel ayrim
    "taze_fasulye":   "Green_Beans",
    "yaprak_sarma":   "Biber_Dolmasi",  # yaprak sarma ~ biber dolmasi (sarma/dolma)

    # --- JSON'daki diger 60 kategori (fiilen annotation yok, id remapi icin) ---
    # Bunlarin annotation'u sifir, sadece id esleme tablosunu tamamlamak icin:
    "Adana_Kebap":    "Adana_Kebap",
    "Apple":          "Apple",
    "Asparagus":      "Asparagus",
    "Avocado":        "Avocado",
    "Ayran":          "Ayran",
    "Bacon":          "Bacon",
    "Baklava":        "Baklava",
    "Banana":         "Banana",
    "Beans":          "Beans",
    "Bell_Pepper":    "Bell_Pepper",
    "Biber_Dolmasi":  "Biber_Dolmasi",
    "Black_Olives":   "Black_Olives",
    "Blackberry":     "Blackberry",
    "Bread":          "Bread",
    "Broccoli":       "Broccoli",
    "Bulgur_Pilavi":  "Bulgur_Pilavi",
    "Burger":         "Burger",
    "Cabbage":        "Cabbage",
    "Cacik":          "Cacik",
    "Carrot":         "Carrot",
    "Cauliflower":    "Cauliflower",
    "Cheese":         "Cheese",
    "Chips":          "Chips",
    "Cig_Kofte":      "Cig_Kofte",
    "Corn":           "Corn",
    "Cucumber":       "Cucumber",
    "Domates_Corbasi": "Domates_Corbasi",
    "Doner_Et":       "Doner_Et",
    "Doner_Tavuk":    "Doner_Tavuk",
    "Et_Sote":        "Et_Sote",
    "Etli_Turlu":     "Etli_Turlu",
    "Ezogelin_Corba": "Ezogelin_Corba",
    "Fish":           "Fish",
    "Fried_Chicken":  "Fried_Chicken",
    "Fried_Eggs":     "Fried_Eggs",
    "Fried_Meat":     "Fried_Meat",
    "Grapes":         "Grapes",
    "Green_Beans":    "Green_Beans",
    "Irmik_Tatlisi":  "Irmik_Tatlisi",
    "Iskender_Et":    "Iskender_Et",
    "Iskender_Tavuk": "Iskender_Tavuk",
    "Izmir_Kofte":    "Izmir_Kofte",
    "Kabak_Mucver":   "Kabak_Mucver",
    "Kabak_Tatlisi":  "Kabak_Tatlisi",
    "Kadinbudu_Kofte": "Kadinbudu_Kofte",
    "Karniyarik":     "Etli_Turlu",
    "Kasarli_Pide":   "Kasarli_Pide",
    "Kir_Pidesi":     "Kir_Pidesi",
    "Kiymali_Pide":   "Kiymali_Pide",
    "Kiwi":           "Kiwi",
    "Kunefe":         "Kunefe",
    "Kusbasli_Pide":  "Kusbasli_Pide",
    "Lahmacun":       "Lahmacun",
    "Lemon":          "Lemon",
    "Mandarin":       "Mandarin",
    "Melon":          "Melon",
    "Menemen":        "Menemen",
    "Mercimek_Coftesi": "Mercimek_Coftesi",
    "Mercimek_Corbasi": "Mercimek_Corbasi",
    "Midye_Dolma":    "Midye_Dolma",
    "Midye_Tava":     "Midye_Tava",
    "Mumbar_Dolmasi": "Mumbar_Dolmasi",
    "Mushrooms":      "Mushrooms",
    "Orange":         "Orange",
    "Pasta":          "Pasta",
    "Patlican_Kebabi": "Patlican_Kebabi",
    "Pineapple":      "Pineapple",
    "Pizza":          "Pizza",
    "Porridge":       "Porridge",
    "Potatoes":       "Potatoes",
    "Raspberry":      "Raspberry",
    "Rice":           "Rice",
    "Salad":          "Salad",
    "Sausages":       "Sausages",
    "Sehriye_Corbasi": "Sehriye_Corbasi",
    "Spinach":        "Spinach",
    "Strawberry":     "Strawberry",
    "Suffle":         "Suffle",
    "Sutlac":         "Sutlac",
    "Sweet_Potatoes": "Sweet_Potatoes",
    "Tantuni_Et":     "Tantuni_Et",
    "Tantuni_Tavuk":  "Tantuni_Tavuk",
    "Tarhana_Corbasi": "Tarhana_Corbasi",
    "Tea":            "Tea",
    "Tomato":         "Tomato",
    "Watermelon":     "Watermelon",
    "Yayla_Corbasi":  "Yayla_Corbasi",
    "Zucchini":       "Zucchini",
    "Ankara_Tava":    "Ankara_Tava",
}


def build_target_categories():
    return [{"id": v, "name": k} for k, v in sorted(TARGET_NAME_TO_ID.items(), key=lambda x: x[1])]


def convert_split(json_path: Path):
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    src_cat_map = {c["id"]: c["name"] for c in data["categories"]}

    src_to_target = {}
    for cid, cname in src_cat_map.items():
        target_name = TF25_TO_TARGET.get(cname)
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
    target_id_to_name = {v: k for k, v in TARGET_NAME_TO_ID.items()}
    print("  Aktif siniflar:")
    for tid, cnt in sorted(s["cat_counter"].items(), key=lambda x: -x[1]):
        print(f"    [{tid:2d}] {target_id_to_name[tid]:<25} {cnt:5d}")


def main():
    parser = argparse.ArgumentParser(description="TurkishFood25 kategori donusum")
    parser.add_argument("--dataset-dir", default=str(DATASET_DIR))
    parser.add_argument("--output-dir",  default=None)
    parser.add_argument("--apply",       action="store_true")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    output_dir  = Path(args.output_dir) if args.output_dir else dataset_dir / "adjusted"

    print("TurkishFood25 Kategori Donusumu")
    print(f"  Kaynak : {dataset_dir}")
    print(f"  Cikti  : {output_dir}")
    print(f"  Mod    : {'UYGULAMA' if args.apply else 'SIMULE (--apply ile yaz)'}")

    kept   = sum(1 for v in TF25_TO_TARGET.values() if v is not None)
    discard = sum(1 for v in TF25_TO_TARGET.values() if v is None)
    print(f"\n  Mapping: {kept} eslestirildi, {discard} discard")

    if args.apply:
        output_dir.mkdir(parents=True, exist_ok=True)

    for split in SPLITS:
        src = dataset_dir / f"instances_{split}.json"
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
        print("\nNot: --apply ekle, hicbir dosya yazilmadi.")


if __name__ == "__main__":
    main()
