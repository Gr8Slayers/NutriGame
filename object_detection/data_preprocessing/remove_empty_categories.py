#!/usr/bin/env python3
"""
Empty ve düşük sample kategorileri kaldıran script.
"""

import json
import argparse
from collections import defaultdict
from pathlib import Path

def load_coco_dataset(json_path):
    """COCO formatındaki dataset'i yükle"""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_coco_dataset(data, json_path):
    """COCO formatındaki dataset'i kaydet"""
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def count_annotations_per_category(annotations):
    """Her kategori için annotation sayısını hesapla"""
    category_counts = defaultdict(int)
    for ann in annotations:
        category_counts[ann['category_id']] += 1
    return category_counts

def filter_categories_and_annotations(data, min_samples=50):
    """Minimum sample sayısından az olan kategorileri ve annotationları filtrele"""
    
    # Annotation sayılarını hesapla
    category_counts = count_annotations_per_category(data['annotations'])
    
    print(f"Orijinal kategori sayısı: {len(data['categories'])}")
    print(f"Orijinal annotation sayısı: {len(data['annotations'])}")
    
    # Silinecek kategorileri belirle
    categories_to_remove = []
    categories_to_keep = []
    
    for cat in data['categories']:
        count = category_counts[cat['id']]
        if count < min_samples:
            categories_to_remove.append(cat['id'])
            print(f"Siliniyor: ID={cat['id']}, Name={cat['name']}, Count={count}")
        else:
            categories_to_keep.append(cat)
    
    print(f"\nSilinecek kategori sayısı: {len(categories_to_remove)}")
    print(f"Kalacak kategori sayısı: {len(categories_to_keep)}")
    
    # Kategorileri filtrele
    data['categories'] = categories_to_keep
    
    # ID'leri yeniden mapple (0'dan başlayacak şekilde)
    old_to_new_id = {}
    for new_id, cat in enumerate(categories_to_keep):
        old_to_new_id[cat['id']] = new_id
        cat['id'] = new_id
    
    # Annotationları filtrele ve ID'leri güncelle
    filtered_annotations = []
    removed_annotations = 0
    
    for ann in data['annotations']:
        old_cat_id = ann['category_id']
        if old_cat_id in categories_to_remove:
            removed_annotations += 1
        else:
            ann['category_id'] = old_to_new_id[old_cat_id]
            filtered_annotations.append(ann)
    
    data['annotations'] = filtered_annotations
    
    print(f"Silinen annotation sayısı: {removed_annotations}")
    print(f"Kalan annotation sayısı: {len(filtered_annotations)}")
    
    # Silinecek resimleri tespit et (artık annotation'ı olmayan resimler)
    image_has_annotation = set()
    for ann in filtered_annotations:
        image_has_annotation.add(ann['image_id'])
    
    # Resimleri filtrele
    original_image_count = len(data['images'])
    data['images'] = [img for img in data['images'] if img['id'] in image_has_annotation]
    removed_images = original_image_count - len(data['images'])
    
    print(f"Silinen resim sayısı: {removed_images}")
    print(f"Kalan resim sayısı: {len(data['images'])}")
    
    # Info'yu güncelle
    if 'info' in data:
        if 'cleaning_stats' not in data['info']:
            data['info']['cleaning_stats'] = {}
        
        data['info']['cleaning_stats'].update({
            'removed_empty_categories': len(categories_to_remove),
            'removed_annotations_empty': removed_annotations,
            'removed_images_empty': removed_images,
            'final_categories': len(data['categories']),
            'final_annotations': len(data['annotations']),
            'final_images': len(data['images']),
            'min_samples_threshold': min_samples
        })
    
    return data

def main():
    parser = argparse.ArgumentParser(description='Empty ve düşük sample kategorileri kaldır')
    parser.add_argument('--input', type=str, required=True, help='Input COCO JSON file')
    parser.add_argument('--output', type=str, help='Output COCO JSON file (default: overwrites input)')
    parser.add_argument('--min-samples', type=int, default=50, help='Minimum sample sayısı (default: 50)')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else input_path
    
    print(f"Loading dataset from: {input_path}")
    data = load_coco_dataset(input_path)
    
    print(f"Minimum sample threshold: {args.min_samples}")
    data = filter_categories_and_annotations(data, args.min_samples)
    
    print(f"Saving cleaned dataset to: {output_path}")
    save_coco_dataset(data, output_path)
    
    print("✅ Dataset cleaning completed!")

if __name__ == '__main__':
    main()