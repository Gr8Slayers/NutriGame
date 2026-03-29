"""
UECFOOD256 kategori eslesme ve donusum scripti.

UECFOOD256: 256 kategori, 28897 gorsel, 31645 annotation (COCO format)
Kaynak: raw_datasets/uecfood256_coco/annotations/instances_all.json

Eleme kurallari (None):
  REGIONAL  : Japon/Kore/Cin mutfagina ozgu, kalori profili cok farkli
  VAGUE     : genis kapsam (stew, mixed dish, casserole)
  SUBCAT    : baska sinifin alt dali (rice-on-X -> None, X ayriysa SUBCAT)
  COMBO     : iki malzemeyi birlikte iceren, kalori hesaplanamaz
  SEAFOOD   : deniz urunu, hedefte karsiligi yok
  LOW_DATA  : annotation sayisi 80 altinda

Kullanim:
    python uecfood_category_adjustment.py           # simule et
    python uecfood_category_adjustment.py --apply   # JSON'u yaz
"""

import json
import argparse
from pathlib import Path
from collections import Counter


DATASET_DIR = Path("D:/Desktop/Bitirme/NutriGame/object_detection/raw_datasets/uecfood256_coco")
ANN_FILE    = DATASET_DIR / "annotations" / "instances_all.json"

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

