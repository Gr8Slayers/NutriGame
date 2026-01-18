import json
import os

def clean_coco_categories(original_json_path, new_json_path):
    """
    COCO formatındaki bir JSON dosyasını okur, kategorileri birleştirir,
    genel olanları çıkarır ve yeni bir temizlenmiş JSON dosyası oluşturur.

    Args:
        original_json_path (str): Orijinal annotations.json dosyasının yolu.
        new_json_path (str): Temizlenmiş verilerin kaydedileceği yeni dosyanın yolu.
    """

    # Adım 1: Yeni ve temiz kategori listesini tanımla
    # Bu liste, kalori bazlı 116 kategorili sistemdir.
    new_categories = [
        {"id": 0, "name": "Adana_Kebap"},
        {"id": 1, "name": "Almond"},
        {"id": 2, "name": "Ankara_Tava"},
        {"id": 3, "name": "Apple"},
        {"id": 4, "name": "Artichoke"},
        {"id": 5, "name": "Arugula"},
        {"id": 6, "name": "Asparagus"},
        {"id": 7, "name": "Avocado"},
        {"id": 8, "name": "Ayran"},
        {"id": 9, "name": "Bacon"},
        {"id": 10, "name": "Baklava"},
        {"id": 11, "name": "Banana"},
        {"id": 12, "name": "Beans"},
        {"id": 13, "name": "Beet"},
        {"id": 14, "name": "Bell_Pepper"},
        {"id": 15, "name": "Biber_Dolmasi"},
        {"id": 16, "name": "Black_Olives"},
        {"id": 17, "name": "Blackberry"},
        {"id": 18, "name": "Blueberry"},
        {"id": 19, "name": "Bread"},
        {"id": 20, "name": "Broccoli"},
        {"id": 21, "name": "Buckwheat"},
        {"id": 22, "name": "Bulgur_Pilavi"},
        {"id": 23, "name": "Burger"},
        {"id": 24, "name": "Cabbage"},
        {"id": 25, "name": "Cacik"},
        {"id": 26, "name": "Carrot"},

        {"id": 27, "name": "Cauliflower"},
        {"id": 28, "name": "Celery"},
        {"id": 29, "name": "Cheese"},
        {"id": 30, "name": "Cheesecake"},
        {"id": 31, "name": "Chips"},
        {"id": 32, "name": "Cig_Kofte"},
        {"id": 33, "name": "Corn"},
        {"id": 34, "name": "Crepe"},
        {"id": 35, "name": "Cucumber"},
        {"id": 36, "name": "Doner_Et"},
        {"id": 37, "name": "Doner_Tavuk"},
        {"id": 38, "name": "Domates_Corbasi"},
        {"id": 39, "name": "Et_Sote"},
        {"id": 40, "name": "Etli_Turlu"},
        {"id": 41, "name": "Ezogelin_Corba"},
        {"id": 42, "name": "Fish"},
        {"id": 43, "name": "Fried_Chicken"},
        {"id": 44, "name": "Fried_Eggs"},
        {"id": 45, "name": "Fried_Meat"},
        {"id": 46, "name": "Grapes"},
        {"id": 47, "name": "Green_Beans"},
        {"id": 48, "name": "Hummus"},
        {"id": 49, "name": "Ice_Cream"},
        {"id": 50, "name": "Irmik_Tatlisi"},
        {"id": 51, "name": "Iskender_Et"},
        {"id": 52, "name": "Iskender_Tavuk"},
        {"id": 53, "name": "Spinach"},
        {"id": 54, "name": "Cake"},
        {"id": 55, "name": "Izmir_Kofte"},
        {"id": 56, "name": "Kabak_Mucver"},
        {"id": 57, "name": "Kabak_Tatlisi"},
        {"id": 58, "name": "Kadinbudu_Kofte"},
        {"id": 59, "name": "Kasarli_Pide"},
        {"id": 60, "name": "Kir_Pidesi"},
        {"id": 61, "name": "Kiwi"},
        {"id": 62, "name": "Kiymali_Pide"},
        {"id": 63, "name": "Kunefe"},
        {"id": 64, "name": "Kusbasli_Pide"},
        {"id": 65, "name": "Lahmacun"},
        {"id": 66, "name": "Lemon"},
        {"id": 67, "name": "Mandarin"},
        {"id": 68, "name": "Mango"},
        {"id": 69, "name": "Mashed_Potato"},
        {"id": 70, "name": "Melon"},
        {"id": 71, "name": "Menemen"},
        {"id": 72, "name": "Mercimek_Coftesi"},
        {"id": 73, "name": "Mercimek_Corbasi"},
        {"id": 74, "name": "Midye_Dolma"},
        {"id": 75, "name": "Midye_Tava"},
        {"id": 76, "name": "Mumbar_Dolmasi"},
        {"id": 77, "name": "Mushrooms"},

        {"id": 78, "name": "Orange"},
        {"id": 79, "name": "Pasta"},
        {"id": 80, "name": "Patlican_Kebabi"},
        {"id": 81, "name": "Peanut"},
        {"id": 82, "name": "Peas"},
        {"id": 83, "name": "Pecan"},
        {"id": 84, "name": "Pineapple"},
        {"id": 85, "name": "Pizza"},
        {"id": 86, "name": "Porridge"},
        {"id": 87, "name": "Potatoes"},
        {"id": 88, "name": "Raspberry"},
        {"id": 89, "name": "Rice"},
        {"id": 90, "name": "Salad"},
        {"id": 91, "name": "Sausages"},
        {"id": 92, "name": "Sehriye_Corbasi"},
        {"id": 93, "name": "Strawberry"},
        {"id": 94, "name": "Suffle"},
        {"id": 95, "name": "Sutlac"},
        {"id": 96, "name": "Sweet_Potatoes"},
        {"id": 97, "name": "Tantuni_Et"},
        {"id": 98, "name": "Tantuni_Tavuk"},
        {"id": 99, "name": "Tarhana_Corbasi"},
        {"id": 100, "name": "Tea"},
        {"id": 101, "name": "Tomato"},
        {"id": 102, "name": "Waffles"},
        {"id": 103, "name": "Watermelon"},
        {"id": 104, "name": "Yayla_Corbasi"},
        {"id": 105, "name": "Zucchini"},
        {"id": 106, "name": "Pie"},
    ]

    # Adım 2: Eski 171 kategori ID'lerini yeni 116 kategori ID'lerine eşle
    # None değeri, bu kategorinin ve ilgili annotation'ların silineceği anlamına gelir.
    old_to_new_id_map = {
        1: 8,    # airan-katyk → Ayran
        2: 1,    # almond → Almond
        3: 3,    # apple → Apple
        4: 4,    # artichoke → Artichoke_Enginar
        5: 5,    # arugula → Arugula
        6: 6,    # asparagus → Asparagus
        7: 7,    # avocado → Avocado
        8: 9,    # bacon → Bacon
        9: 11,   # banana → Banana
        10: 12,  # beans → Beans
        11: 13,  # beet → Beet
        12: 14,  # bell pepper → Bell_Pepper
        13: 16,  # black olives → Black_Olives
        14: 17,  # blackberry → Blackberry
        15: 18,  # blueberry → Blueberry
        16: 43,  # boiled chicken → Fried_Chicken (merged with fried)
        17: 19,  # bread → Bread_Ekmek
        18: 20,  # broccoli → Broccoli
        19: 21,  # buckwheat → Buckwheat
        20: 24,  # cabbage → Cabbage
        21: 54,  # cakes → Cake
        22: 26,  # carrot → Carrot
        23: None,  # cashew → ÇIKARILDI (28 örnek)
        24: 40,  # casserole with meat and vegetables → Etli_Turlu
        25: 27,  # cauliflower → Cauliflower
        26: 28,  # celery → Celery
        27: None, # cereal based cooked food → REMOVED
        28: 29,  # cheese → Cheese
        29: None,  # chickpeas → ÇIKARILDI (33 örnek)
        30: 31,  # chips → Chips
        31: 80,  # cooked eggplant → Patlican_Kebabi
        32: 45,  # cooked food based on meat → Fried_Meat
        33: 40,  # cooked food meat with vegetables → Etli_Turlu
        34: 105, # cooked zucchini → Zucchini
        35: None, # cookies → REMOVED (too generic)
        36: 33,  # corn → Corn
        37: 34,  # crepe → Crepe
        38: 35,  # cucumber → Cucumber
        39: 58,  # cutlet → Kadinbudu_Kofte
        40: None, # desserts → REMOVED (too generic)
        41: 44,  # egg product → Fried_Eggs
        42: 80,  # eggplant → Patlican_Kebabi
        43: 42,  # fish → Fish
        44: 43,  # fried chicken → Fried_Chicken
        45: 44,  # fried eggs → Fried_Eggs
        46: 42,  # fried fish → Fish
        47: 45,  # fried meat → Fried_Meat
        48: None, # fruits → REMOVED (too generic)
        49: None, # granola → REMOVED (too generic)
        50: 46,  # grapes → Grapes
        51: 47,  # green beans → Green_Beans
        52: None, # herbs → REMOVED (too generic)
        53: 48,  # hummus → Hummus
        54: 49,  # ice-cream → Ice_Cream
        55: None, # irimshik → REMOVED
        56: None, # juice → REMOVED (too generic)
        57: 61,  # kiwi → Kiwi
        58: None, # lavash → REMOVED
        59: None, # legumes → REMOVED (too generic)
        60: 66,  # lemon → Lemon
        61: 67,  # mandarin → Mandarin
        62: 68,  # mango → Mango
        63: 69,  # mashed potato → Mashed_Potato
        64: None, # meat product → REMOVED (too generic)
        65: 70,  # melon → Melon
        66: None, # mixed berries → REMOVED
        67: None, # mixed nuts → REMOVED
        68: 77,  # mushrooms → Mushrooms
        69: None,  # onion → ÇIKARILDI (29 örnek)
        70: 78,  # orange → Orange
        71: 79,  # pasta → Pasta_Makarna
        72: None, # pastry → REMOVED
        73: 81,  # peanut → Peanut
        74: None,  # pear → ÇIKARILDI (37 örnek)
        75: 82,  # peas → Peas
        76: 83,  # pecan → Pecan
        77: None, # pickled cabbage → REMOVED (not common)
        78: None, # pickled squash → REMOVED (not common)
        79: 106, # pie → Pie
        80: 84,  # pineapple → Pineapple
        81: 85,  # pizza → Pizza
        82: 89,  # plov → Rice
        83: 86,  # porridge → Porridge
        84: 87,  # potatoes → Potatoes
        85: None, # pumpkin → REMOVED (generic)
        86: None,  # radish → ÇIKARILDI (15 örnek)
        87: 88,  # raspberry → Raspberry
        88: 89,  # rice → Rice
        89: 90,  # salad fresh → Salad_Salata
        90: 90,  # salad leaves → Salad_Salata
        91: 90,  # salad with fried meat veggie → Salad_Salata
        92: 90,  # salad with sauce → Salad_Salata
        93: None, # sandwich → REMOVED
        94: 91, # sausages → Sausages
        95: None, # seafood → REMOVED (too generic)
        96: None, # smetana → REMOVED
        97: None, # snacks → REMOVED
        98: None, # snacks bread → REMOVED
        99: None, # souces → REMOVED
        100: None, # soup-plain → REMOVED
        101: None, # soy product → REMOVED
        102: 53,  # spinach → Spinach
        103: 93, # strawberry → Strawberry
        104: None, # suzbe → REMOVED
        105: 96, # sweet potatoes → Sweet_Potatoes
        106: 101, # tomato → Tomato
        107: None, # tomato souce → REMOVED
        108: None, # tushpara-wo-soup → REMOVED
        109: None, # vegetable based cooked food → REMOVED (too generic)
        110: 102, # waffles → Waffles
        111: None, # walnut → ÇIKARILDI (21 örnek)
        112: 103, # watermelon → Watermelon
        113: 105, # zucchini → Zucchini
        114: None, # food-Yemek → REMOVED (too generic)
        115: 0,   # Adana_Kebap → Adana_Kebap (FIX: was 7)
        116: 8,   # Ayran → Ayran
        117: 10,  # Baklava → Baklava
        118: 15,  # Biber_Dolmasi → Biber_Dolmasi
        119: 22,  # Bulgur_Pilavi → Bulgur_Pilavi
        120: 23,  # Burger → Burger
        121: 100, # Cay → Tea
        122: 30,  # Cheescake → Cheesecake
        123: 32,  # Cig_Kofte → Cig_Kofte
        124: 38,  # Domates_Corbasi → Domates_Corbasi
        125: 19,  # Ekmek → Bread
        126: 97, # Ekmek_Arasi_Et_Tantuni → Tantuni_Et
        127: 98, # Ekmek_Arasi_Tavuk_Tantuni → Tantuni_Tavuk
        128: 36,  # Et_Doner → Doner_Et
        129: 51,  # Et_Iskender → Iskender_Et
        130: 39,  # Et_Sote → Et_Sote
        131: 42,  # Hamsi_Tava → Fish
        132: 53,  # Ispanak_Yemegi → Spinach
        133: 56,  # Kabak_Mucver → Kabak_Mucver
        134: 59,  # Kasarli_Pide → Kasarli_Pide
        135: 60,  # Kir_Pidesi → Kir_Pidesi
        136: 62,  # Kiymali_Pide → Kiymali_Pide
        137: 63,  # Kunefe → Kunefe
        138: 64,  # Kusbasli_Pide → Kusbasli_Pide
        139: 65,  # Lahmacun → Lahmacun
        140: 79,  # Makarna → Pasta_Makarna
        141: 71,  # Menemen → Menemen
        142: 72,  # Mercimek_Coftesi → Mercimek_Coftesi
        143: 73,  # Mercimek_Corbasi → Mercimek_Corbasi
        144: 75,  # Midye_Tava → Midye_Tava
        145: 74,  # Midye_dolma → Midye_Dolma
        146: 76,  # Mumber_Dolmasi → Mumbar_Dolmasi
        147: 31,  # Patates_Kizartmasi → Chips
        148: 80,  # Patlican_Kebabi → Patlican_Kebabi
        149: 85,  # Pizza → Pizza
        150: 90,  # Salata → Salad
        151: 92,  # Sehriye_Corbasi → Sehriye_Corbasi
        152: 94,  # Suffle → Suffle
        153: 95,  # Sutlac → Sutlac
        154: 99,  # Tarhana_Corbasi → Tarhana_Corbasi
        155: 37,  # Tavuk_Doner → Doner_Tavuk
        156: 52,  # Tavuk_Iskender → Iskender_Tavuk
        157: 104, # Yayla_Corbasi → Yayla_Corbasi
        158: 2,   # ankara_tava → Ankara_Tava
        159: 25,  # cacik → Cacik
        160: 10,  # cevizli_baklava → Baklava
        161: 4,   # enginar → Artichoke
        162: None,  # etli_nohut → ÇIKARILDI (33 örnek)
        163: 40,  # etli_turlu → Etli_Turlu
        164: 41,  # ezogelin_corba → Ezogelin_Corba
        165: 50,  # irmik_tatlisi → Irmik_Tatlisi
        166: 53,  # ispanak → Spinach
        167: 53,  # ispanak_graten → Spinach
        168: 55,  # izmir_kofte → Izmir_Kofte
        169: 57,  # kabak_tatlisi → Kabak_Tatlisi
        170: 58,  # kadinbudu_kofte → Kadinbudu_Kofte
        171: None,  # kakaolu_puding → ÇIKARILDI (42 örnek)
    }

    print(f"Orijinal dosya yükleniyor: {original_json_path}")
    with open(original_json_path, 'r') as f:
        coco_data = json.load(f)

    new_annotations = []
    valid_image_ids = set()

    print("Annotation'lar işleniyor...")
    for ann in coco_data['annotations']:
        old_category_id = ann['category_id']
        new_category_id = old_to_new_id_map.get(old_category_id)

        if new_category_id is not None:
            ann['category_id'] = new_category_id
            new_annotations.append(ann)
            valid_image_ids.add(ann['image_id'])

    print("Resim listesi filtreleniyor...")
    new_images = [img for img in coco_data['images'] if img['id'] in valid_image_ids]

    new_coco_data = {
        'info': coco_data.get('info', {}),
        'licenses': coco_data.get('licenses', []),
        'images': new_images,
        'annotations': new_annotations,
        'categories': new_categories  # 'supercategory' eklenmiş yeni listeyi kullan
    }

    print(f"Temizlenmiş veriler kaydediliyor: {new_json_path}")
    with open(new_json_path, 'w') as f:
        json.dump(new_coco_data, f, indent=4)

    print("-" * 30)
    print("İşlem Tamamlandı!")
    print(f"Yeni kategori sayısı: {len(new_categories)}")
    print(f"İlk kategorinin formatı: {new_categories[0] if new_categories else 'Liste boş'}")
    print("-" * 30)

# --- KODU ÇALIŞTIR ---
if __name__ == '__main__':
    # clean_dataset.json dosyasını kullan (temizlenmiş 131 kategorili)
    base_dir = r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data'
    
    # clean_dataset.json'u 120 kategorili hale getir
    original_json = os.path.join(base_dir, 'clean_dataset.json')
    new_json = os.path.join(base_dir, 'grouped_dataset.json')
    
    print(f"\n{'='*50}")
    print(f"İşleniyor: clean_dataset.json → grouped_dataset.json")
    print(f"{'='*50}")
    clean_coco_categories(original_json, new_json)