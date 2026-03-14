"""
CAFSD 239 sinif ID -> Mevcut data.yaml 90 sinif ID mapping olustur.
Sonucu cafsd_id_mapping.json olarak kaydeder.
Kaydedilen JSON, add_cafsd_to_dataset.py tarafindan kullanilir.
"""

import json
from pathlib import Path

CAFSD_NAMES = [
    'achichuk', 'airan-katyk', 'almond', 'apple', 'apricot', 'artichoke',
    'arugula', 'asip', 'asparagus', 'avocado', 'bacon', 'baklava', 'banana',
    'basil', 'bauyrsak', 'bean soup', 'beans', 'beef shashlyk',
    'beef shashlyk-v', 'beer', 'beet', 'bell pepper', 'beshbarmak',
    'beverages', 'black olives', 'blackberry', 'blueberry', 'boiled chicken',
    'boiled eggs', 'boiled meat', 'borsch', 'bread', 'brizol', 'broccoli',
    'buckwheat', 'butter', 'cabbage', 'cakes', 'carrot', 'cashew',
    'casserole with meat and vegetables', 'cauliflower', 'caviar', 'celery',
    'cereal based cooked food', 'chak-chak', 'cheburek', 'cheese',
    'cheese souce', 'cherry', 'chestnuts', 'chicken shashlyk',
    'chicken shashlyk-v', 'chickpeas', 'chili pepper', 'chips', 'chocolate',
    'chocolate paste', 'cinnabons', 'coffee', 'condensed milk',
    'cooked eggplant', 'cooked food based on meat',
    'cooked food meat with vegetables', 'cooked tomatoes', 'cooked zucchini',
    'cookies', 'corn', 'corn flakes', 'crepe', 'crepe w filling', 'croissant',
    'croissant sandwich', 'cucumber', 'cutlet', 'dates', 'desserts', 'dill',
    'doner-lavash', 'doner-nan', 'dragon fruit', 'dried fruits', 'egg product',
    'eggplant', 'figs', 'fish', 'french fries', 'fried cheese',
    'fried chicken', 'fried eggs', 'fried fish', 'fried meat', 'fruits',
    'garlic', 'granola', 'grapefruit', 'grapes', 'green beans', 'green olives',
    'hachapuri', 'hamburger', 'hazelnut', 'herbs', 'hinkali', 'honey',
    'hot dog', 'hummus', 'hvorost', 'ice-cream', 'irimshik', 'jam', 'juice',
    'karta', 'kattama-nan', 'kazy-karta', 'ketchup', 'kiwi', 'kurt',
    'kuyrdak', 'kymyz-kymyran', 'lagman-fried', 'lagman-w-soup', 'lavash',
    'legumes', 'lemon', 'lime', 'mandarin', 'mango', 'manty', 'mashed potato',
    'mayonnaise', 'meat based soup', 'meat product', 'melon', 'milk',
    'minced meat shashlyk', 'mint', 'mixed berries', 'mixed nuts', 'muffin',
    'mushrooms', 'naryn', 'nauryz-kozhe', 'noodles soup', 'nuggets', 'oil',
    'okra', 'okroshka', 'olivie', 'onion', 'onion rings', 'orama', 'orange',
    'pancakes', 'parsley', 'pasta', 'pastry', 'peach', 'peanut', 'pear',
    'peas', 'pecan', 'persimmon', 'pickled cabbage', 'pickled cucumber',
    'pickled ginger', 'pickled squash', 'pie', 'pineapple', 'pistachio',
    'pizza', 'plov', 'plum', 'pomegranate', 'porridge', 'potatoes', 'pumpkin',
    'pumpkin seeds', 'quince', 'radish', 'raspberry', 'redcurrant', 'ribs',
    'rice', 'rosemary', 'salad fresh', 'salad leaves',
    'salad with fried meat veggie', 'salad with sauce', 'samsa', 'sandwich',
    'sausages', 'scallion', 'seafood', 'seafood soup', 'sheep-head', 'shelpek',
    'shorpa', 'shorpa chicken', 'smetana', 'smoked fish', 'snacks',
    'snacks bread', 'soda', 'souces', 'soup-plain', 'soy souce', 'spinach',
    'spirits', 'strawberry', 'sugar', 'sushi', 'sushi fish', 'sushi nori',
    'sushki', 'suzbe', 'sweets', 'syrniki', 'taba-nan', 'talkan-zhent',
    'tartar', 'tea', 'tomato', 'tomato souce', 'tomato-cucumber-salad',
    'tushpara-fried', 'tushpara-w-soup', 'tushpara-wo-soup', 'vareniki',
    'vegetable based cooked food', 'vegetable soup', 'waffles', 'walnut',
    'wasabi', 'water', 'watermelon', 'wine', 'wings', 'zucchini',
]