# -------------------------------------------------------------------
# UECFOOD256 category_id  ->  hedef sinif adi
# -------------------------------------------------------------------
UECFOOD_TO_TARGET = {
    # --- Pirinc ---
    1:   "Rice",          # rice
    2:   None,            # eels on rice - COMBO (yilan baligi + pirinc)
    3:   "Rice",          # pilaf
    4:   None,            # chicken-'n'-egg on rice - COMBO
    5:   None,            # pork cutlet on rice - COMBO
    6:   None,            # beef curry - REGIONAL (Japon usulu)
    7:   None,            # sushi - REGIONAL
    8:   "Rice",          # chicken rice
    9:   "Rice",          # fried rice
    10:  None,            # tempura bowl - COMBO+REGIONAL
    11:  "Rice",          # bibimbap - Kore pirinc kabi
    # --- Ekmek ---
    12:  "Bread",         # toast
    13:  "Croissant",     # croissant - 121 ann
    14:  "Bread",         # roll bread
    15:  "Bread",         # raisin bread
    16:  "Burger",        # chip butty
    17:  "Burger",        # hamburger
    18:  "Pizza",         # pizza
    19:  None,            # sandwiches - VAGUE
    # --- Noodle / Pasta ---
    20:  "Pasta",         # udon noodle
    21:  "Pasta",         # tempura udon
    22:  "Pasta",         # soba noodle
    23:  "Pasta",         # ramen noodle
    24:  "Pasta",         # beef noodle
    25:  "Pasta",         # tensin noodle
    26:  "Pasta",         # fried noodle
    27:  "Pasta",         # spaghetti
    # --- Tatli/Pankek ---
    28:  "Pancakes",      # Japanese-style pancake (okonomiyaki gibi ama pankek de) - 137 ann
    29:  None,            # takoyaki - REGIONAL (ahtapot topu)
    30:  None,            # gratin - REGIONAL
    31:  None,            # sauteed vegetables - VAGUE
    32:  None,            # croquette - REGIONAL
    33:  "Grilled_Eggplant",  # grilled eggplant - 102 ann
    34:  "Spinach",       # sauteed spinach
    35:  None,            # vegetable tempura - REGIONAL/VAGUE
    36:  None,            # miso soup - REGIONAL
    37:  None,            # potage - REGIONAL
    38:  "Sausages",      # sausage
    39:  None,            # oden - REGIONAL
    40:  "Fried_Eggs",    # omelet
    41:  None,            # ganmodoki - REGIONAL
    42:  None,            # jiaozi - REGIONAL
    43:  None,            # stew - VAGUE
    44:  "Fish",          # teriyaki grilled fish
    45:  "Fish",          # fried fish
    46:  "Fish",          # grilled salmon
    47:  "Fish",          # salmon meuniere
    48:  "Fish",          # sashimi
    49:  "Fish",          # grilled pacific saury
    50:  None,            # sukiyaki - REGIONAL
    51:  "Fried_Meat",    # sweet and sour pork
    52:  "Fish",          # lightly roasted fish
    53:  "Fried_Eggs",    # steamed egg hotchpotch
    54:  None,            # tempura - VAGUE
    55:  "Fried_Chicken", # fried chicken
    56:  "Fried_Meat",    # sirloin cutlet
    57:  "Fish",          # nanbanzuke
    58:  "Fish",          # boiled fish
    59:  None,            # seasoned beef with potatoes - COMBO/REGIONAL
    60:  "Fried_Meat",    # hambarg steak
    61:  "Fried_Meat",    # steak
    62:  "Fish",          # dried fish
    63:  "Fried_Meat",    # ginger pork saute
    64:  None,            # spicy chili-flavored tofu - REGIONAL
    65:  "Fried_Chicken", # yakitori
    66:  None,            # cabbage roll - SUBCAT (Biber_Dolmasi'na yeterince benzemiyor, et miktari bilinmiyor)
    67:  "Fried_Eggs",    # omelet (tekrar)
    68:  "Fried_Eggs",    # egg sunny-side up
    69:  None,            # natto - REGIONAL
    70:  None,            # cold tofu - REGIONAL
    71:  None,            # egg roll - VAGUE
    72:  "Pasta",         # chilled noodle
    73:  "Fried_Meat",    # stir-fried beef and peppers
    74:  "Fried_Meat",    # simmered pork
    75:  None,            # boiled chicken and vegetables - VAGUE
    76:  "Fish",          # sashimi bowl
    77:  None,            # sushi bowl - REGIONAL
    78:  None,            # fish-shaped pancake with bean jam - REGIONAL
    79:  None,            # shrimp with chilli sauce - SEAFOOD
    80:  "Fried_Chicken", # roast chicken
    81:  None,            # steamed meat dumpling - VAGUE/REGIONAL
    82:  "Fried_Eggs",    # omelet with fried rice
    83:  None,            # cutlet curry - REGIONAL/COMBO
    84:  "Pasta",         # spaghetti meat sauce
    85:  None,            # fried shrimp - SEAFOOD
    86:  "Salad",         # potato salad
    87:  "Salad",         # green salad
    88:  "Salad",         # macaroni salad
    89:  None,            # Japanese tofu and vegetable chowder - REGIONAL
    90:  None,            # pork miso soup - REGIONAL
    91:  None,            # chinese soup - VAGUE
    92:  "Rice",          # beef bowl (donburi)
    93:  None,            # kinpira-style sauteed burdock - REGIONAL
    94:  "Rice",          # rice ball (onigiri)
    95:  "Pizza",         # pizza toast
    96:  "Pasta",         # dipping noodles
    97:  "Sausages",      # hot dog
    98:  "Chips",         # french fries
    99:  "Rice",          # mixed rice
    100: None,            # goya chanpuru - REGIONAL
    101: None,            # green curry - REGIONAL
    102: "Pasta",         # okinawa soba
    103: None,            # mango pudding - hedefte yok
    104: None,            # almond jelly - hedefte yok
    105: None,            # jjigae - REGIONAL
    106: "Fried_Chicken", # dak galbi (baharatlı Kore tavuk)
    107: None,            # dry curry - REGIONAL
    108: "Rice",          # kamameshi
    109: "Rice",          # rice vermicelli
    110: "Rice",          # paella
    111: "Pasta",         # tanmen
    112: "Fried_Meat",    # kushikatsu
    113: None,            # yellow curry - REGIONAL
    114: "Pancakes",      # pancake - 105 ann
    115: "Pasta",         # champon
    116: "Crepe",         # crape - 101 ann
    117: "Tiramisu",      # tiramisu - 102 ann
    118: "Waffle",        # waffle - 102 ann
    119: "Cheesecake",    # rare cheese cake - 112 ann
    120: None,            # shortcake - SUBCAT (meyve + kek, kalori belirsiz)
    121: None,            # chop suey - VAGUE
    122: "Fried_Meat",    # twice cooked pork
    123: "Rice",          # mushroom risotto
    124: None,            # samul - REGIONAL
    125: None,            # zoni - REGIONAL
    126: "Bread",         # french toast (ekmek tabanli, Bread sinifina dahil)
    127: "Pasta",         # fine white noodles
    128: None,            # minestrone - REGIONAL
    129: None,            # pot au feu - REGIONAL
    130: "Fried_Chicken", # chicken nugget
    131: "Fish",          # namero
    132: "Bread",         # french bread
    133: "Porridge",      # rice gruel
    134: None,            # broiled eel bowl - REGIONAL/COMBO
    135: None,            # clear soup - VAGUE
    136: None,            # yudofu - REGIONAL
    137: None,            # mozuku - REGIONAL (deniz yosunu)
    138: None,            # inarizushi - REGIONAL
    139: "Fried_Meat",    # pork loin cutlet
    140: "Fried_Meat",    # pork fillet cutlet
    141: "Fried_Chicken", # chicken cutlet
    142: "Fried_Meat",    # ham cutlet
    143: "Fried_Meat",    # minced meat cutlet
    144: None,            # thinly sliced raw horsemeat - REGIONAL
    145: "Bread",         # bagel
    146: "Bread",         # scone
    147: "Bread",         # tortilla
    148: None,            # tacos - REGIONAL (Meksika)
    149: "Chips",         # nachos
    150: "Fried_Meat",    # meat loaf
    151: "Scrambled_Egg", # scrambled egg - 101 ann, fried_eggs'ten gorsel olarak farkli
    152: None,            # rice gratin - COMBO
    153: "Pasta",         # lasagna
    154: "Salad",         # Caesar salad
    155: "Porridge",      # oatmeal
    156: None,            # fried pork dumplings in soup - REGIONAL
    157: None,            # oshiruko - REGIONAL
    158: "Muffin",        # muffin - 112 ann
    159: "Popcorn",       # popcorn - 116 ann (misir patlagi, Corn'dan farkli)
    160: "Cream_Puff",    # cream puff - 108 ann
    161: "Doughnut",      # doughnut - 112 ann
    162: "Apple_Pie",     # apple pie - 101 ann
    163: None,            # parfait - COMBO (dondurma + meyve, kalori hesaplanamaz)
    164: "Fried_Meat",    # fried pork in scoop
    165: "Adana_Kebap",   # lamb kebabs
    166: None,            # stir-fried potato+eggplant+pepper - VAGUE/COMBO
    167: None,            # roast duck - hedefte yok
    168: None,            # hot pot - VAGUE
    169: "Bacon",         # pork belly
    170: None,            # xiao long bao - REGIONAL
    171: None,            # moon cake - REGIONAL
    172: None,            # custard tart - REGIONAL
    173: "Pasta",         # beef noodle soup
    174: "Fried_Meat",    # pork cutlet
    175: "Rice",          # minced pork rice
    176: "Fish",          # fish ball soup
    177: None,            # oyster omelette - SEAFOOD
    178: "Rice",          # glutinous oil rice
    179: None,            # turnip pudding - hedefte yok
    180: None,            # stinky tofu - REGIONAL
    181: None,            # lemon fig jelly - hedefte yok
    182: "Pasta",         # khao soi
    183: None,            # sour prawn soup - SEAFOOD
    184: "Salad",         # Thai papaya salad
    185: None,            # Hainan chicken with rice - COMBO/VAGUE
    186: None,            # hot and sour fish ragout - VAGUE
    187: None,            # stir-fried mixed vegetables - VAGUE
    188: "Fried_Meat",    # beef in oyster sauce
    189: "Fried_Meat",    # pork satay
    190: "Salad",         # spicy chicken salad
    191: "Pasta",         # noodles with fish curry
    192: "Pasta",         # Pork Sticky Noodles
    193: "Fried_Meat",    # Pork with lemon
    194: "Fried_Meat",    # stewed pork leg
    195: "Fried_Meat",    # charcoal-boiled pork neck
    196: None,            # fried mussel pancakes - SEAFOOD
    197: "Fried_Chicken", # Deep Fried Chicken Wing
    198: None,            # Barbecued red pork with rice - COMBO
    199: None,            # Rice with roast duck - COMBO
    200: None,            # Rice crispy pork - COMBO
    201: None,            # Wonton soup - REGIONAL
    202: None,            # Chicken Rice Curry With Coconut - COMBO
    203: "Pasta",         # Crispy Noodles
    204: "Pasta",         # Egg Noodle In Chicken Yellow Curry
    205: None,            # coconut milk soup - REGIONAL
    206: "Pasta",         # pho
    207: "Pasta",         # Hue beef rice vermicelli soup
    208: None,            # Vermicelli noodles with snails - SEAFOOD
    209: None,            # Fried spring rolls - REGIONAL
    210: "Rice",          # Steamed rice roll
    211: None,            # Shrimp patties - SEAFOOD
    212: "Bread",         # ball shaped bun with pork (char siu bao)
    213: None,            # Coconut crepes with shrimp and beef - COMBO
    214: None,            # Small steamed savory rice pancake - REGIONAL
    215: None,            # Glutinous Rice Balls - hedefte yok
    216: None,            # loco moco - REGIONAL
    217: None,            # haupia - REGIONAL
    218: None,            # malasada - REGIONAL
    219: None,            # laulau - REGIONAL
    220: None,            # spam musubi - REGIONAL
    221: None,            # oxtail soup - REGIONAL
    222: None,            # adobo - REGIONAL
    223: None,            # lumpia - REGIONAL
    224: "Brownie",       # brownie - 108 ann
    225: "Churro",        # churro - 115 ann
    226: "Rice",          # jambalaya
    227: "Rice",          # nasi goreng
    228: "Fried_Chicken", # ayam goreng
    229: "Fried_Chicken", # ayam bakar
    230: "Porridge",      # bubur ayam
    231: None,            # gulai - REGIONAL
    232: "Pasta",         # laksa
    233: "Pasta",         # mie ayam
    234: "Pasta",         # mie goreng
    235: None,            # nasi campur - VAGUE (karisik tabak)
    236: None,            # nasi padang - VAGUE (karisik tabak)
    237: "Rice",          # nasi uduk
    238: None,            # babi guling - REGIONAL
    239: "Bread",         # kaya toast
    240: None,            # bak kut teh - REGIONAL
    241: None,            # curry puff - REGIONAL
    242: "Pasta",         # chow mein
    243: "Pasta",         # zha jiang mian
    244: "Fried_Chicken", # kung pao chicken
    245: "Bread",         # crullers
    246: None,            # eggplant with garlic sauce - SUBCAT (Grilled_Eggplant'tan farkli sos)
    247: "Fried_Chicken", # three cup chicken
    248: None,            # bean curd family style - REGIONAL
    249: None,            # salt & pepper fried shrimp - SEAFOOD
    250: "Fish",          # baked salmon
    251: None,            # braised pork meatball with napa cabbage - VAGUE
    252: None,            # winter melon soup - hedefte yok
    253: None,            # steamed spareribs - REGIONAL
    254: None,            # chinese pumpkin pie - hedefte yok
    255: None,            # eight treasure rice - REGIONAL
    256: None,            # hot & sour soup - REGIONAL
}


