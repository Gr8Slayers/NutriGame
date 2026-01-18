#!/usr/bin/env python3
"""
COCO dataset detaylı analiz - ID çakışması vs dosya çakışması
"""
import json
from pathlib import Path
from collections import defaultdict

def analyze_image_overlap_detailed(data_dir):
    """ID çakışması mı, gerçek resim çakışması mı kontrol eder"""
    
    data_path = Path(data_dir)
    files = {
        'train': data_path / '_train.json',
        'valid': data_path / '_valid.json', 
        'test': data_path / '_test.json'
    }
    
    print("🔍 DETAYLI ÇAKIŞMA ANALİZİ")
    print("=" * 50)
    
    # Her split için data yükle
    datasets = {}
    for split, file_path in files.items():
        with open(file_path, 'r', encoding='utf-8') as f:
            datasets[split] = json.load(f)
        print(f"✅ {split} yüklendi")
    
    # 1. ID Range analizi
    print(f"\n📊 IMAGE ID ARALIĞI ANALİZİ")
    print("-" * 30)
    
    for split, data in datasets.items():
        image_ids = [img['id'] for img in data['images']]
        min_id = min(image_ids) if image_ids else 0
        max_id = max(image_ids) if image_ids else 0
        print(f"{split.upper():<6}: ID aralığı {min_id:>6} - {max_id:>6} ({len(image_ids):>5} resim)")
    
    # 2. Dosya ismi analizi
    print(f"\n📁 DOSYA İSMİ ÇAKIŞMA ANALİZİ")
    print("-" * 30)
    
    all_filenames = defaultdict(list)  # filename -> [split1, split2, ...]
    filename_to_ids = defaultdict(list)  # filename -> [(split, image_id), ...]
    
    for split, data in datasets.items():
        split_filenames = set()
        for img in data['images']:
            filename = img['file_name']
            image_id = img['id']
            
            all_filenames[filename].append(split)
            filename_to_ids[filename].append((split, image_id))
            split_filenames.add(filename)
        
        print(f"{split.upper():<6}: {len(split_filenames)} unique dosya ismi")
    
    # Çakışan dosya isimlerini bul
    overlap_filenames = {name: splits for name, splits in all_filenames.items() if len(splits) > 1}
    
    print(f"\n🔄 DOSYA İSMİ ÇAKIŞMALARI")
    print("-" * 25)
    
    if overlap_filenames:
        print(f"❌ {len(overlap_filenames)} dosya birden fazla split'te var!")
        
        # İlk 10 örneği göster
        print(f"\nÖrnekler (ilk 10):")
        count = 0
        for filename, splits in overlap_filenames.items():
            if count >= 10:
                break
            
            ids_info = filename_to_ids[filename]
            ids_str = ", ".join([f"{split}(ID:{img_id})" for split, img_id in ids_info])
            print(f"  📄 {filename} -> {ids_str}")
            count += 1
        
        if len(overlap_filenames) > 10:
            print(f"  ... ve {len(overlap_filenames) - 10} tane daha")
        
        # Split kombinasyonları
        split_combinations = defaultdict(int)
        for filename, splits in overlap_filenames.items():
            combo = "+".join(sorted(set(splits)))
            split_combinations[combo] += 1
        
        print(f"\nÇakışma kombinasyonları:")
        for combo, count in split_combinations.items():
            print(f"  {combo}: {count} dosya")
    
    else:
        print("✅ Hiçbir dosya ismi çakışması yok!")
    
    # 3. ID çakışması detayı
    print(f"\n🆔 IMAGE ID ÇAKIŞMA DETAYI")
    print("-" * 25)
    
    all_image_ids = defaultdict(list)  # image_id -> [(split, filename), ...]
    
    for split, data in datasets.items():
        for img in data['images']:
            image_id = img['id']
            filename = img['file_name']
            all_image_ids[image_id].append((split, filename))
    
    # Çakışan ID'leri bul
    overlap_ids = {img_id: info for img_id, info in all_image_ids.items() if len(info) > 1}
    
    if overlap_ids:
        print(f"❌ {len(overlap_ids)} Image ID birden fazla split'te var!")
        
        # İlk 10 örneği göster
        print(f"\nÖrnekler (ilk 10):")
        count = 0
        for img_id, info in overlap_ids.items():
            if count >= 10:
                break
            
            info_str = ", ".join([f"{split}({filename})" for split, filename in info])
            print(f"  🆔 ID {img_id} -> {info_str}")
            count += 1
        
        if len(overlap_ids) > 10:
            print(f"  ... ve {len(overlap_ids) - 10} tane daha")
    
    else:
        print("✅ Hiçbir Image ID çakışması yok!")
    
    # 4. SONUÇ ve ÖNERİ
    print(f"\n🎯 SONUÇ VE ÖNERİ")
    print("=" * 30)
    
    has_filename_overlap = len(overlap_filenames) > 0
    has_id_overlap = len(overlap_ids) > 0
    
    if has_filename_overlap and has_id_overlap:
        print("🔴 Hem dosya ismi hem ID çakışması var!")
        print("📝 Öneri: Gerçek resim duplikasyonu - merge_all_splits.py kullan")
        solution = "merge_and_deduplicate"
        
    elif has_filename_overlap and not has_id_overlap:
        print("🟡 Sadece dosya ismi çakışması var, ID'ler farklı")
        print("📝 Öneri: Aynı resimler farklı ID'lerle - dikkatli merge gerekli")
        solution = "careful_merge"
        
    elif not has_filename_overlap and has_id_overlap:
        print("🟠 Sadece ID çakışması var, dosyalar farklı")
        print("📝 Öneri: Basit ID yeniden numaralandırması yeterli")
        solution = "simple_reindex"
        
    else:
        print("✅ Hiçbir çakışma yok!")
        print("📝 Öneri: Datayı direkt birleştirebilirsiniz")
        solution = "direct_merge"
    
    # İstatistikler
    total_unique_files = len(set().union(*[
        {img['file_name'] for img in data['images']} 
        for data in datasets.values()
    ]))
    
    total_images_count = sum(len(data['images']) for data in datasets.values())
    
    print(f"\n📈 İSTATİSTİKLER")
    print("-" * 15)
    print(f"Toplam resim sayısı (split'lerde): {total_images_count}")
    print(f"Unique dosya ismi sayısı: {total_unique_files}")
    print(f"Duplikasyon oranı: %{((total_images_count - total_unique_files) / total_images_count * 100):.1f}")
    
    return {
        'solution': solution,
        'total_images': total_images_count,
        'unique_files': total_unique_files,
        'filename_overlaps': len(overlap_filenames),
        'id_overlaps': len(overlap_ids)
    }


if __name__ == "__main__":
    data_dir = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data"
    result = analyze_image_overlap_detailed(data_dir)