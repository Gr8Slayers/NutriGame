#!/usr/bin/env python3
"""
Birleştirilmiş COCO dataset için resim varlığı ve bbox doğrulama
"""
import json
import os
from pathlib import Path
from collections import Counter


def validate_merged_dataset(json_path, image_dirs):
    """Birleştirilmiş dataseti doğrular"""
    
    print("🔍 BİRLEŞTİRİLMİŞ DATASET DOĞRULAMA")
    print("=" * 50)
    
    # JSON dosyasını yükle
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    images = data.get('images', [])
    annotations = data.get('annotations', [])
    categories = data.get('categories', [])
    
    print(f"📊 Dataset İçeriği:")
    print(f"   📷 {len(images):,} resim")
    print(f"   📋 {len(annotations):,} annotation")
    print(f"   🏷️  {len(categories)} kategori")
    
    # 1. RESIM VARLIĞI KONTROLÜ
    print(f"\n📁 RESİM VARLIĞI KONTROLÜ")
    print("-" * 30)
    
    missing_images = []
    existing_images = []
    total_checked = 0
    
    for img_info in images:
        filename = img_info['file_name']
        found = False
        
        # Tüm image_dirs'de ara
        for img_dir in image_dirs:
            img_path = Path(img_dir) / filename
            if img_path.exists():
                existing_images.append({
                    'info': img_info,
                    'path': str(img_path)
                })
                found = True
                break
        
        if not found:
            missing_images.append(filename)
        
        total_checked += 1
        if total_checked % 5000 == 0:
            print(f"   Kontrol edildi: {total_checked:,}/{len(images):,}")
    
    print(f" Bulunan resimler: {len(existing_images):,}")
    print(f" Eksik resimler: {len(missing_images):,}")
    
    if missing_images:
        print(f"\nİlk 10 eksik dosya:")
        for i, filename in enumerate(missing_images[:10]):
            print(f"   {i+1}. {filename}")
        if len(missing_images) > 10:
            print(f"   ... ve {len(missing_images) - 10} tane daha")
    
    # 2. BBOX DOĞRULAMA
    print(f"\n BBOX DOĞRULAMA")
    print("-" * 20)
    
    # Image ID mapping oluştur
    image_id_to_info = {img['id']: img for img in images}
    
    bbox_errors = []
    coordinate_errors = []
    negative_errors = []
    out_of_bounds_errors = []
    
    processed_annotations = 0
    
    for ann in annotations:
        bbox = ann.get('bbox')
        if not bbox or len(bbox) != 4:
            bbox_errors.append({
                'ann_id': ann.get('id'),
                'image_id': ann.get('image_id'),
                'error': 'Invalid bbox format'
            })
            continue
        
        x, y, w, h = bbox
        image_id = ann['image_id']
        img_info = image_id_to_info.get(image_id)
        
        # Negatif değer kontrolü
        if x < 0 or y < 0 or w <= 0 or h <= 0:
            negative_errors.append({
                'ann_id': ann.get('id'),
                'image_id': image_id,
                'bbox': bbox,
                'filename': img_info['file_name'] if img_info else 'unknown'
            })
        
        # Sınır dışı kontrol (eğer resim boyutları varsa)
        if img_info:
            img_width = img_info.get('width', 0)
            img_height = img_info.get('height', 0)
            
            if img_width > 0 and img_height > 0:
                if (x + w > img_width or y + h > img_height or 
                    x >= img_width or y >= img_height):
                    out_of_bounds_errors.append({
                        'ann_id': ann.get('id'),
                        'image_id': image_id,
                        'bbox': bbox,
                        'image_size': (img_width, img_height),
                        'filename': img_info['file_name']
                    })
        
        processed_annotations += 1
        if processed_annotations % 10000 == 0:
            print(f"    İşlendi: {processed_annotations:,}/{len(annotations):,}")
    
    print(f" Geçerli bbox'lar: {len(annotations) - len(bbox_errors) - len(negative_errors) - len(out_of_bounds_errors):,}")
    print(f" Format hataları: {len(bbox_errors):,}")
    print(f" Negatif koordinatlar: {len(negative_errors):,}")
    print(f" Sınır dışı bbox'lar: {len(out_of_bounds_errors):,}")
    
    # 3. KATEGORİ ANALİZİ
    print(f"\n  KATEGORİ ANALİZİ")
    print("-" * 20)
    
    category_counts = Counter()
    for ann in annotations:
        category_counts[ann['category_id']] += 1
    
    category_names = {cat['id']: cat['name'] for cat in categories}
    
    print(f"En çok annotation olan 10 kategori:")
    for cat_id, count in category_counts.most_common(10):
        cat_name = category_names.get(cat_id, f'Unknown_{cat_id}')
        print(f"   {cat_name}: {count:,}")
    
    print(f"\nEn az annotation olan 10 kategori:")
    for cat_id, count in category_counts.most_common()[-10:]:
        cat_name = category_names.get(cat_id, f'Unknown_{cat_id}')
        print(f"   {cat_name}: {count}")
    
    # Az örnekli kategoriler
    low_sample_categories = [(cat_id, count) for cat_id, count in category_counts.items() if count < 10]
    print(f"\n  10'dan az örnekli kategoriler: {len(low_sample_categories)}")
    
    if low_sample_categories:
        for cat_id, count in low_sample_categories:
            cat_name = category_names.get(cat_id, f'Unknown_{cat_id}')
            print(f"   {cat_name}: {count}")
    
    # 4. ÖZET VE ÖNERİLER
    print(f"\n ÖZET")
    print("=" * 20)
    
    total_errors = len(missing_images) + len(bbox_errors) + len(negative_errors) + len(out_of_bounds_errors)
    
    print(f"Toplam resim: {len(images):,}")
    print(f"Mevcut resimler: {len(existing_images):,}")
    print(f"Eksik resimler: {len(missing_images):,}")
    print(f"Toplam annotation: {len(annotations):,}")
    print(f"Bbox hataları: {len(bbox_errors) + len(negative_errors) + len(out_of_bounds_errors):,}")
    print(f"Az örnekli kategoriler: {len(low_sample_categories)}")
    print(f"Genel durum: {' TEMİZ' if total_errors == 0 else '  TEMİZLENMELİ'}")
    
    return {
        'missing_images': missing_images,
        'bbox_errors': bbox_errors + negative_errors + out_of_bounds_errors,
        'low_sample_categories': low_sample_categories,
        'category_counts': category_counts,
        'total_errors': total_errors
    }


if __name__ == "__main__":
    # Birleştirilmiş dataset dosyası
    json_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\all_data_merged.json"
    
    # Resim klasörleri (sırayla kontrol edilir)
    image_dirs = [
        r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\train",
        r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\valid",
        r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\test"
    ]
    
    result = validate_merged_dataset(json_path, image_dirs)