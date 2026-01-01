import json

with open(r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\_train.json') as f:
    data = json.load(f)
    
cats = data['categories']
print(f'Total categories: {len(cats)}')
for c in sorted(cats, key=lambda x: x['id']):
    print(f"{c['id']:3d} | {c['name']}")
