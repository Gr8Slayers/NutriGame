import json
from collections import Counter

def analyze_grouped_dataset():
    """grouped_dataset.json'daki kategori dağılımını analiz et"""
    
    dataset_path = r'D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\grouped_dataset.json'
    
    print("Grouped dataset yükleniyor...")
    with open(dataset_path, 'r') as f:
        data = json.load(f)
    
    # Kategori ID'lerini say
    category_counts = Counter()
    
    print("Annotation'lar analiz ediliyor...")
    for ann in data['annotations']:
        category_counts[ann['category_id']] += 1
    
    # Kategori isimlerini al
    id_to_name = {cat['id']: cat['name'] for cat in data['categories']}
    
    print(f"\n{'='*80}")
    print("GROUPED DATASET KATEGORİ DAĞILIMI")
    print(f"{'='*80}")
    print(f"Toplam resim sayısı: {len(data['images'])}")
    print(f"Toplam annotation sayısı: {len(data['annotations'])}")
    print(f"Toplam kategori sayısı: {len(data['categories'])}")
    
    print(f"\nKATEGORİ DAĞILIMI (örnek sayısına göre sıralı):")
    print("-" * 80)
    print(f"{'ID':<4} {'Kategori':<25} {'Örnek Sayısı':<12} {'Durum':<15}")
    print("-" * 80)
    
    # Kategori sayılarını sırala
    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1])
    
    low_sample_categories = []
    medium_sample_categories = []
    good_sample_categories = []
    
    for cat_id, count in sorted_categories:
        cat_name = id_to_name.get(cat_id, f"Unknown_ID_{cat_id}")
        
        if count < 15:
            status = "🔴 ÇOK AZ"
            low_sample_categories.append((cat_id, cat_name, count))
        elif count < 50:
            status = "🟡 AZ"
            medium_sample_categories.append((cat_id, cat_name, count))
        else:
            status = "✅ YETERLİ"
            good_sample_categories.append((cat_id, cat_name, count))
            
        print(f"{cat_id:<4} {cat_name:<25} {count:<12} {status:<15}")
    
    print(f"\n{'='*80}")
    print("ÖZET:")
    print(f" Çok az örnekli (< 15): {len(low_sample_categories)} kategori")
    print(f"🟡 Az örnekli (15-49): {len(medium_sample_categories)} kategori")
    print(f"✅ Yeterli örnekli (≥ 50): {len(good_sample_categories)} kategori")
    
    if low_sample_categories:
        print(f"\n🔴 ÇIKARILMASI GEREKEN KATEGORİLER:")
        print("-" * 50)
        for cat_id, cat_name, count in low_sample_categories:
            print(f"  ID {cat_id}: {cat_name} ({count} örnek)")
    
    if medium_sample_categories:
        print(f"\n🟡 SINIRDA OLAN KATEGORİLER:")
        print("-" * 50)  
        for cat_id, cat_name, count in medium_sample_categories:
            print(f"  ID {cat_id}: {cat_name} ({count} örnek)")
    
    return low_sample_categories, medium_sample_categories, good_sample_categories

if __name__ == "__main__":
    low, medium, good = analyze_grouped_dataset()