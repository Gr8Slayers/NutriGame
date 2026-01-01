import json
from pathlib import Path
from collections import defaultdict

def check_category_consistency(dataset_path):
    """
    Train, test, valid setlerindeki kategorilerin tutarlılığını kontrol eder:
    - Aynı kategori ID'leri ve isimleri var mı?
    - Hangi kategoriler hangi setlerde var?
    - Her setteki kategori dağılımı
    """
    
    dataset_path = Path(dataset_path)
    splits = ['train', 'test', 'valid']
    
    split_data = {}
    
    print("=" * 80)
    print("KATEGORİ TUTARLILIĞI KONTROLÜ")
    print("=" * 80)
    print(f"\nDataset yolu: {dataset_path}\n")
    
    # Her split'ten kategori bilgilerini topla
    for split in splits:
        annotation_file = dataset_path / f"_{split}.json"
        
        if not annotation_file.exists():
            print(f"⚠️  {split} bulunamadı!")
            continue
        
        with open(annotation_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        categories = {cat['id']: cat['name'] for cat in data['categories']}
        annotations = data['annotations']
        
        # Her kategoriden kaç annotation var
        category_counts = defaultdict(int)
        for ann in annotations:
            category_counts[ann['category_id']] += 1
        
        split_data[split] = {
            'categories': categories,
            'category_counts': category_counts,
            'total_annotations': len(annotations)
        }
        
        print(f"✅ {split.upper()}: {len(categories)} kategori, {len(annotations)} annotasyon")
    
    # Kategori tutarlılığını kontrol et
    print("\n" + "=" * 80)
    print("TUTARLILIK ANALİZİ")
    print("=" * 80)
    
    # Tüm setlerdeki kategori ID'lerini topla
    all_category_ids = set()
    for split_info in split_data.values():
        all_category_ids.update(split_info['categories'].keys())
    
    print(f"\n📊 Toplam benzersiz kategori ID: {len(all_category_ids)}")
    
    # Kategori isimlerinin tutarlılığını kontrol et
    print("\n🔍 Kategori ID ve İsim Tutarlılığı:")
    inconsistent_categories = []
    
    for cat_id in sorted(all_category_ids):
        names = set()
        for split, data in split_data.items():
            if cat_id in data['categories']:
                names.add(data['categories'][cat_id])
        
        if len(names) > 1:
            inconsistent_categories.append((cat_id, names))
            print(f"  ⚠️  Kategori ID {cat_id}: farklı isimler -> {names}")
    
    if not inconsistent_categories:
        print("  ✅ Tüm kategori isimleri tutarlı!")
    else:
        print(f"\n  ❌ {len(inconsistent_categories)} kategoride tutarsızlık bulundu!")
    
    # Her kategorinin hangi setlerde bulunduğunu kontrol et
    print("\n📍 Kategorilerin Set Dağılımı:")
    
    categories_in_all = []
    categories_missing = defaultdict(list)
    
    train_cats = set(split_data['train']['categories'].keys())
    
    for cat_id in sorted(train_cats):
        cat_name = split_data['train']['categories'][cat_id]
        in_test = cat_id in split_data['test']['categories']
        in_valid = cat_id in split_data['valid']['categories']
        
        if in_test and in_valid:
            categories_in_all.append(cat_id)
        else:
            missing = []
            if not in_test:
                missing.append('test')
            if not in_valid:
                missing.append('valid')
            categories_missing[cat_name] = missing
    
    print(f"  ✅ Tüm setlerde bulunan kategori: {len(categories_in_all)}/{len(train_cats)}")
    
    if categories_missing:
        print(f"\n  ⚠️  Bazı setlerde eksik kategoriler ({len(categories_missing)}):")
        for cat_name, missing_in in list(categories_missing.items())[:10]:
            print(f"    - {cat_name}: eksik -> {', '.join(missing_in)}")
        if len(categories_missing) > 10:
            print(f"    ... ve {len(categories_missing) - 10} kategori daha")
    
    # Kategori başına annotation sayısı karşılaştırması
    print("\n" + "=" * 80)
    print("KATEGORİ DAĞILIMI KARŞILAŞTIRMASI")
    print("=" * 80)
    
    # Train setindeki top 20 kategoriyi analiz et
    train_top = sorted(
        split_data['train']['category_counts'].items(),
        key=lambda x: x[1],
        reverse=True
    )[:20]
    
    print("\n📊 Top 20 Kategori (Her Setteki Annotation Sayısı):\n")
    print(f"{'Kategori':<30} {'Train':<10} {'Test':<10} {'Valid':<10}")
    print("-" * 70)
    
    for cat_id, train_count in train_top:
        cat_name = split_data['train']['categories'][cat_id]
        test_count = split_data['test']['category_counts'].get(cat_id, 0)
        valid_count = split_data['valid']['category_counts'].get(cat_id, 0)
        
        print(f"{cat_name:<30} {train_count:<10} {test_count:<10} {valid_count:<10}")
    
    # Eksik kategorileri bul
    print("\n" + "=" * 80)
    print("EKSİK KATEGORİ ANALİZİ")
    print("=" * 80)
    
    for split in ['test', 'valid']:
        missing_cats = []
        for cat_id in train_cats:
            cat_name = split_data['train']['categories'][cat_id]
            if split_data[split]['category_counts'].get(cat_id, 0) == 0:
                missing_cats.append(cat_name)
        
        if missing_cats:
            print(f"\n⚠️  {split.upper()} setinde annotasyonu olmayan kategoriler ({len(missing_cats)}):")
            for cat in missing_cats[:15]:
                print(f"  - {cat}")
            if len(missing_cats) > 15:
                print(f"  ... ve {len(missing_cats) - 15} kategori daha")
        else:
            print(f"\n✅ {split.upper()}: Tüm kategorilerde en az bir annotation var")
    
    # Oransal dağılım analizi
    print("\n" + "=" * 80)
    print("ORANSAL DAĞILIM ANALİZİ")
    print("=" * 80)
    
    print("\n📊 Set dağılımları birbirine benzer mi?\n")
    
    for cat_id, train_count in train_top[:10]:
        cat_name = split_data['train']['categories'][cat_id]
        test_count = split_data['test']['category_counts'].get(cat_id, 0)
        valid_count = split_data['valid']['category_counts'].get(cat_id, 0)
        
        train_ratio = (train_count / split_data['train']['total_annotations']) * 100
        test_ratio = (test_count / split_data['test']['total_annotations']) * 100 if test_count > 0 else 0
        valid_ratio = (valid_count / split_data['valid']['total_annotations']) * 100 if valid_count > 0 else 0
        
        print(f"{cat_name:<30}")
        print(f"  Train: {train_ratio:>5.2f}% | Test: {test_ratio:>5.2f}% | Valid: {valid_ratio:>5.2f}%")
        
        # Oran farkı uyarısı
        max_diff = max(abs(train_ratio - test_ratio), abs(train_ratio - valid_ratio))
        if max_diff > 2.0:  # %2'den fazla fark varsa uyar
            print(f"  ⚠️  Oran farkı: {max_diff:.2f}%")
        print()
    
    print("=" * 80)


if __name__ == "__main__":
    # NutriGame projesindeki data klasörü
    dataset_path = Path(r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data")
    check_category_consistency(dataset_path)