def build_target_categories():
    return [{"id": v, "name": k} for k, v in sorted(TARGET_NAME_TO_ID.items(), key=lambda x: x[1])]


def convert(ann_path: Path):
    with open(ann_path, encoding="utf-8") as f:
        data = json.load(f)

    kept_anns = []
    discarded = 0
    for ann in data["annotations"]:
        new_name = UECFOOD_TO_TARGET.get(ann["category_id"])
        if new_name is None:
            discarded += 1
            continue
        new_ann = dict(ann)
        new_ann["category_id"] = TARGET_NAME_TO_ID[new_name]
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


def print_stats(stats: dict):
    s = stats
    keep_pct = s["kept_anns"] / s["total_src_anns"] * 100 if s["total_src_anns"] else 0
    print(f"\n  {s['kept_images']}/{s['src_images']} gorsel  |  "
          f"{s['kept_anns']}/{s['total_src_anns']} ann kaldi ({keep_pct:.1f}%)  |  "
          f"{s['discarded_anns']} discard")
    target_id_to_name = {v: k for k, v in TARGET_NAME_TO_ID.items()}
    print(f"  Aktif hedef sinif sayisi: {len(s['cat_counter'])}")
    for tid, cnt in sorted(s["cat_counter"].items(), key=lambda x: -x[1]):
        aug_note = " (aug gerekli)" if cnt < 150 else ""
        print(f"    [{tid:3d}] {target_id_to_name[tid]:<25} {cnt:5d}{aug_note}")


