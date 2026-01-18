#!/usr/bin/env python3
"""
COCO dataset tutarlılık kontrolü
"""
import json
import os
from collections import Counter
from pathlib import Path

def check_coco_consistency(data_dir):
    """COCO formatındaki train, test, valid dosyalarının tutarlılığını kontrol eder"""
    
    data_path = Path(data_dir)
    files = {
        'train': data_path / '_train.json',
        'valid': data_path / '_valid.json', 
        'test': data_path / '_test.json'
    }
    
    print("🔍 COCO Dataset Tutarlılık Kontrolü")
    print("=" * 50)
    
    # 1. Dosya varlığı kontrolü
    for split, file_path in files.items():
        if file_path.exists():
            print(f"✅ {split}: {file_path.name} ({file_path.stat().st_size // 1024} KB)")
        else:
            print(f"❌ {split}: {file_path.name} BULUNAMADI!")
            return False
    
    # JSON dosyalarını yükle
    datasets = {}
    for split, file_path in files.items():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                datasets[split] = json.load(f)
            print(f"✅ {split}.json yüklendi")
        except Exception as e:
            print(f"❌ {split}.json yüklenemedi: {e}")
            return False
    
    print("\n📊 DATASET İSTATİSTİKLERİ")
    print("-" * 30)
    
    # 2. Temel istatistikler
    all_categories = {}
    category_consistency = True
    
    for split, data in datasets.items():
        images = len(data.get('images', []))
        annotations = len(data.get('annotations', []))
        categories = len(data.get('categories', []))
        
        print(f"{split.upper():<6}: {images:>6} resim, {annotations:>6} annotation, {categories:>3} kategori")
        
        # Kategorileri topla
        split_categories = {cat['id']: cat['name'] for cat in data.get('categories', [])}
        if not all_categories:
            all_categories = split_categories
        else:
            # Kategori tutarlılığı kontrolü
            if split_categories != all_categories:
                print(f"⚠️  {split} kategorileri diğerlerinden farklı!")
                category_consistency = False
    
    # 3. Kategori tutarlılığı raporu
    print(f"\n🏷️  KATEGORI TUTARLILIĞI: {'✅ UYUMLU' if category_consistency else '❌ UYUMSUZ'}")
    print(f"Toplam Kategori: {len(all_categories)}")
    
    # 4. Annotation sayıları kategori başına
    print(f"\n📈 KATEGORİ BAŞINA ANNOTATION SAYILARI")
    print("-" * 40)
    
    category_counts = Counter()
    image_ids_per_split = {}
    
    for split, data in datasets.items():
        split_counts = Counter()
        image_ids_per_split[split] = set()
        
        for ann in data.get('annotations', []):
            category_id = ann['category_id']
            category_name = all_categories.get(category_id, f"Unknown_{category_id}")
            split_counts[category_name] += 1
            category_counts[category_name] += 1
            
        for img in data.get('images', []):
            image_ids_per_split[split].add(img['id'])
        
        print(f"\n{split.upper()} - En çok annotation olan 5 kategori:")
        for cat, count in split_counts.most_common(5):
            print(f"  {cat}: {count}")
    
    # 5. Toplamda en az ve en çok annotation olan kategoriler
    print(f"\nTOPLAM - En çok annotation olan 10 kategori:")
    for cat, count in category_counts.most_common(10):
        print(f"  {cat}: {count}")
    
    print(f"\nTOPLAM - En az annotation olan 10 kategori:")
    for cat, count in category_counts.most_common()[-10:]:
        print(f"  {cat}: {count}")
    
    # 6. Image ID çakışması kontrolü
    print(f"\n🔄 IMAGE ID ÇAKIŞMA KONTROLÜ")
    print("-" * 30)
    
    all_image_ids = set()
    overlap_found = False
    
    for split, ids in image_ids_per_split.items():
        if all_image_ids & ids:  # Kesişim varsa
            overlap = all_image_ids & ids
            print(f"⚠️  {split} ile önceki split'ler arasında {len(overlap)} image ID çakışması!")
            overlap_found = True
        all_image_ids.update(ids)
        print(f"{split.upper():<6}: {len(ids)} unique image ID")
    
    if not overlap_found:
        print("✅ Image ID çakışması yok")
    
    print(f"\nToplam unique image ID: {len(all_image_ids)}")
    
    # 7. Özet
    print(f"\n📋 ÖZET")
    print("=" * 20)
    success = category_consistency and not overlap_found
    print(f"Kategori tutarlılığı: {'✅' if category_consistency else '❌'}")
    print(f"Image ID benzersizliği: {'✅' if not overlap_found else '❌'}")
    print(f"Genel durum: {'✅ BAŞARILI' if success else '⚠️  SORUN VAR'}")
    
    if success:
        return success, {
            'datasets': datasets,
            'categories': all_categories,
            'category_counts': category_counts,
            'image_ids': image_ids_per_split
        }
    else:
        return success


if __name__ == "__main__":
    data_dir = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data"
    result = check_coco_consistency(data_dir)
    if isinstance(result, tuple):
        success, info = result
        print(f"\n🎯 Sonuç: {'BAŞARILI' if success else 'SORUNLU'}")
    else:
        print(f"\n🎯 Sonuç: {'BAŞARILI' if result else 'SORUNLU'}")