EXISTING_NAMES = [
    'Adana_Kebap', 'Almond', 'Ankara_Tava', 'Apple', 'Asparagus', 'Avocado',
    'Ayran', 'Bacon', 'Baklava', 'Banana', 'Beans', 'Bell_Pepper',
    'Biber_Dolmasi', 'Black_Olives', 'Blackberry', 'Bread', 'Broccoli',
    'Bulgur_Pilavi', 'Burger', 'Cabbage', 'Cacik', 'Carrot', 'Cauliflower',
    'Cheese', 'Cheesecake', 'Chips', 'Cig_Kofte', 'Corn', 'Cucumber',
    'Doner_Et', 'Doner_Tavuk', 'Domates_Corbasi', 'Et_Sote', 'Etli_Turlu',
    'Ezogelin_Corba', 'Fish', 'Fried_Chicken', 'Fried_Eggs', 'Fried_Meat',
    'Grapes', 'Green_Beans', 'Irmik_Tatlisi', 'Iskender_Et', 'Iskender_Tavuk',
    'Spinach', 'Izmir_Kofte', 'Kabak_Mucver', 'Kabak_Tatlisi',
    'Kadinbudu_Kofte', 'Kasarli_Pide', 'Kir_Pidesi', 'Kiwi', 'Kiymali_Pide',
    'Kunefe', 'Kusbasli_Pide', 'Lahmacun', 'Lemon', 'Mandarin', 'Melon',
    'Menemen', 'Mercimek_Coftesi', 'Mercimek_Corbasi', 'Midye_Dolma',
    'Midye_Tava', 'Mumbar_Dolmasi', 'Mushrooms', 'Orange', 'Pasta',
    'Patlican_Kebabi', 'Pineapple', 'Pizza', 'Porridge', 'Potatoes',
    'Raspberry', 'Rice', 'Salad', 'Sausages', 'Sehriye_Corbasi', 'Strawberry',
    'Suffle', 'Sutlac', 'Sweet_Potatoes', 'Tantuni_Et', 'Tantuni_Tavuk',
    'Tarhana_Corbasi', 'Tea', 'Tomato', 'Watermelon', 'Yayla_Corbasi',
    'Zucchini',
]
EXISTING_MAP = {name: idx for idx, name in enumerate(EXISTING_NAMES)}

