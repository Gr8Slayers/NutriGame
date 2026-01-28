#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Dataset'i train/validation/test olarak bölme scripti
grouped_dataset.json'dan stratified split yapar
"""

import json
import os
import random
from collections import defaultdict, Counter
from math import floor

def split_dataset(input_json_path, output_dir, train_ratio=0.7, val_ratio=0.2, test_ratio=0.1):
    """
    Dataset'i stratified olarak train/validation/test'e böler
    
    Args:
        input_json_path: grouped_dataset.json yolu
        output_dir: Çıktı dizini
        train_ratio: Eğitim verisi oranı (0.7)
        val_ratio: Validasyon verisi oranı (0.2) 
        test_ratio: Test verisi oranı (0.1)
    """
    
    print("="*60)
    print("DATASET SPLIT İŞLEMİ BAŞLIYOR")
    print("="*60)
    
    # JSON'u yükle
    print(f"Dataset yükleniyor: {input_json_path}")
    with open(input_json_path, 'r') as f:
        data = json.load(f)
    
    print(f"Toplam resim: {len(data['images'])}")
    print(f"Toplam annotation: {len(data['annotations'])}")
    print(f"Toplam kategori: {len(data['categories'])}")
    
    # Her kategoriden kaç annotation var?
    category_count = Counter()
    image_to_annotations = defaultdict(list)
    
    for ann in data['annotations']:
        category_count[ann['category_id']] += 1
        image_to_annotations[ann['image_id']].append(ann)
    
    print("\nKategori başına annotation dağılımı:")
    category_id_to_name = {cat['id']: cat['name'] for cat in data['categories']}
    for cat_id, count in sorted(category_count.items()):
        print(f"  {cat_id:3d} {category_id_to_name[cat_id]:20s}: {count:4d} annotations")
    
    # Resimleri kategorilere göre grupla (dominant category bazında)
    image_category_map = {}
    for image_id, annotations in image_to_annotations.items():
        # Bu resimdeki en çok hangi kategori var?
        image_categories = [ann['category_id'] for ann in annotations]
        dominant_category = Counter(image_categories).most_common(1)[0][0]
        image_category_map[image_id] = dominant_category
    
    # Her kategoriden resimleri topla
    images_by_category = defaultdict(list)
    for img in data['images']:
        if img['id'] in image_category_map:
            category = image_category_map[img['id']]
            images_by_category[category].append(img)
    
    print(f"\nKategori başına resim dağılımı:")
    for cat_id in sorted(images_by_category.keys()):
        count = len(images_by_category[cat_id])
        print(f"  {cat_id:3d} {category_id_to_name[cat_id]:20s}: {count:4d} images")
    
    # Stratified split
    train_images = []
    val_images = []
    test_images = []
    
    random.seed(42)  # Reproducible results
    
    for cat_id, images in images_by_category.items():
        random.shuffle(images)
        
        n_images = len(images)
        n_train = max(1, floor(n_images * train_ratio))
        n_val = max(1, floor(n_images * val_ratio))
        n_test = n_images - n_train - n_val
        
        if n_test < 1:
            n_test = 1
            n_val = max(1, n_images - n_train - n_test)
        
        train_images.extend(images[:n_train])
        val_images.extend(images[n_train:n_train+n_val])
        test_images.extend(images[n_train+n_val:])
        
        print(f"  {category_id_to_name[cat_id]:20s}: {n_train:3d} train, {n_val:3d} val, {n_test:3d} test")
    
    print(f"\nTOPLAM:")
    print(f"  Train: {len(train_images):4d} resim ({len(train_images)/len(data['images'])*100:.1f}%)")
    print(f"  Val:   {len(val_images):4d} resim ({len(val_images)/len(data['images'])*100:.1f}%)")
    print(f"  Test:  {len(test_images):4d} resim ({len(test_images)/len(data['images'])*100:.1f}%)")
    
    # Image ID setlerini oluştur
    train_image_ids = {img['id'] for img in train_images}
    val_image_ids = {img['id'] for img in val_images}
    test_image_ids = {img['id'] for img in test_images}
    
    # Annotation'ları böl
    train_annotations = []
    val_annotations = []
    test_annotations = []
    
    for ann in data['annotations']:
        if ann['image_id'] in train_image_ids:
            train_annotations.append(ann)
        elif ann['image_id'] in val_image_ids:
            val_annotations.append(ann)
        elif ann['image_id'] in test_image_ids:
            test_annotations.append(ann)
    
    print(f"\nAnnotation dağılımı:")
    print(f"  Train: {len(train_annotations):5d} annotations")
    print(f"  Val:   {len(val_annotations):5d} annotations")
    print(f"  Test:  {len(test_annotations):5d} annotations")
    
    # JSON dosyalarını oluştur
    base_data = {
        'info': data.get('info', {}),
        'licenses': data.get('licenses', []),
        'categories': data['categories']
    }
    
    # Train set
    train_data = base_data.copy()
    train_data['images'] = train_images
    train_data['annotations'] = train_annotations
    
    # Validation set
    val_data = base_data.copy()
    val_data['images'] = val_images
    val_data['annotations'] = val_annotations
    
    # Test set
    test_data = base_data.copy()
    test_data['images'] = test_images
    test_data['annotations'] = test_annotations
    
    # Dosyaları kaydet
    os.makedirs(output_dir, exist_ok=True)
    
    train_path = os.path.join(output_dir, 'train_split.json')
    val_path = os.path.join(output_dir, 'val_split.json')
    test_path = os.path.join(output_dir, 'test_split.json')
    
    print(f"\nDosyalar kaydediliyor:")
    
    with open(train_path, 'w') as f:
        json.dump(train_data, f, indent=2)
    print(f"  ✅ {train_path}")
    
    with open(val_path, 'w') as f:
        json.dump(val_data, f, indent=2)
    print(f"  ✅ {val_path}")
    
    with open(test_path, 'w') as f:
        json.dump(test_data, f, indent=2)
    print(f"  ✅ {test_path}")
    
    print("\n" + "="*60)
    print("DATASET SPLIT TAMAMLANDI!")
    print("="*60)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Dataset Split Tool')
    parser.add_argument('--input', type=str, required=True, help='Input JSON file')
    parser.add_argument('--output-dir', type=str, required=True, help='Output directory')
    parser.add_argument('--train-ratio', type=float, default=0.7, help='Train split ratio')
    parser.add_argument('--val-ratio', type=float, default=0.2, help='Validation split ratio')
    parser.add_argument('--test-ratio', type=float, default=0.1, help='Test split ratio')
    parser.add_argument('--output-prefix', type=str, default='', help='Output file prefix')
    
    args = parser.parse_args()
    
    # Eğer prefix varsa dosya isimlerini güncelle
    if args.output_prefix:
        old_split_dataset = split_dataset
        def new_split_dataset(input_json_path, output_dir, train_ratio=0.7, val_ratio=0.2, test_ratio=0.1):
            # Geçici olarak dataset split yap
            result = old_split_dataset(input_json_path, output_dir, train_ratio, val_ratio, test_ratio)
            
            # Dosyaları yeniden adlandır
            old_train = os.path.join(output_dir, 'train_split.json')
            old_val = os.path.join(output_dir, 'val_split.json') 
            old_test = os.path.join(output_dir, 'test_split.json')
            
            new_train = os.path.join(output_dir, f'{args.output_prefix}train_split.json')
            new_val = os.path.join(output_dir, f'{args.output_prefix}val_split.json')
            new_test = os.path.join(output_dir, f'{args.output_prefix}test_split.json')
            
            if os.path.exists(old_train):
                os.rename(old_train, new_train)
                print(f"  ✅ Renamed to: {new_train}")
            if os.path.exists(old_val):
                os.rename(old_val, new_val)
                print(f"  ✅ Renamed to: {new_val}")
            if os.path.exists(old_test):
                os.rename(old_test, new_test)
                print(f"  ✅ Renamed to: {new_test}")
                
            return result
            
        split_dataset = new_split_dataset
    
    split_dataset(args.input, args.output_dir, args.train_ratio, args.val_ratio, args.test_ratio)