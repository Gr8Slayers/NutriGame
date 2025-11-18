import os
import json


def add_supercategory_to_coco(json_path, supercategory_name="none"):
    """COCO veri setine supercategory alanı ekle"""
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(json_path)}")
    print(f"{'='*60}\n")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    for category in data['categories']:
        category['supercategory'] = supercategory_name
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(f"Added supercategory '{supercategory_name}' to all categories in {os.path.basename(json_path)}\n")


if __name__ == "__main__":
    base_dir = r"D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged_fixed"
    splits = ['train', 'test', 'valid']

    for split in splits:
        json_path = os.path.join(base_dir, split, '_annotations.coco.json')
        if os.path.exists(json_path):
            add_supercategory_to_coco(json_path, supercategory_name="none")
        else:
            print(f"⚠️  Dosya bulunamadı: {json_path}")