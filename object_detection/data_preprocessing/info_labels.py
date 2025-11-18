import json
import os

def list_category_names(json_path):
    """COCO veri setindeki kategori isimlerini listele"""
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    categories = data['categories']
    category_names = [cat['name'] for cat in categories]
    
    print(f"\n{'='*60}")
    print(f"Categories in: {os.path.basename(json_path)}")
    print(f"{'='*60}\n")
    
    for idx, name in enumerate(category_names):
        print(f"{idx}: {name}")
    
    print(f"\nToplam kategori sayısı: {len(category_names)}\n")


base_dir = r"D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged_fixed"
splits = ['train', 'test', 'val']  # 'valid' yerine 'val'

for split in splits:
    json_path = os.path.join(base_dir, split, '_annotations.coco.json')
    if os.path.exists(json_path):
        list_category_names(json_path)
    else:
        print(f"⚠️  Dosya bulunamadı: {json_path}")