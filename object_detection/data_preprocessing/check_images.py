import os
import cv2
from pathlib import Path
from collections import defaultdict

def check_images(dataset_path):
    """
    Dataset içindeki resimleri kontrol eder:
    - Bozuk/okunamayan resimler
    - Resim boyutları
    - Resim formatları
    - Her split'teki resim sayısı
    """
    
    dataset_path = Path(dataset_path)
    splits = ['train', 'test', 'valid']
    
    results = {
        'total_images': 0,
        'corrupted_images': [],
        'image_stats': defaultdict(lambda: {'count': 0, 'sizes': [], 'formats': defaultdict(int)}),
        'size_distribution': defaultdict(int)
    }
    
    print("=" * 80)
    print("DATASET RESİM KONTROLÜ")
    print("=" * 80)
    print(f"\nDataset yolu: {dataset_path}\n")
    
    for split in splits:
        split_path = dataset_path / split
        
        if not split_path.exists():
            print(f"⚠️  {split} klasörü bulunamadı!")
            continue
            
        print(f"\n📁 {split.upper()} klasörü kontrol ediliyor...")
        print("-" * 80)
        
        image_files = list(split_path.glob("*.jpg")) + list(split_path.glob("*.png"))
        
        for img_path in image_files:
            results['total_images'] += 1
            results['image_stats'][split]['count'] += 1
            
            try:
                # Resmi oku
                img = cv2.imread(str(img_path))
                
                if img is None:
                    results['corrupted_images'].append(str(img_path))
                    print(f"❌ Bozuk resim: {img_path.name}")
                    continue
                
                # Boyut bilgisi
                height, width = img.shape[:2]
                size_key = f"{width}x{height}"
                results['image_stats'][split]['sizes'].append((width, height))
                results['size_distribution'][size_key] += 1
                
                # Format bilgisi
                ext = img_path.suffix.lower()
                results['image_stats'][split]['formats'][ext] += 1
                
            except Exception as e:
                results['corrupted_images'].append(str(img_path))
                print(f"❌ Hata ({img_path.name}): {e}")
        
        print(f"✅ {results['image_stats'][split]['count']} resim kontrol edildi")
    
    # Özet rapor
    print("\n" + "=" * 80)
    print("ÖZET RAPOR")
    print("=" * 80)
    
    print(f"\n📊 Toplam Resim Sayısı: {results['total_images']}")
    
    for split in splits:
        if split in results['image_stats']:
            stats = results['image_stats'][split]
            print(f"\n{split.upper()}:")
            print(f"  - Resim sayısı: {stats['count']}")
            
            if stats['sizes']:
                widths = [s[0] for s in stats['sizes']]
                heights = [s[1] for s in stats['sizes']]
                print(f"  - Ortalama boyut: {sum(widths)//len(widths)}x{sum(heights)//len(heights)}")
                print(f"  - Min boyut: {min(widths)}x{min(heights)}")
                print(f"  - Max boyut: {max(widths)}x{max(heights)}")
            
            if stats['formats']:
                print(f"  - Formatlar: {dict(stats['formats'])}")
    
    # Bozuk resimler
    if results['corrupted_images']:
        print(f"\n⚠️  Bozuk Resimler ({len(results['corrupted_images'])}):")
        for img in results['corrupted_images'][:10]:  # İlk 10 tanesini göster
            print(f"  - {img}")
        if len(results['corrupted_images']) > 10:
            print(f"  ... ve {len(results['corrupted_images']) - 10} tane daha")
    else:
        print("\n✅ Bozuk resim bulunamadı!")
    
    # En yaygın boyutlar
    if results['size_distribution']:
        print("\n📏 En Yaygın Resim Boyutları (Top 10):")
        sorted_sizes = sorted(results['size_distribution'].items(), key=lambda x: x[1], reverse=True)
        for size, count in sorted_sizes[:10]:
            print(f"  - {size}: {count} resim")
    
    print("\n" + "=" * 80)
    
    return results


if __name__ == "__main__":
    dataset_path = r"D:\Desktop\Bitirme\object_detection\data\dataset\merged_fixed"
    results = check_images(dataset_path)