def main():
    parser = argparse.ArgumentParser(description="UECFOOD256 kategori donusum")
    parser.add_argument("--dataset-dir", default=str(DATASET_DIR))
    parser.add_argument("--output-dir",  default=None)
    parser.add_argument("--apply",       action="store_true")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    ann_path    = dataset_dir / "annotations" / "instances_all.json"
    output_dir  = Path(args.output_dir) if args.output_dir else dataset_dir / "annotations_adjusted"

    print("UECFOOD256 Kategori Donusumu")
    print(f"  Kaynak : {ann_path}")
    print(f"  Cikti  : {output_dir}")
    print(f"  Mod    : {'UYGULAMA' if args.apply else 'SIMULE (--apply ile yaz)'}")

    kept    = sum(1 for v in UECFOOD_TO_TARGET.values() if v is not None)
    discard = sum(1 for v in UECFOOD_TO_TARGET.values() if v is None)
    unique  = len(set(v for v in UECFOOD_TO_TARGET.values() if v))
    print(f"\n  Mapping: {kept} eslestirildi -> {unique} hedef sinif  |  {discard} discard")

    if not ann_path.exists():
        print(f"\n[ERR] Dosya bulunamadi: {ann_path}")
        return

    result, stats = convert(ann_path)
    print_stats(stats)

    if args.apply:
        output_dir.mkdir(parents=True, exist_ok=True)
        dst = output_dir / "instances_all.json"
        with open(dst, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        print(f"\n  Yazildi: {dst}")
    else:
        print("\nNot: --apply ekle, hicbir dosya yazilmadi.")


if __name__ == "__main__":
    main()
