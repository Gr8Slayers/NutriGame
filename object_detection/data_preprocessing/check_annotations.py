import json
import os
from pathlib import Path
from collections import defaultdict

def check_annotations(dataset_path):
    """
    COCO formatındaki annotasyonları kontrol eder:
    - Her split için annotation sayısı
    - Kategori dağılımı
    - Boş/eksik annotasyonlar
    - Annotasyon istatistikleri (bbox boyutları, vb.)
    """
    
    dataset_path = Path(dataset_path)
    splits = ['train', 'test', 'valid']
    
    results = {
        'total_annotations': 0,
        'total_images': 0,
        'categories': {},
        'splits': {}
    }
    
    print("=" * 80)
    print("DATASET ANNOTASYON KONTROLÜ")
    print("=" * 80)
    print(f"\nDataset yolu: {dataset_path}\n")
    
    for split in splits:
        split_path = dataset_path / f"_{split}.json"
        
        if not split_path.exists():
            print(f"⚠️  {split} annotasyon dosyası bulunamadı: {split_path}")
            continue
        
        print(f"\n📁 {split.upper()} annotasyonları kontrol ediliyor...")
        print("-" * 80)
        
        try:
            with open(split_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            images = data.get('images', [])
            annotations = data.get('annotations', [])
            categories = data.get('categories', [])
            
            # Split bilgilerini kaydet
            split_info = {
                'images': len(images),
                'annotations': len(annotations),
                'categories': len(categories),
                'avg_annotations_per_image': len(annotations) / len(images) if images else 0,
                'images_without_annotations': 0,
                'category_distribution': defaultdict(int),
                'bbox_areas': []
            }
            
            # Kategori bilgilerini topla
            category_names = {cat['id']: cat['name'] for cat in categories}
            
            if split == 'train':  # Kategorileri sadece bir kez kaydet
                results['categories'] = category_names
            
            # Image ID'lere göre annotation sayısı
            image_ann_count = defaultdict(int)
            for ann in annotations:
                image_id = ann['image_id']
                category_id = ann['category_id']
                image_ann_count[image_id] += 1
                split_info['category_distribution'][category_id] += 1
                
                # Bbox alanı hesapla
                if 'bbox' in ann:
                    x, y, w, h = ann['bbox']
                    area = w * h
                    split_info['bbox_areas'].append(area)
            
            # Annotasyonu olmayan resimleri say
            for img in images:
                if image_ann_count[img['id']] == 0:
                    split_info['images_without_annotations'] += 1
            
            results['splits'][split] = split_info
            results['total_annotations'] += len(annotations)
            results['total_images'] += len(images)
            
            # Split özeti
            print(f"✅ Resim sayısı: {len(images)}")
            print(f"✅ Annotasyon sayısı: {len(annotations)}")
            print(f"✅ Kategori sayısı: {len(categories)}")
            print(f"📊 Resim başına ortalama annotasyon: {split_info['avg_annotations_per_image']:.2f}")
            
            if split_info['images_without_annotations'] > 0:
                print(f"⚠️  Annotasyonu olmayan resim sayısı: {split_info['images_without_annotations']}")
            
        except Exception as e:
            print(f"❌ Hata: {e}")
            continue
    
    # Detaylı özet rapor
    print("\n" + "=" * 80)
    print("ÖZET RAPOR")
    print("=" * 80)
    
    print(f"\n📊 Toplam İstatistikler:")
    print(f"  - Toplam resim: {results['total_images']}")
    print(f"  - Toplam annotasyon: {results['total_annotations']}")
    print(f"  - Toplam kategori: {len(results['categories'])}")
    
    # Her split için detaylar
    print(f"\n📁 Split Dağılımı:")
    for split in splits:
        if split in results['splits']:
            info = results['splits'][split]
            print(f"\n  {split.upper()}:")
            print(f"    - Resim: {info['images']} ({info['images']/results['total_images']*100:.1f}%)")
            print(f"    - Annotasyon: {info['annotations']} ({info['annotations']/results['total_annotations']*100:.1f}%)")
            print(f"    - Ortalama ann/resim: {info['avg_annotations_per_image']:.2f}")
            
            if info['images_without_annotations'] > 0:
                print(f"    ⚠️  Annotasyonsuz resim: {info['images_without_annotations']}")
    
    # Kategori dağılımı (train setinden)
    if 'train' in results['splits']:
        print(f"\n🏷️  Kategori Dağılımı (Train Set):")
        train_cat_dist = results['splits']['train']['category_distribution']
        
        # Kategorileri annotasyon sayısına göre sırala
        sorted_cats = sorted(train_cat_dist.items(), key=lambda x: x[1], reverse=True)
        
        print(f"\n  Top 20 Kategori:")
        for cat_id, count in sorted_cats[:20]:
            cat_name = results['categories'].get(cat_id, f"Unknown ({cat_id})")
            percentage = (count / results['splits']['train']['annotations']) * 100
            print(f"    - {cat_name}: {count} ({percentage:.2f}%)")
        
        if len(sorted_cats) > 20:
            print(f"\n  ... ve {len(sorted_cats) - 20} kategori daha")
    
    # Bbox istatistikleri
    if 'train' in results['splits'] and results['splits']['train']['bbox_areas']:
        areas = results['splits']['train']['bbox_areas']
        print(f"\n📏 Bbox İstatistikleri (Train Set):")
        print(f"  - Ortalama alan: {sum(areas)/len(areas):.0f} piksel²")
        print(f"  - Min alan: {min(areas):.0f} piksel²")
        print(f"  - Max alan: {max(areas):.0f} piksel²")
        
        # Alan dağılımı
        small = sum(1 for a in areas if a < 32*32)
        medium = sum(1 for a in areas if 32*32 <= a < 96*96)
        large = sum(1 for a in areas if a >= 96*96)
        
        print(f"\n  Boyut Dağılımı (COCO standardı):")
        print(f"    - Küçük (<32²): {small} ({small/len(areas)*100:.1f}%)")
        print(f"    - Orta (32²-96²): {medium} ({medium/len(areas)*100:.1f}%)")
        print(f"    - Büyük (≥96²): {large} ({large/len(areas)*100:.1f}%)")
    
    print("\n" + "=" * 80)
    
    return results


if __name__ == "__main__":
    dataset_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data"
    results = check_annotations(dataset_path)
