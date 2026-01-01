import json
import shutil
from pathlib import Path
from collections import defaultdict

def balance_rtdetr_valid_categories():
    """
    RT-DETR data klasöründeki valid setinde eksik olan kategoriler için
    train setinden örnek taşır.
    """
    
    base_path = Path(r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data")
    
    train_json = base_path / "annotations" / "instances_train.json"
    val_json = base_path / "annotations" / "instances_val.json"
    
    train_img_dir = base_path / "train"
    val_img_dir = base_path / "val"
    
    print("=" * 80)
    print("RT-DETR VALID SET BALANCE")
    print("=" * 80)
    
    # JSON'ları yükle
    with open(train_json, 'r', encoding='utf-8') as f:
        train_data = json.load(f)
    
    with open(val_json, 'r', encoding='utf-8') as f:
        val_data = json.load(f)
    
    print(f"\nMevcut durum:")
    print(f"  Train: {len(train_data['images'])} resim, {len(train_data['annotations'])} ann")
    print(f"  Val: {len(val_data['images'])} resim, {len(val_data['annotations'])} ann")
    
    # Kategorilere göre train annotasyonlarını grupla
    train_cat_to_images = defaultdict(set)
    train_img_to_anns = defaultdict(list)
    
    for ann in train_data['annotations']:
        train_cat_to_images[ann['category_id']].add(ann['image_id'])
        train_img_to_anns[ann['image_id']].append(ann)
    
    # Valid'deki kategori dağılımı
    val_categories = defaultdict(int)
    for ann in val_data['annotations']:
        val_categories[ann['category_id']] += 1
    
    # Eksik kategorileri bul
    all_categories = {cat['id']: cat['name'] for cat in train_data['categories']}
    missing_categories = []
    
    for cat_id, cat_name in all_categories.items():
        if val_categories[cat_id] == 0:
            missing_categories.append((cat_id, cat_name))
    
    print(f"\n⚠️  Valid setinde eksik {len(missing_categories)} kategori bulundu:")
    for cat_id, cat_name in missing_categories[:15]:
        print(f"  - {cat_name}")
    if len(missing_categories) > 15:
        print(f"  ... ve {len(missing_categories) - 15} kategori daha")
    
    # Image ID mapping (çakışmayı önlemek için)
    max_val_img_id = max([img['id'] for img in val_data['images']])
    max_val_ann_id = max([ann['id'] for ann in val_data['annotations']])
    
    new_img_id = max_val_img_id + 1
    new_ann_id = max_val_ann_id + 1
    
    # Her eksik kategori için train'den örnek seç
    images_to_move = []
    annotations_to_add = []
    
    MIN_SAMPLES = 3  # Her kategori için minimum örnek sayısı
    
    print(f"\n🔄 Her eksik kategori için {MIN_SAMPLES} örnek seçiliyor...")
    
    for cat_id, cat_name in missing_categories:
        # Bu kategoriye ait train resimleri
        candidate_images = list(train_cat_to_images[cat_id])
        
        if not candidate_images:
            print(f"  ⚠️  {cat_name}: Train'de de örnek yok!")
            continue
        
        # Rastgele MIN_SAMPLES kadar resim seç
        import random
        random.seed(42)
        selected_images = random.sample(candidate_images, min(MIN_SAMPLES, len(candidate_images)))
        
        for img_id in selected_images:
            # Resim bilgisini bul
            img_info = next(img for img in train_data['images'] if img['id'] == img_id)
            
            # Yeni ID ile ekle
            old_img_id = img_info['id']
            img_info_copy = img_info.copy()
            img_info_copy['id'] = new_img_id
            images_to_move.append((img_info_copy, img_info['file_name']))
            
            # Bu resme ait tüm annotasyonları ekle
            for ann in train_img_to_anns[old_img_id]:
                ann_copy = ann.copy()
                ann_copy['id'] = new_ann_id
                ann_copy['image_id'] = new_img_id
                annotations_to_add.append(ann_copy)
                new_ann_id += 1
            
            new_img_id += 1
        
        print(f"  ✅ {cat_name}: {len(selected_images)} resim seçildi")
    
    print(f"\n📦 Toplam taşınacak:")
    print(f"  - {len(images_to_move)} resim")
    print(f"  - {len(annotations_to_add)} annotasyon")
    
    # Kullanıcı onayı
    response = input(f"\n❓ Devam edilsin mi? (y/n): ")
    if response.lower() != 'y':
        print("İşlem iptal edildi.")
        return
    
    # Resimleri kopyala
    print(f"\n📁 Resimler kopyalanıyor...")
    copied_count = 0
    
    for img_info, filename in images_to_move:
        src = train_img_dir / filename
        dst = val_img_dir / filename
        
        if src.exists():
            if not dst.exists():
                shutil.copy2(src, dst)
                copied_count += 1
        else:
            print(f"  ⚠️  Kaynak bulunamadı: {filename}")
    
    print(f"  ✅ {copied_count} resim kopyalandı")
    
    # JSON'ları güncelle
    print(f"\n💾 JSON güncelleniyor...")
    
    for img_info, _ in images_to_move:
        val_data['images'].append(img_info)
    
    for ann in annotations_to_add:
        val_data['annotations'].append(ann)
    
    # Yedek oluştur
    backup_path = val_json.parent / f"{val_json.stem}_backup.json"
    shutil.copy2(val_json, backup_path)
    print(f"  📦 Yedek oluşturuldu: {backup_path.name}")
    
    # Yeni JSON'ı kaydet
    with open(val_json, 'w', encoding='utf-8') as f:
        json.dump(val_data, f, indent=2)
    
    print(f"  ✅ instances_val.json güncellendi")
    
    print(f"\n📊 Yeni durum:")
    print(f"  Val: {len(val_data['images'])} resim, {len(val_data['annotations'])} ann")
    
    # Kontrol: Hala eksik kategori var mı?
    new_val_categories = defaultdict(int)
    for ann in val_data['annotations']:
        new_val_categories[ann['category_id']] += 1
    
    remaining_missing = sum(1 for cat_id in all_categories if new_val_categories[cat_id] == 0)
    
    if remaining_missing == 0:
        print(f"\n✅ Tüm kategoriler valid setinde mevcut!")
    else:
        print(f"\n⚠️  Hala {remaining_missing} kategori eksik (train'de de örnek yok)")
    
    print("\n" + "=" * 80)
    print("✅ İşlem tamamlandı!")
    print("=" * 80)


if __name__ == "__main__":
    balance_rtdetr_valid_categories()
