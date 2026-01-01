"""
ESKİ JSON'dan doğru kategori mapping'i oluştur
"""
import json

old_train = json.load(open(r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\_train.json'))

# Eski kategorileri al (171 kategori)
old_cats = {c['id']: c['name'] for c in old_train['categories']}

# Yeni kategori listesi (99 kategori - group_remove_categories.py'deki liste)
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

new_cat_by_name = {c['name']: c['id'] for c in new_categories}

print("ESKİ → YENİ Kategori Mapping:")
print("="*80)
print()

# Mapping oluştur
old_to_new_map = {}
unmapped = []

for old_id, old_name in sorted(old_cats.items()):
    # İsim temizleme (case insensitive, tire/underscore)
    clean_old = old_name.replace('-', '_').replace(' ', '_')
    
    # Yeni kategori listesinde ara
    found = False
    for new_name, new_id in new_cat_by_name.items():
        clean_new = new_name.replace('-', '_').replace(' ', '_')
        
        if clean_old.lower() == clean_new.lower():
            old_to_new_map[old_id] = new_id
            print(f"{old_id:3d} → {new_id:2d}  |  {old_name:<40} → {new_name}")
            found = True
            break
    
    if not found:
        old_to_new_map[old_id] = None
        unmapped.append((old_id, old_name))

print("\n" + "="*80)
print(f"\n✅ Eşleşen: {len([v for v in old_to_new_map.values() if v is not None])}")
print(f"❌ Silinecek: {len(unmapped)}")

if unmapped:
    print(f"\n⚠️  Silinecek Kategoriler:")
    for old_id, old_name in unmapped[:20]:
        print(f"  {old_id:3d}: {old_name}")
    if len(unmapped) > 20:
        print(f"  ... ve {len(unmapped) - 20} tane daha")

# Python dictionary formatında yazdır
print("\n" + "="*80)
print("\nKullanılacak Mapping (Python):")
print("="*80)
print()
print("old_to_new_id_map = {")
items = list(old_to_new_map.items())
for i in range(0, len(items), 10):
    chunk = items[i:i+10]
    line = ", ".join([f"{k}: {v}" for k, v in chunk])
    print(f"    {line},")
print("}")
