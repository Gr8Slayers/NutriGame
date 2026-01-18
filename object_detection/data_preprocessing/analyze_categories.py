#!/usr/bin/env python3
"""
Kategori mapping kontrolu - hangi kategoriler cikarilmis, hangileri yanlis eslenmis
"""

# Cikarilan kategoriler (None mapping)
removed_categories = {
    27: "cereal based cooked food",  # PROBLEM: Kahvalti icin onemli
    40: "desserts",                 # Cok genel ama tatli kategorisi gerekli
    48: "fruits",                   # Cok genel ama meyve kategorisi gerekli
    52: "herbs",                    # Cok genel
    55: "irimshik",                # Az bilinen
    58: "lavash",                  # PROBLEM: Ekmek turu, gerekli
    59: "legumes",                 # PROBLEM: Baklagil, protein kaynagi
    64: "meat product",            # Cok genel
    66: "mixed berries",           # Karisik meyve, Grapes vs ile birlesebilir
    67: "mixed nuts",              # Karisik kuruyemis, Walnut vs ile birlesebilir
    72: "pastry",                  # PROBLEM: Hamur isi, borek vs onemli
    85: "pumpkin",                 # PROBLEM: Kabak, sebze kategorisi
    93: "sandwich",                # PROBLEM: Sandvic, fast food kategorisi
    95: "seafood",                 # Cok genel, Fish var zaten
    96: "smetana",                 # Az bilinen
    97: "snacks",                  # PROBLEM: Atistirmalik, kalori hesabinda kritik
    98: "snacks bread",            # Atistirmalik ekmek
    99: "souces",                  # Sos, kalori hesabinda onemli olabilir
    100: "soup-plain",             # Corba var zaten
    101: "soy product",            # PROBLEM: Soya urunu, protein alternatifi
    104: "suzbe",                  # Az bilinen
    107: "tomato souce",           # PROBLEM: Domates sosu, kalori hesabinda onemli
    108: "tushpara-wo-soup",       # Ozel yemek, az bilinen
    109: "vegetable based cooked food",  # Cok genel
    114: "food-Yemek",            # Cok genel
}

# Sorunlu mappingler
problematic_mappings = {
    # Ayni kategoriye eslenen farkli yemekler
    "Salad_Salata": [89, 90, 91, 92],  # 4 farkli salata turu ayni kategoride
    "Fish": [43, 46, 131],  # Fish, fried fish, hamsi tava ayni kategoride
    "Rice": [82, 88],  # plov ve rice ayni kategoride
    "Pizza": [81, 149],  # Iki kez pizza var
    "Baklava": [117, 160],  # Baklava ve cevizli baklava ayni kategoride
}

# Geri eklenmesi gerekenler
should_add_back = [
    "Lavash",      # Ekmek turu
    "Sandwich",    # Fast food
    "Pumpkin",     # Sebze
    "Snacks",      # Atistirmalik
    "Soy_Product", # Protein alternatifi
    "Tomato_Sauce", # Sos
    "Etli_Nohut",  # Turk yemegi
    "Pastry",      # Hamur isi
    "Cereal",      # Kahvalti
]

# Turkce-Ingilizce karsiliklar - birlestirilmesi gerekenler
turkish_english_duplicates = {
    "Ispanak": ["Ispanak", "spinach"],  # 57 ve 102
    "Enginar": ["enginar", "Artichoke_Enginar"],  # 4 ve 161
    "Ekmek": ["Ekmek", "Bread_Ekmek"],  # 19 ve 125
    "Makarna": ["Makarna", "Pasta_Makarna"],  # 86 ve 140
    "Salata": ["Salata", "Salad_Salata"],  # 99 ve 150
}

print("KATEGORI MAPPING KONTROL RAPORU")
print("=" * 50)

print(f"\n1. CIKARILAN KATEGORILER ({len(removed_categories)}):")
print("-" * 30)
for old_id, name in removed_categories.items():
    problem = "PROBLEM: " if old_id in [27, 58, 59, 72, 85, 93, 97, 101, 107, 162] else ""
    print(f"{old_id:>3}: {name:<30} {problem}")

print(f"\n2. SORUNLU MAPPINGLER:")
print("-" * 30)
for category, old_ids in problematic_mappings.items():
    print(f"{category}: {len(old_ids)} farkli kategori birlestirilmis -> {old_ids}")

print(f"\n3. GERI EKLENMESI GEREKENLER:")
print("-" * 30)
for i, category in enumerate(should_add_back, 1):
    print(f"{i:>2}. {category}")

print(f"\n4. TURKCE-INGILIZCE DUPLIKASYONLAR:")
print("-" * 30)
for turkish, variants in turkish_english_duplicates.items():
    print(f"{turkish}: {variants}")

print(f"\n5. ONERI:")
print("-" * 10)
print("- Cikarilan onemli kategorileri geri ekle")
print("- Turkce-Ingilizce karsiliklar icin birini secin")
print("- ID siralamasini duzenle")
print("- Toplam kategori sayisini 100 civarinda tut")