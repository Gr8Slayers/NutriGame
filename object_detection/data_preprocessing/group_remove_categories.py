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
        {"id": 4, "name": "Artichoke_Enginar"},
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
        {"id": 19, "name": "Bread_Ekmek"},
        {"id": 20, "name": "Broccoli"},
        {"id": 21, "name": "Buckwheat"},
        {"id": 22, "name": "Bulgur_Pilavi"},
        {"id": 23, "name": "Burger"},
        {"id": 24, "name": "Cabbage"},
        {"id": 25, "name": "Cacik"},
        {"id": 26, "name": "Carrot"},
        {"id": 27, "name": "Cashew"},
        {"id": 28, "name": "Cauliflower"},
        {"id": 29, "name": "Celery"},
        {"id": 30, "name": "Cheese"},
        {"id": 31, "name": "Cheesecake"},
        {"id": 32, "name": "Chickpeas"},
        {"id": 33, "name": "Chips"},
        {"id": 34, "name": "Cig_Kofte"},
        {"id": 35, "name": "Corn"},
        {"id": 36, "name": "Crepe"},
        {"id": 37, "name": "Cucumber"},
        {"id": 38, "name": "Doner_Et"},
        {"id": 39, "name": "Doner_Tavuk"},
        {"id": 40, "name": "Domates_Corbasi"},
        {"id": 41, "name": "Eggplant"},
        {"id": 42, "name": "Et_Sote"},
        {"id": 43, "name": "Etli_Turlu"},
        {"id": 44, "name": "Ezogelin_Corba"},
        {"id": 45, "name": "Fish"},
        {"id": 46, "name": "Fried_Chicken"},
        {"id": 47, "name": "Fried_Eggs"},
        {"id": 48, "name": "Fried_Meat"},
        {"id": 49, "name": "Granola"},
        {"id": 50, "name": "Grapes"},
        {"id": 51, "name": "Green_Beans"},
        {"id": 52, "name": "Hummus"},
        {"id": 53, "name": "Ice_Cream"},
        {"id": 54, "name": "Irmik_Tatlisi"},
        {"id": 55, "name": "Iskender_Et"},
        {"id": 56, "name": "Iskender_Tavuk"},
        {"id": 57, "name": "Ispanak"},
        {"id": 58, "name": "Ispanak_Graten"},
        {"id": 59, "name": "Izmir_Kofte"},
        {"id": 60, "name": "Juice"},
        {"id": 61, "name": "Kabak_Mucver"},
        {"id": 62, "name": "Kabak_Tatlisi"},
        {"id": 63, "name": "Kadinbudu_Kofte"},
        {"id": 64, "name": "Kakaolu_Puding"},
        {"id": 65, "name": "Kasarli_Pide"},
        {"id": 66, "name": "Kir_Pidesi"},
        {"id": 67, "name": "Kiwi"},
        {"id": 68, "name": "Kiymali_Pide"},
        {"id": 69, "name": "Kunefe"},
        {"id": 70, "name": "Kusbasli_Pide"},
        {"id": 71, "name": "Lahmacun"},
        {"id": 72, "name": "Lemon"},
        {"id": 73, "name": "Mandarin"},
        {"id": 74, "name": "Mango"},
        {"id": 75, "name": "Mashed_Potato"},
        {"id": 76, "name": "Melon"},
        {"id": 77, "name": "Menemen"},
        {"id": 78, "name": "Mercimek_Coftesi"},
        {"id": 79, "name": "Mercimek_Corbasi"},
        {"id": 80, "name": "Midye_Dolma"},
        {"id": 81, "name": "Midye_Tava"},
        {"id": 82, "name": "Mumbar_Dolmasi"},
        {"id": 83, "name": "Mushrooms"},
        {"id": 84, "name": "Onion"},
        {"id": 85, "name": "Orange"},
        {"id": 86, "name": "Pasta_Makarna"},
        {"id": 87, "name": "Patlican_Kebabi"},
        {"id": 88, "name": "Peanut"},
        {"id": 89, "name": "Pear"},
        {"id": 90, "name": "Peas"},
        {"id": 91, "name": "Pecan"},
        {"id": 92, "name": "Pineapple"},
        {"id": 93, "name": "Pizza"},
        {"id": 94, "name": "Porridge"},
        {"id": 95, "name": "Potatoes"},
        {"id": 96, "name": "Radish"},
        {"id": 97, "name": "Raspberry"},
        {"id": 98, "name": "Rice"},
        {"id": 99, "name": "Salad_Salata"},
        {"id": 100, "name": "Sausages"},
        {"id": 101, "name": "Sehriye_Corbasi"},
        {"id": 102, "name": "Strawberry"},
        {"id": 103, "name": "Suffle"},
        {"id": 104, "name": "Sutlac"},
        {"id": 105, "name": "Sweet_Potatoes"},
        {"id": 106, "name": "Tantuni_Et"},
        {"id": 107, "name": "Tantuni_Tavuk"},
        {"id": 108, "name": "Tarhana_Corbasi"},
        {"id": 109, "name": "Tea"},
        {"id": 110, "name": "Tomato"},
        {"id": 111, "name": "Waffles"},
        {"id": 112, "name": "Walnut"},
        {"id": 113, "name": "Watermelon"},
        {"id": 114, "name": "Yayla_Corbasi"},
        {"id": 115, "name": "Zucchini"},
    ]

    # Adım 2: Eski 171 kategori ID'lerini yeni 116 kategori ID'lerine eşle
    # None değeri, bu kategorinin ve ilgili annotation'ların silineceği anlamına gelir.
    # KRİTİK: 115 (Adana_Kebap) artık 0'a eşleniyor (eskiden 7'ye hatalı eşleniyordu)
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
        16: 46,  # boiled chicken → Fried_Chicken (merged with fried)
        17: 19,  # bread → Bread_Ekmek
        18: 20,  # broccoli → Broccoli
        19: 21,  # buckwheat → Buckwheat
        20: 24,  # cabbage → Cabbage
        21: None, # cakes → REMOVED
        22: 26,  # carrot → Carrot
        23: 27,  # cashew → Cashew
        24: 43,  # casserole with meat and vegetables → Etli_Turlu
        25: 28,  # cauliflower → Cauliflower
        26: 29,  # celery → Celery
        27: None, # cereal based cooked food → REMOVED
        28: 30,  # cheese → Cheese
        29: 32,  # chickpeas → Chickpeas
        30: 33,  # chips → Chips
        31: 41,  # cooked eggplant → Eggplant
        32: 48,  # cooked food based on meat → Fried_Meat
        33: 43,  # cooked food meat with vegetables → Etli_Turlu
        34: 115, # cooked zucchini → Zucchini
        35: None, # cookies → REMOVED
        36: 35,  # corn → Corn
        37: 36,  # crepe → Crepe
        38: 37,  # cucumber → Cucumber
        39: 63,  # cutlet → Kadinbudu_Kofte
        40: None, # desserts → REMOVED (too generic)
        41: 47,  # egg product → Fried_Eggs
        42: 41,  # eggplant → Eggplant
        43: 45,  # fish → Fish
        44: 46,  # fried chicken → Fried_Chicken
        45: 47,  # fried eggs → Fried_Eggs
        46: 45,  # fried fish → Fish
        47: 48,  # fried meat → Fried_Meat
        48: None, # fruits → REMOVED (too generic)
        49: 49,  # granola → Granola
        50: 50,  # grapes → Grapes
        51: 51,  # green beans → Green_Beans
        52: None, # herbs → REMOVED (too generic)
        53: 52,  # hummus → Hummus
        54: 53,  # ice-cream → Ice_Cream
        55: None, # irimshik → REMOVED
        56: 60,  # juice → Juice
        57: 67,  # kiwi → Kiwi
        58: None, # lavash → REMOVED
        59: None, # legumes → REMOVED (too generic)
        60: 72,  # lemon → Lemon
        61: 73,  # mandarin → Mandarin
        62: 74,  # mango → Mango
        63: 75,  # mashed potato → Mashed_Potato
        64: None, # meat product → REMOVED (too generic)
        65: 76,  # melon → Melon
        66: None, # mixed berries → REMOVED
        67: None, # mixed nuts → REMOVED
        68: 83,  # mushrooms → Mushrooms
        69: 84,  # onion → Onion
        70: 85,  # orange → Orange
        71: 86,  # pasta → Pasta_Makarna
        72: None, # pastry → REMOVED
        73: 88,  # peanut → Peanut
        74: 89,  # pear → Pear
        75: 90,  # peas → Peas
        76: 91,  # pecan → Pecan
        77: None, # pickled cabbage → REMOVED
        78: None, # pickled squash → REMOVED
        79: None, # pie → REMOVED
        80: 92,  # pineapple → Pineapple
        81: 93,  # pizza → Pizza
        82: 98,  # plov → Rice
        83: 94,  # porridge → Porridge
        84: 95,  # potatoes → Potatoes
        85: None, # pumpkin → REMOVED (generic)
        86: 96,  # radish → Radish
        87: 97,  # raspberry → Raspberry
        88: 98,  # rice → Rice
        89: 99,  # salad fresh → Salad_Salata
        90: 99,  # salad leaves → Salad_Salata
        91: 99,  # salad with fried meat veggie → Salad_Salata
        92: 99,  # salad with sauce → Salad_Salata
        93: None, # sandwich → REMOVED
        94: 100, # sausages → Sausages
        95: None, # seafood → REMOVED (too generic)
        96: None, # smetana → REMOVED
        97: None, # snacks → REMOVED
        98: None, # snacks bread → REMOVED
        99: None, # souces → REMOVED
        100: None, # soup-plain → REMOVED
        101: None, # soy product → REMOVED
        102: 57,  # spinach → Ispanak
        103: 102, # strawberry → Strawberry
        104: None, # suzbe → REMOVED
        105: 105, # sweet potatoes → Sweet_Potatoes
        106: 110, # tomato → Tomato
        107: None, # tomato souce → REMOVED
        108: None, # tushpara-wo-soup → REMOVED
        109: None, # vegetable based cooked food → REMOVED (too generic)
        110: 111, # waffles → Waffles
        111: 112, # walnut → Walnut
        112: 113, # watermelon → Watermelon
        113: 115, # zucchini → Zucchini
        114: None, # food-Yemek → REMOVED (too generic)
        115: 0,   # Adana_Kebap → Adana_Kebap (FIX: was 7)
        116: 8,   # Ayran → Ayran
        117: 10,  # Baklava → Baklava
        118: 15,  # Biber_Dolmasi → Biber_Dolmasi
        119: 22,  # Bulgur_Pilavi → Bulgur_Pilavi
        120: 23,  # Burger → Burger
        121: 109, # Cay → Tea
        122: 31,  # Cheescake → Cheesecake
        123: 34,  # Cig_Kofte → Cig_Kofte
        124: 40,  # Domates_Corbasi → Domates_Corbasi
        125: 19,  # Ekmek → Bread_Ekmek
        126: 106, # Ekmek_Arasi_Et_Tantuni → Tantuni_Et
        127: 107, # Ekmek_Arasi_Tavuk_Tantuni → Tantuni_Tavuk
        128: 38,  # Et_Doner → Doner_Et
        129: 55,  # Et_Iskender → Iskender_Et
        130: 42,  # Et_Sote → Et_Sote
        131: 45,  # Hamsi_Tava → Fish
        132: 57,  # Ispanak_Yemegi → Ispanak
        133: 61,  # Kabak_Mucver → Kabak_Mucver
        134: 65,  # Kasarli_Pide → Kasarli_Pide
        135: 66,  # Kir_Pidesi → Kir_Pidesi
        136: 68,  # Kiymali_Pide → Kiymali_Pide
        137: 69,  # Kunefe → Kunefe
        138: 70,  # Kusbasli_Pide → Kusbasli_Pide
        139: 71,  # Lahmacun → Lahmacun
        140: 86,  # Makarna → Pasta_Makarna
        141: 77,  # Menemen → Menemen
        142: 78,  # Mercimek_Coftesi → Mercimek_Coftesi
        143: 79,  # Mercimek_Corbasi → Mercimek_Corbasi
        144: 81,  # Midye_Tava → Midye_Tava
        145: 80,  # Midye_dolma → Midye_Dolma
        146: 82,  # Mumber_Dolmasi → Mumbar_Dolmasi
        147: 33,  # Patates_Kizartmasi → Chips
        148: 87,  # Patlican_Kebabi → Patlican_Kebabi
        149: 93,  # Pizza → Pizza
        150: 99,  # Salata → Salad_Salata
        151: 101, # Sehriye_Corbasi → Sehriye_Corbasi
        152: 103, # Suffle → Suffle
        153: 104, # Sutlac → Sutlac
        154: 108, # Tarhana_Corbasi → Tarhana_Corbasi
        155: 39,  # Tavuk_Doner → Doner_Tavuk
        156: 56,  # Tavuk_Iskender → Iskender_Tavuk
        157: 114, # Yayla_Corbasi → Yayla_Corbasi
        158: 2,   # ankara_tava → Ankara_Tava
        159: 25,  # cacik → Cacik
        160: 10,  # cevizli_baklava → Baklava
        161: 4,   # enginar → Artichoke_Enginar
        162: None, # etli_nohut → REMOVED
        163: 43,  # etli_turlu → Etli_Turlu
        164: 44,  # ezogelin_corba → Ezogelin_Corba
        165: 54,  # irmik_tatlisi → Irmik_Tatlisi
        166: 57,  # ispanak → Ispanak
        167: 58,  # ispanak_graten → Ispanak_Graten
        168: 59,  # izmir_kofte → Izmir_Kofte
        169: 62,  # kabak_tatlisi → Kabak_Tatlisi
        170: 63,  # kadinbudu_kofte → Kadinbudu_Kofte
        171: 64,  # kakaolu_puding → Kakaolu_Puding
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
    # Orijinal 171 kategorili backup dosyalarını kullan
    base_dir = r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data'
    
    # Backup dosyalarından yeni 116 kategorili dosyalar oluştur
    files_to_process = [
        ('_train.json', 'instances_train.json'),
        ('_valid.json', 'instances_val.json'),
        ('_test.json', 'instances_test.json')
    ]

    for original_file, new_file in files_to_process:
        original_json = os.path.join(base_dir, original_file)
        new_json = os.path.join(base_dir, 'annotations', new_file)
        
        # Annotations klasörünü oluştur (yoksa)
        os.makedirs(os.path.dirname(new_json), exist_ok=True)
        
        print(f"\n{'='*50}")
        print(f"İşleniyor: {original_file} → {new_file}")
        print(f"{'='*50}")
        clean_coco_categories(original_json, new_json)