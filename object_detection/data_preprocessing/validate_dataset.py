import json
import os

def validate_coco_dataset(json_path, image_dir):
    """COCO veri setini kapsamlı şekilde doğrula"""
    print(f"\n{'='*60}")
    print(f"Validating: {os.path.basename(json_path)}")
    print(f"{'='*60}\n")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    categories = data['categories']
    images = data['images']
    annotations = data['annotations']
    
    # 1. Kategori ID kontrolü
    print("1. KATEGORI KONTROLÜ")
    print("-" * 40)
    cat_ids = sorted([c['id'] for c in categories])
    print(f"   Toplam kategori: {len(cat_ids)}")
    print(f"   Min ID: {min(cat_ids)}")
    print(f"   Max ID: {max(cat_ids)}")
    print(f"   Beklenen aralık: 0-{len(cat_ids)-1}")
    
    # Ardışıklık kontrolü
    expected_ids = list(range(len(cat_ids)))
    missing_ids = [i for i in expected_ids if i not in cat_ids]
    if missing_ids:
        print(f"    HATA: Eksik ID'ler: {missing_ids}")
    else:
        print(f"    ID'ler ardışık (0-{max(cat_ids)})")
    
    # Duplicate kontrolü
    if len(cat_ids) != len(set(cat_ids)):
        print(f"    HATA: Duplicate kategori ID'leri var!")
    else:
        print(f"    Duplicate yok")
    
    # 2. Annotation kategori ID kontrolü
    print("\n2. ANNOTATION KATEGORI ID KONTROLÜ")
    print("-" * 40)
    ann_cat_ids = [a['category_id'] for a in annotations]
    print(f"   Toplam annotation: {len(ann_cat_ids)}")
    
    if ann_cat_ids:
        print(f"   Min category_id: {min(ann_cat_ids)}")
        print(f"   Max category_id: {max(ann_cat_ids)}")
        
        # Geçersiz ID kontrolü
        invalid_anns = [a for a in annotations if a['category_id'] < 0 or a['category_id'] > max(cat_ids)]
        if invalid_anns:
            print(f"    HATA: {len(invalid_anns)} geçersiz category_id bulundu!")
            print(f"   İlk 5 geçersiz:", invalid_anns[:5])
        else:
            print(f"    Tüm category_id'ler geçerli aralıkta (0-{max(cat_ids)})")
        
        # Kullanılmayan kategori kontrolü
        used_cat_ids = set(ann_cat_ids)
        unused_cats = [c for c in categories if c['id'] not in used_cat_ids]
        if unused_cats:
            print(f"     Uyarı: {len(unused_cats)} kategori hiç kullanılmamış")
            print(f"   Kullanılmayan ilk 5: {[c['name'] for c in unused_cats[:5]]}")
        else:
            print(f"    Tüm kategoriler en az bir kez kullanılmış")
    else:
        print(f"    HATA: Hiç annotation yok!")
    
    # 3. Bounding box kontrolü
    print("\n3. BOUNDING BOX KONTROLÜ")
    print("-" * 40)
    
    # Image ID -> dimensions mapping
    img_dims = {img['id']: (img['width'], img['height']) for img in images}
    
    bbox_issues = []
    nan_issues = []
    
    for ann in annotations:
        bbox = ann.get('bbox', [])
        img_id = ann.get('image_id')
        
        # NaN kontrolü
        if any(np.isnan(x) if isinstance(x, (int, float)) else False for x in bbox):
            nan_issues.append(ann['id'])
            continue
        
        if len(bbox) != 4:
            bbox_issues.append({'ann_id': ann['id'], 'issue': 'Invalid bbox length', 'bbox': bbox})
            continue
        
        x, y, w, h = bbox
        
        # Negatif değer kontrolü
        if x < 0 or y < 0 or w < 0 or h < 0:
            bbox_issues.append({'ann_id': ann['id'], 'issue': 'Negative values', 'bbox': bbox})
            continue
        
        # Resim sınırları kontrolü
        if img_id in img_dims:
            img_w, img_h = img_dims[img_id]
            if x + w > img_w or y + h > img_h:
                bbox_issues.append({'ann_id': ann['id'], 'issue': 'Out of bounds', 'bbox': bbox, 'img_dims': (img_w, img_h)})
            
            # Sıfır alan kontrolü
            if w == 0 or h == 0:
                bbox_issues.append({'ann_id': ann['id'], 'issue': 'Zero area', 'bbox': bbox})
    
    if nan_issues:
        print(f"    HATA: {len(nan_issues)} annotation'da NaN değer var!")
        print(f"   İlk 5 NaN annotation ID: {nan_issues[:5]}")
    else:
        print(f"    NaN değer yok")
    
    if bbox_issues:
        print(f"    HATA: {len(bbox_issues)} bounding box sorunu bulundu!")
        for issue in bbox_issues[:5]:
            print(f"      - Ann ID {issue['ann_id']}: {issue['issue']} - {issue.get('bbox', 'N/A')}")
    else:
        print(f"    Tüm bounding box'lar geçerli")
    
    # 4. Image dosya kontrolü
    print("\n4. IMAGE DOSYA KONTROLÜ")
    print("-" * 40)
    
    missing_images = []
    corrupted_images = []
    dim_mismatch = []
    
    for img in images[:50]:  # İlk 50 resmi kontrol et (hız için)
        img_path = os.path.join(image_dir, img['file_name'])
        
        if not os.path.exists(img_path):
            missing_images.append(img['file_name'])
            continue
        
        try:
            with Image.open(img_path) as pil_img:
                actual_w, actual_h = pil_img.size
                expected_w, expected_h = img['width'], img['height']
                
                if actual_w != expected_w or actual_h != expected_h:
                    dim_mismatch.append({
                        'file': img['file_name'],
                        'expected': (expected_w, expected_h),
                        'actual': (actual_w, actual_h)
                    })
        except Exception as e:
            corrupted_images.append({'file': img['file_name'], 'error': str(e)})
    
    print(f"   Kontrol edilen resim sayısı: {min(50, len(images))}/{len(images)}")
    
    if missing_images:
        print(f"   ❌ HATA: {len(missing_images)} resim dosyası bulunamadı!")
        print(f"   İlk 5 eksik: {missing_images[:5]}")
    else:
        print(f"    Kontrol edilen tüm resimler mevcut")
    
    if corrupted_images:
        print(f"    HATA: {len(corrupted_images)} resim bozuk!")
        for item in corrupted_images[:3]:
            print(f"      - {item['file']}: {item['error']}")
    else:
        print(f"    Kontrol edilen resimler açılabiliyor")
    
    if dim_mismatch:
        print(f"    HATA: {len(dim_mismatch)} resimde boyut uyumsuzluğu!")
        for item in dim_mismatch[:3]:
            print(f"      - {item['file']}: Beklenen {item['expected']}, Gerçek {item['actual']}")
    else:
        print(f"    Resim boyutları JSON ile eşleşiyor")
    
    # 5. Genel istatistikler
    print("\n5. GENEL İSTATİSTİKLER")
    print("-" * 40)
    print(f"   Toplam resim: {len(images)}")
    print(f"   Toplam annotation: {len(annotations)}")
    print(f"   Ortalama annotation/resim: {len(annotations)/len(images):.2f}")
    
    # Kategori dağılımı (top 10)
    from collections import Counter
    cat_counts = Counter(ann_cat_ids)
    cat_name_map = {c['id']: c['name'] for c in categories}
    
    print(f"\n   En çok kullanılan 10 kategori:")
    for cat_id, count in cat_counts.most_common(10):
        cat_name = cat_name_map.get(cat_id, f'Unknown({cat_id})')
        print(f"      {cat_name}: {count} annotation")
    
    # SONUÇ
    print("\n" + "="*60)
    total_errors = len(missing_ids) + len(invalid_anns) + len(nan_issues) + len(bbox_issues) + len(missing_images) + len(corrupted_images) + len(dim_mismatch)
    
    if total_errors == 0:
        print(" VERİ SETİ TAMAMEN GEÇERLİ - EĞİTİME HAZIR!")
    else:
        print(f" TOPLAM {total_errors} SORUN BULUNDU - LÜTFEN DÜZELTİN!")
    print("="*60 + "\n")
    
    return total_errors == 0


if __name__ == "__main__":
    base_dir = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data"
    
    # Ana dataset'leri kontrol et
    datasets = [
        "grouped_dataset.json",
        "train_split.json", 
        "val_split.json",
        "test_split.json"
    ]
    
    all_valid = True
    
    for dataset_file in datasets:
        json_path = os.path.join(base_dir, dataset_file)
        
        if os.path.exists(json_path):
            print(f"\n {dataset_file} kontrol ediliyor...")
            is_valid = validate_coco_dataset(json_path)
            all_valid = all_valid and is_valid
        else:
            print(f"\n  {dataset_file} bulunamadı!")
            all_valid = False
    
    print("\n" + "="*60)
    if all_valid:
        print(" TÜM VERİ SETLERİ GEÇERLİ - EĞİTİME BAŞLAYABİLİRSİNİZ!")
    else:
        print("  BAZI VERİ SETLERİNDE SORUN VAR - LÜTFEN KONTROL EDİN!")
    print("="*60)
