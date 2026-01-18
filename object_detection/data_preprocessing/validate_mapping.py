import json
from group_remove_categories import old_to_new_id_map

# new_categories'i de al
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
    {"id": 57, "name": "Spinach"},
    {"id": 58, "name": "Cake"},
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
    {"id": 86, "name": "Pasta"},
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
    {"id": 99, "name": "Salad"},
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
    {"id": 116, "name": "Cookies"},
    {"id": 117, "name": "Pickled_Cabbage"},
    {"id": 118, "name": "Pickled_Squash"},
    {"id": 119, "name": "Pie"},
]

# ID'leri dictionary'ye çevir
id_to_name = {cat["id"]: cat["name"] for cat in new_categories}

print("MAPPING VALIDATION RAPORU")
print("=" * 50)

invalid_mappings = []
for old_id, new_id in old_to_new_id_map.items():
    if new_id is not None and new_id not in id_to_name:
        invalid_mappings.append((old_id, new_id))

if invalid_mappings:
    print(f"\n❌ GEÇERSIZ MAPPINGLER ({len(invalid_mappings)}):")
    print("-" * 30)
    for old_id, new_id in invalid_mappings:
        print(f"  {old_id} → {new_id} (ID {new_id} mevcut değil!)")
else:
    print("\n✅ TÜM MAPPINGLER GEÇERLI!")

print(f"\nToplam kategori sayısı: {len(new_categories)}")
print(f"En yüksek ID: {max(id_to_name.keys())}")
print(f"ID aralığı: 0-{max(id_to_name.keys())}")

# Eksik ID'leri kontrol et
all_ids = set(range(0, max(id_to_name.keys()) + 1))
existing_ids = set(id_to_name.keys())
missing_ids = all_ids - existing_ids

if missing_ids:
    print(f"\n⚠️  EKSIK ID'LER: {sorted(missing_ids)}")
else:
    print(f"\n✅ ID SIRALAMASI TAMAM!")