# CAFSD class name -> Existing class name
CAFSD_TO_EXISTING_NAME = {
    'achichuk':                          'Salad',
    'airan-katyk':                       'Ayran',
    'almond':                            'Almond',
    'apple':                             'Apple',
    'asparagus':                         'Asparagus',
    'avocado':                           'Avocado',
    'bacon':                             'Bacon',
    'baklava':                           'Baklava',
    'banana':                            'Banana',
    'beans':                             'Beans',
    'beef shashlyk':                     'Adana_Kebap',
    'beef shashlyk-v':                   'Adana_Kebap',
    'bell pepper':                       'Bell_Pepper',
    'black olives':                      'Black_Olives',
    'blackberry':                        'Blackberry',
    'boiled chicken':                    'Fried_Chicken',
    'boiled eggs':                       'Fried_Eggs',
    'boiled meat':                       'Fried_Meat',
    'borsch':                            'Domates_Corbasi',
    'bread':                             'Bread',
    'broccoli':                          'Broccoli',
    'buckwheat':                         'Porridge',
    'cabbage':                           'Cabbage',
    'carrot':                            'Carrot',
    'casserole with meat and vegetables': 'Etli_Turlu',
    'cauliflower':                       'Cauliflower',
    'cheese':                            'Cheese',
    'chicken shashlyk':                  'Fried_Chicken',
    'chicken shashlyk-v':                'Fried_Chicken',
    'chips':                             'Chips',
    'cooked eggplant':                   'Patlican_Kebabi',
    'cooked food based on meat':         'Fried_Meat',
    'cooked food meat with vegetables':  'Etli_Turlu',
    'cooked zucchini':                   'Zucchini',
    'corn':                              'Corn',
    'croissant':                         'Bread',
    'croissant sandwich':                'Bread',
    'cucumber':                          'Cucumber',
    'cutlet':                            'Kadinbudu_Kofte',
    'doner-lavash':                      'Doner_Et',
    'doner-nan':                         'Doner_Et',
    'egg product':                       'Fried_Eggs',
    'fish':                              'Fish',
    'french fries':                      'Chips',
    'fried chicken':                     'Fried_Chicken',
    'fried eggs':                        'Fried_Eggs',
    'fried fish':                        'Fish',
    'fried meat':                        'Fried_Meat',
    'grapes':                            'Grapes',
    'green beans':                       'Green_Beans',
    'green olives':                      'Black_Olives',
    'hachapuri':                         'Kasarli_Pide',
    'hamburger':                         'Burger',
    'kiwi':                              'Kiwi',
    'lagman-fried':                      'Pasta',
    'lagman-w-soup':                     'Pasta',
    'lavash':                            'Bread',
    'lemon':                             'Lemon',
    'lime':                              'Lemon',
    'mandarin':                          'Mandarin',
    'mashed potato':                     'Potatoes',
    'melon':                             'Melon',
    'minced meat shashlyk':              'Adana_Kebap',
    'mushrooms':                         'Mushrooms',
    'noodles soup':                      'Pasta',
    'nuggets':                           'Fried_Chicken',
    'olivie':                            'Salad',
    'orange':                            'Orange',
    'pasta':                             'Pasta',
    'pineapple':                         'Pineapple',
    'pizza':                             'Pizza',
    'plov':                              'Rice',
    'porridge':                          'Porridge',
    'potatoes':                          'Potatoes',
    'raspberry':                         'Raspberry',
    'rice':                              'Rice',
    'salad fresh':                       'Salad',
    'salad leaves':                      'Salad',
    'salad with fried meat veggie':      'Salad',
    'salad with sauce':                  'Salad',
    'sausages':                          'Sausages',
    'smoked fish':                       'Fish',
    'spinach':                           'Spinach',
    'strawberry':                        'Strawberry',
    'tea':                               'Tea',
    'tomato':                            'Tomato',
    'tomato-cucumber-salad':             'Salad',
    'watermelon':                        'Watermelon',
    'wings':                             'Fried_Chicken',
    'zucchini':                          'Zucchini',
}

# ID mapping olustur
cafsd_id_to_existing_id = {}
for cafsd_id, cafsd_name in enumerate(CAFSD_NAMES):
    existing_name = CAFSD_TO_EXISTING_NAME.get(cafsd_name)
    if existing_name and existing_name in EXISTING_MAP:
        cafsd_id_to_existing_id[cafsd_id] = EXISTING_MAP[existing_name]

print(f"CAFSD maplanan sinif sayisi: {len(cafsd_id_to_existing_id)}/239")
print()
print("Ornek mappingler:")
for cid in [0, 1, 17, 60, 61, 62, 85, 171, 185]:
    name = CAFSD_NAMES[cid]
    eid = cafsd_id_to_existing_id.get(cid, 'ATILDI')
    ename = EXISTING_NAMES[eid] if isinstance(eid, int) else eid
    print(f"  CAFSD[{cid}] {name} -> Existing[{eid}] {ename}")

out_path = Path("D:/Desktop/Bitirme/NutriGame/object_detection/data_preprocessing/cafsd_id_mapping.json")
with open(out_path, 'w') as f:
    json.dump({
        'cafsd_id_to_existing_id': {str(k): v for k, v in cafsd_id_to_existing_id.items()},
        'cafsd_names': CAFSD_NAMES,
        'existing_names': EXISTING_NAMES,
    }, f, indent=2)
print(f"\nMapping kaydedildi: {out_path}")
