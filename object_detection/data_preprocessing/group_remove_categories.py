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
    # Bu liste, bir önceki yanıtta oluşturduğumuz 99 sınıflı listedir.
    new_categories = [
        {"id": 0, "name": "Adana_Kebap"}, {"id": 1, "name": "Almond"},
        {"id": 2, "name": "Apple"}, {"id": 3, "name": "Artichoke_Enginar"},
        {"id": 4, "name": "Arugula"}, {"id": 5, "name": "Asparagus"},
        {"id": 6, "name": "Avocado"}, {"id": 7, "name": "Ayran"},
        {"id": 8, "name": "Bacon"}, {"id": 9, "name": "Baklava"},
        {"id": 10, "name": "Banana"}, {"id": 11, "name": "Beans"},
        {"id": 12, "name": "Beet"}, {"id": 13, "name": "Bell_Pepper"},
        {"id": 14, "name": "Black_Olives"}, {"id": 15, "name": "Blackberry"},
        {"id": 16, "name": "Blueberry"}, {"id": 17, "name": "Bread_Ekmek"},
        {"id": 18, "name": "Broccoli"}, {"id": 19, "name": "Buckwheat"},
        {"id": 20, "name": "Burger"}, {"id": 21, "name": "Cabbage"},
        {"id": 22, "name": "Cacik"}, {"id": 23, "name": "Carrot"},
        {"id": 24, "name": "Cashew"}, {"id": 25, "name": "Cauliflower"},
        {"id": 26, "name": "Celery"}, {"id": 27, "name": "Cheese"},
        {"id": 28, "name": "Cheesecake"}, {"id": 29, "name": "Chickpeas"},
        {"id": 30, "name": "Coffee_or_Tea_Kahve_Cay"}, {"id": 31, "name": "Cookies"},
        {"id": 32, "name": "Corn"}, {"id": 33, "name": "Crepe"},
        {"id": 34, "name": "Cucumber"}, {"id": 35, "name": "Doner_Et_Tavuk"},
        {"id": 36, "name": "Eggplant"}, {"id": 37, "name": "Et_Sote"},
        {"id": 38, "name": "French_Fries_Patates_Kizartmasi"}, {"id": 39, "name": "Fried_Eggs"},
        {"id": 40, "name": "Fried_Fish_Hamsi_Tava"}, {"id": 41, "name": "Fruits_Mixed"},
        {"id": 42, "name": "Granola"}, {"id": 43, "name": "Grapes"},
        {"id": 44, "name": "Green_Beans"}, {"id": 45, "name": "Herbs"},
        {"id": 46, "name": "Hummus"}, {"id": 47, "name": "Ice_Cream"},
        {"id": 48, "name": "Iskender_Et_Tavuk"}, {"id": 49, "name": "Juice"},
        {"id": 50, "name": "Kabak_Mucver"}, {"id": 51, "name": "Kabak_Tatlisi_Pumpkin_Dessert"},
        {"id": 52, "name": "Kofte_Meatball"}, {"id": 53, "name": "Kunefe"},
        {"id": 54, "name": "Lahmacun"}, {"id": 55, "name": "Lentil_Bulgur_Patties_Mercimek_Cig_Kofte"},
        {"id": 56, "name": "Lemon"}, {"id": 57, "name": "Mandarin"},
        {"id": 58, "name": "Mango"}, {"id": 59, "name": "Mashed_Potato"},
        {"id": 60, "name": "Melon"}, {"id": 61, "name": "Menemen"},
        {"id": 62, "name": "Mussels_Midye"}, {"id": 63, "name": "Mushrooms"},
        {"id": 64, "name": "Nuts_Mixed"}, {"id": 65, "name": "Onion"},
        {"id": 66, "name": "Orange"}, {"id": 67, "name": "Pasta_Makarna"},
        {"id": 68, "name": "Peanut"}, {"id": 69, "name": "Pear"},
        {"id": 70, "name": "Peas"}, {"id": 71, "name": "Pecan"},
        {"id": 72, "name": "Pide"}, {"id": 73, "name": "Pineapple"},
        {"id": 74, "name": "Pizza"}, {"id": 75, "name": "Porridge"},
        {"id": 76, "name": "Potatoes"}, {"id": 77, "name": "Pudding"},
        {"id": 78, "name": "Pumpkin"}, {"id": 79, "name": "Radish"},
        {"id": 80, "name": "Raspberry"}, {"id": 81, "name": "Rice_Bulgur_Pilaf"},
        {"id": 82, "name": "Salad_Salata"}, {"id": 83, "name": "Sandwich"},
        {"id": 84, "name": "Sausages"}, {"id": 85, "name": "Semolina_Dessert_Irmik_Tatlisi"},
        {"id": 86, "name": "Soup_Corba"}, {"id": 87, "name": "Spinach_Ispanak"},
        {"id": 88, "name": "Stuffed_Dishes_Dolma"}, {"id": 89, "name": "Strawberry"},
        {"id": 90, "name": "Suffle"}, {"id": 91, "name": "Sutlac_Rice_Pudding"},
        {"id": 92, "name": "Sweet_Potatoes"}, {"id": 93, "name": "Tantuni"},
        {"id": 94, "name": "Tomato"}, {"id": 95, "name": "Waffles"},
        {"id": 96, "name": "Walnut"}, {"id": 97, "name": "Watermelon"},
        {"id": 98, "name": "Zucchini"}
    ]

    # Adım 2: Eski kategori ID'lerini yeni kategori ID'lerine eşle
    # None değeri, bu kategorinin ve ilgili annotation'ların silineceği anlamına gelir.
    old_to_new_id_map = {
        0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 8, 8: 10, 9: 11, 10: 12, 11: 13, 12: 14, 13: 15,
        14: 16, 15: None, 16: 17, 17: 18, 18: 19, 19: 21, 20: None, 21: 23, 22: 24, 23: None, 24: 25,
        25: 26, 26: None, 27: 27, 28: 29, 29: None, 30: 36, 31: None, 32: None, 33: 98, 34: 31, 35: 32,
        36: 33, 37: 34, 38: 52, 39: None, 40: 39, 41: 36, 42: 40, 43: None, 44: 39, 45: 40, 46: None,
        47: 41, 48: 42, 49: 43, 50: 44, 51: 45, 52: 46, 53: 47, 54: None, 55: 49, 56: None, 57: None,
        58: None, 59: 56, 60: 57, 61: 58, 62: 59, 63: None, 64: 60, 65: None, 66: 64, 67: 63, 68: 65,
        69: 66, 70: 67, 71: None, 72: 68, 73: 69, 74: 70, 75: 71, 76: None, 77: None, 78: None, 79: 73,
        80: 74, 81: 81, 82: 75, 83: 76, 84: 78, 85: 79, 86: 80, 87: 81, 88: 82, 89: 82, 90: 82, 91: 82,
        92: 83, 93: 84, 94: 62, 95: None, 96: None, 97: None, 98: None, 99: 86, 100: None, 101: 87,
        102: 89, 103: None, 104: 92, 105: 94, 106: None, 107: None, 108: None, 109: 95, 110: 96,
        111: 97, 112: 98, 113: None, 114: 0, 115: 7, 116: 9, 117: 88, 118: 81, 119: 20, 120: 30,
        121: 28, 122: 55, 123: 86, 124: 17, 125: 93, 126: 93, 127: 35, 128: 48, 129: 37, 130: 40,
        131: 87, 132: 50, 133: 72, 134: 72, 135: 72, 136: 53, 137: 72, 138: 54, 139: 67, 140: 61,
        141: 55, 142: 86, 143: 62, 144: 62, 145: 88, 146: 38, 147: None, 148: 74, 149: 82, 150: 86,
        151: 90, 152: 91, 153: 86, 154: 35, 155: 48, 156: 86, 157: 81, 158: 22, 159: 9, 160: 3, 161: None,
        162: None, 163: 86, 164: 85, 165: 87, 166: 87, 167: 52, 168: 51, 169: 52, 170: 77
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
    base_dir = r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged_fixed'  
    splits = ['train', 'test', 'valid']

    for split in splits:
        original_json = os.path.join(base_dir, split, '_annotations.coco.json')
        new_json = os.path.join(base_dir, split, '_annotations.coco.json')
        clean_coco_categories(original_json, new_json)