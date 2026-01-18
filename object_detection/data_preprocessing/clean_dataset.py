#!/usr/bin/env python3
"""
COCO dataset temizleme - eksik resimler, bbox hataları ve az örnekli kategoriler
"""
import json
import os
from pathlib import Path
from collections import Counter


def clean_coco_dataset(json_path, image_dirs, output_path, min_samples_per_category=10):
    """Dataset temizleme işlemi"""
    
    print("🧹 COCO DATASET TEMİZLEME")
    print("=" * 40)
    print(f"📂 Input: {json_path}")
    print(f"📤 Output: {output_path}")
    print(f"📊 Min kategori örnek sayısı: {min_samples_per_category}")
    print("-" * 40)
    
    # JSON yükle
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_images = data.get('images', [])
    original_annotations = data.get('annotations', [])
    original_categories = data.get('categories', [])
    
    print(f"🔢 BAŞLANGIÇ:")
    print(f"   📷 {len(original_images):,} resim")
    print(f"   📋 {len(original_annotations):,} annotation")  
    print(f"   🏷️  {len(original_categories)} kategori")
    
    # 1. EKSİK RESİMLERİ BULMA
    print(f"\n1️⃣  EKSİK RESİMLER BULUNUYOR...")
    
    existing_images = []
    missing_image_ids = set()
    
    for img_info in original_images:
        filename = img_info['file_name']
        found = False
        
        # Resim dosyası var mı kontrol et
        for img_dir in image_dirs:
            img_path = Path(img_dir) / filename
            if img_path.exists():
                existing_images.append(img_info)
                found = True
                break
        
        if not found:
            missing_image_ids.add(img_info['id'])
    
    print(f"   ✅ Bulunan resimler: {len(existing_images):,}")
    print(f"   ❌ Eksik resimler: {len(missing_image_ids):,}")
    
    # 2. EKSİK RESİMLERE AİT ANNOTASYONLARI ÇIKARMA
    print(f"\n2️⃣  EKSİK RESİM ANNOTASYONLARI ÇIKARILIYOR...")
    
    valid_annotations = []
    removed_for_missing_images = 0
    
    for ann in original_annotations:
        if ann['image_id'] not in missing_image_ids:
            valid_annotations.append(ann)
        else:
            removed_for_missing_images += 1
    
    print(f"   ❌ Eksik resim nedeniyle çıkarılan: {removed_for_missing_images:,}")
    print(f"   ✅ Kalan annotations: {len(valid_annotations):,}")
    
    # 3. BBOX HATALARINI DÜZELTİP ÇIKARMA
    print(f"\n3️⃣  BBOX HATALARI DÜZELTİLİYOR...")
    
    # Image ID mapping
    image_id_to_info = {img['id']: img for img in existing_images}
    
    clean_annotations = []
    bbox_errors_removed = 0
    bbox_errors_fixed = 0
    
    for ann in valid_annotations:
        bbox = ann.get('bbox')
        if not bbox or len(bbox) != 4:
            bbox_errors_removed += 1
            continue
        
        x, y, w, h = bbox
        image_id = ann['image_id']
        img_info = image_id_to_info.get(image_id)
        
        if not img_info:
            bbox_errors_removed += 1
            continue
        
        img_width = img_info.get('width', 0)
        img_height = img_info.get('height', 0)
        
        # Negatif değer düzeltme
        original_bbox = [x, y, w, h]
        fixed = False
        
        if x < 0:
            w = w + x  # width'i azalt
            x = 0
            fixed = True
        
        if y < 0:
            h = h + y  # height'i azalt 
            y = 0
            fixed = True
        
        if w <= 0 or h <= 0:
            bbox_errors_removed += 1
            continue
        
        # Sınır kontrolü ve düzeltme
        if img_width > 0 and img_height > 0:
            if x >= img_width or y >= img_height:
                bbox_errors_removed += 1
                continue
            
            if x + w > img_width:
                w = img_width - x
                fixed = True
            
            if y + h > img_height:
                h = img_height - y
                fixed = True
            
            if w <= 0 or h <= 0:
                bbox_errors_removed += 1
                continue
        
        # Düzeltilmiş annotation'ı ekle
        if fixed:
            bbox_errors_fixed += 1
            
        ann['bbox'] = [x, y, w, h]
        clean_annotations.append(ann)
    
    print(f"   🔧 Düzeltilen bbox'lar: {bbox_errors_fixed:,}")
    print(f"   ❌ Çıkarılan bbox hataları: {bbox_errors_removed:,}")
    print(f"   ✅ Temiz annotations: {len(clean_annotations):,}")
    
    # 4. KATEGORİ ANALİZİ VE TEMİZLEME
    print(f"\n4️⃣  KATEGORİ TEMİZLEME...")
    
    # Annotation sayıları
    category_counts = Counter()
    for ann in clean_annotations:
        category_counts[ann['category_id']] += 1
    
    # Az örnekli kategorileri bul
    low_sample_categories = set()
    valid_categories = []
    
    category_names = {cat['id']: cat['name'] for cat in original_categories}
    
    for cat in original_categories:
        cat_id = cat['id']
        count = category_counts.get(cat_id, 0)
        
        if count < min_samples_per_category:
            low_sample_categories.add(cat_id)
            print(f"   ❌ Çıkarılıyor: {category_names[cat_id]} ({count} örnek)")
        else:
            valid_categories.append(cat)
    
    print(f"   🏷️  Kalan kategoriler: {len(valid_categories)}")
    print(f"   ❌ Çıkarılan kategoriler: {len(low_sample_categories)}")
    
    # Az örnekli kategorilere ait annotasyonları çıkar
    final_annotations = []
    removed_for_low_samples = 0
    
    for ann in clean_annotations:
        if ann['category_id'] not in low_sample_categories:
            final_annotations.append(ann)
        else:
            removed_for_low_samples += 1
    
    print(f"   ❌ Az örnek nedeniyle çıkarılan annotations: {removed_for_low_samples:,}")
    
    # 5. KULLANILMAYAN RESİMLERİ ÇIKARMA
    print(f"\n5️⃣  KULLANILMAYAN RESİMLER ÇIKARILIYOR...")
    
    # Hangi resimler kullanılıyor
    used_image_ids = set(ann['image_id'] for ann in final_annotations)
    
    final_images = []
    removed_unused_images = 0
    
    for img in existing_images:
        if img['id'] in used_image_ids:
            final_images.append(img)
        else:
            removed_unused_images += 1
    
    print(f"   ❌ Kullanılmayan resimler: {removed_unused_images:,}")
    print(f"   ✅ Kullanılan resimler: {len(final_images):,}")
    
    # 6. SON HALİNİ KAYDETME
    print(f"\n6️⃣  TEMİZ DATASET KAYDEDILIYOR...")
    
    clean_data = {
        'images': final_images,
        'annotations': final_annotations,
        'categories': valid_categories,
        'info': {
            'description': 'Cleaned COCO dataset for NutriGame',
            'version': '1.0_cleaned',
            'contributor': 'NutriGame',
            'date_created': '2026-01-18',
            'cleaning_stats': {
                'original_images': len(original_images),
                'original_annotations': len(original_annotations),
                'original_categories': len(original_categories),
                'removed_missing_images': len(missing_image_ids),
                'removed_bbox_errors': bbox_errors_removed,
                'fixed_bbox_errors': bbox_errors_fixed,
                'removed_low_sample_categories': len(low_sample_categories),
                'removed_annotations_total': len(original_annotations) - len(final_annotations)
            }
        }
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(clean_data, f, indent=2, ensure_ascii=False)
    
    # ÖZET
    print(f"\n📋 TEMİZLEME ÖZETİ")
    print("=" * 30)
    print(f"📷 Resim: {len(original_images):,} → {len(final_images):,} (-%{((len(original_images) - len(final_images)) / len(original_images) * 100):.1f})")
    print(f"📋 Annotation: {len(original_annotations):,} → {len(final_annotations):,} (-%{((len(original_annotations) - len(final_annotations)) / len(original_annotations) * 100):.1f})")
    print(f"🏷️  Kategori: {len(original_categories)} → {len(valid_categories)} (-%{((len(original_categories) - len(valid_categories)) / len(original_categories) * 100):.1f})")
    print(f"💾 Kayıt: {output_path}")
    print(f"✅ Temizleme tamamlandı!")
    
    return clean_data


if __name__ == "__main__":
    json_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\all_data_merged.json"
    output_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\data_preprocessing\clean_dataset.json"
    
    image_dirs = [
        r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\train",
        r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\valid", 
        r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\test"
    ]
    
    clean_data = clean_coco_dataset(json_path, image_dirs, output_path, min_samples_per_category=15)