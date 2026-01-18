import json

# Clean dataset'teki kategorileri listele
with open(r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\clean_dataset.json','r') as f:
    data = json.load(f)

print(f'Toplam kategoriler: {len(data["categories"])}')
cats = sorted([cat['name'] for cat in data['categories']])
for i, cat in enumerate(cats):
    print(f'{i+1:3d}. {cat}')