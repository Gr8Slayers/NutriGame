import json
import random
import shutil
from pathlib import Path
from collections import defaultdict

def merge_coco_splits_with_reindex(train_path, val_path, test_path, output_path):
    """
    3 split'i birleştir ve ID'leri yeniden numaralandır.
    Dosya ismine göre unique olmasını garanti et.
    """
    
    with open(train_path, 'r') as f:
        train_data = json.load(f)
    with open(val_path, 'r') as f:
        val_data = json.load(f)
    with open(test_path, 'r') as f:
        test_data = json.load(f)
    
    # Dosya ismine göre unique image'ları topla
    filename_to_img = {}
    
    for split_data in [train_data, val_data, test_data]:
        for img in split_data['images']:
            filename = img['file_name']
            if filename not in filename_to_img:
                filename_to_img[filename] = img
    
    print(f" Unique resim sayısı (dosya ismine göre): {len(filename_to_img)}")
    
    # Yeni image ID'leri ata (1'den başlayarak)
    new_images = []
    filename_to_new_id = {}
    
    for new_id, (filename, img_info) in enumerate(filename_to_img.items(), start=1):
        new_img = {
            'id': new_id,
            'file_name': filename,
            'width': img_info.get('width'),
            'height': img_info.get('height')
        }
        new_images.append(new_img)
        filename_to_new_id[filename] = new_id
    
    # Eski ID'den filename'e mapping oluştur (her split için)
    old_id_to_filename = {}
    
    for split_data in [train_data, val_data, test_data]:
        for img in split_data['images']:
            old_id_to_filename[img['id']] = img['file_name']
    
    # Tüm annotasyonları topla ve yeni ID'lerle eşle
    new_annotations = []
    new_ann_id = 1
    
    for split_data in [train_data, val_data, test_data]:
        for ann in split_data['annotations']:
            old_img_id = ann['image_id']
            
            # Eski image ID'den filename bul
            if old_img_id in old_id_to_filename:
                filename = old_id_to_filename[old_img_id]
                
                # Filename'den yeni image ID bul
                if filename in filename_to_new_id:
                    new_img_id = filename_to_new_id[filename]
                    
                    new_ann = {
                        'id': new_ann_id,
                        'image_id': new_img_id,
                        'category_id': ann['category_id'],
                        'bbox': ann['bbox'],
                        'area': ann.get('area', 0),
                        'iscrowd': ann.get('iscrowd', 0)
                    }
                    
                    new_annotations.append(new_ann)
                    new_ann_id += 1
    
    # Kategorileri al (hepsi aynı olmalı)
    categories = train_data['categories']
    
    merged = {
        'images': new_images,
        'annotations': new_annotations,
        'categories': categories
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    
    print(f" Merged: {len(new_images)} resim, {len(new_annotations)} annotasyon")
    print(f" Yeni Image ID aralığı: 1-{len(new_images)}")
    print(f" Yeni Annotation ID aralığı: 1-{len(new_annotations)}")


def stratified_split_with_minimum_samples(
    input_json_path,
    source_images_dir,
    output_annotations_dir,
    output_images_dir,
    train_ratio=0.8,
    val_ratio=0.1,
    test_ratio=0.1,
    min_samples_per_split=1,
    random_seed=42
):
    """
    COCO formatındaki dataset'i stratified split yapar.
    Her kategoriden her sete EN AZ min_samples_per_split örnek gider.
    Overlap garantili YOK.
    """
    
    random.seed(random_seed)
    
    print("\n Merged data yükleniyor...")
    with open(input_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    images = data['images']
    annotations = data['annotations']
    categories = data['categories']
    
    print(f" Yüklendi: {len(images)} resim, {len(annotations)} annotasyon, {len(categories)} kategori")
    
    # Image ID'ye göre annotasyonları grupla
    img_to_anns = defaultdict(list)
    for ann in annotations:
        img_to_anns[ann['image_id']].append(ann)
    
    # Her resmin ana kategorisini belirle
    img_to_main_cat = {}
    for img in images:
        img_id = img['id']
        if img_id in img_to_anns:
            cat_counts = defaultdict(int)
            for ann in img_to_anns[img_id]:
                cat_counts[ann['category_id']] += 1
            main_cat = max(cat_counts.items(), key=lambda x: x[1])[0]
            img_to_main_cat[img_id] = main_cat
    
    # Kategori ID'ye göre image'ları grupla
    cat_to_imgs = defaultdict(list)
    for img_id, cat_id in img_to_main_cat.items():
        cat_to_imgs[cat_id].append(img_id)
    
    # Her kategori için split yap
    train_imgs = set()
    val_imgs = set()
    test_imgs = set()
    
    print("\n" + "=" * 80)
    print("STRATIFIED SPLIT BAŞLATILIYOR (MIN SAMPLES GARANTILI)")
    print("=" * 80)
    print(f"\nRasyo: Train={train_ratio:.1%}, Val={val_ratio:.1%}, Test={test_ratio:.1%}")
    print(f"Her sette minimum: {min_samples_per_split} örnek\n")
    
    category_stats = []
    low_sample_categories = []
    
    for cat_id, img_list in cat_to_imgs.items():
        cat_name = next((c['name'] for c in categories if c['id'] == cat_id), f"Cat_{cat_id}")
        random.shuffle(img_list)
        
        n_total = len(img_list)
        
        # Minimum gereksinim kontrolü
        min_required = min_samples_per_split * 3  # train+val+test için
        
        if n_total < min_required:
            # Çok az örnek varsa, tümünü train'e at
            train_imgs.update(img_list)
            low_sample_categories.append((cat_name, n_total))
            
            category_stats.append({
                'name': cat_name,
                'total': n_total,
                'train': n_total,
                'val': 0,
                'test': 0
            })
            continue
        
        # Normal split + minimum garanti
        n_train = max(min_samples_per_split, int(n_total * train_ratio))
        n_val = max(min_samples_per_split, int(n_total * val_ratio))
        
        # Kalan herşey test'e
        remaining = n_total - n_train - n_val
        
        # Eğer test için yeterli kalmadıysa, train'den al
        if remaining < min_samples_per_split:
            shortage = min_samples_per_split - remaining
            n_train = max(min_samples_per_split, n_train - shortage)
        
        cat_train = img_list[:n_train]
        cat_val = img_list[n_train:n_train + n_val]
        cat_test = img_list[n_train + n_val:]
        
        train_imgs.update(cat_train)
        val_imgs.update(cat_val)
        test_imgs.update(cat_test)
        
        category_stats.append({
            'name': cat_name,
            'total': n_total,
            'train': len(cat_train),
            'val': len(cat_val),
            'test': len(cat_test)
        })
    
    # İstatistikleri sırala ve göster
    category_stats.sort(key=lambda x: x['total'], reverse=True)
    
    print(" Kategori Dağılımı:")
    for stat in category_stats:
        if stat['total'] >= 10:
            print(f"{stat['name']:30s} → Train: {stat['train']:4d}, Val: {stat['val']:4d}, Test: {stat['test']:4d}")
    
    if low_sample_categories:
        print(f"\n  Az örnekli kategoriler (sadece train'e eklendi):")
        for cat_name, count in sorted(low_sample_categories, key=lambda x: x[1]):
            print(f"  - {cat_name}: {count} örnek")
    
    print(f"\n Toplam dağılım:")
    print(f"   Train: {len(train_imgs)} resim")
    print(f"   Val:   {len(val_imgs)} resim")
    print(f"   Test:  {len(test_imgs)} resim")
    
    # Overlap kontrolü
    overlap_train_val = train_imgs & val_imgs
    overlap_train_test = train_imgs & test_imgs
    overlap_val_test = val_imgs & test_imgs
    
    if overlap_train_val or overlap_train_test or overlap_val_test:
        print("\n HATA: Setler arasında HALA overlap var!")
        print(f"Train-Val: {len(overlap_train_val)}, Train-Test: {len(overlap_train_test)}, Val-Test: {len(overlap_val_test)}")
        raise Exception("Overlap problemi çözülemedi!")
    else:
        print("\n Setler arasında overlap YOK! Mükemmel!")
    
    # Output dizinlerini oluştur
    output_annotations_dir = Path(output_annotations_dir)
    output_images_dir = Path(output_images_dir)
    output_annotations_dir.mkdir(parents=True, exist_ok=True)
    
    for split in ['train', 'val', 'test']:
        (output_images_dir / split).mkdir(parents=True, exist_ok=True)
    
    # Image ID'ye göre image bilgilerini dict'e çevir
    img_dict = {img['id']: img for img in images}
    
    # Source images klasörlerini tanımla
    source_images_dir = Path(source_images_dir)
    source_splits = ['train', 'val', 'test']
    
    # Her set için işle
    splits = {
        'train': train_imgs,
        'val': val_imgs,
        'test': test_imgs
    }
    
    print("\n" + "=" * 80)
    print("DOSYALAR OLUŞTURULUYOR VE RESİMLER KOPYALANIYOR")
    print("=" * 80)
    
    for split_name, split_img_ids in splits.items():
        print(f"\n {split_name.upper()} işleniyor...")
        
        # Bu split'e ait image'ları filtrele
        split_images = []
        images_copied = 0
        images_not_found = []
        
        for img_id in split_img_ids:
            if img_id in img_dict:
                img_info = img_dict[img_id]
                split_images.append(img_info)
                
                # Resmi eski klasörlerde ara
                filename = img_info['file_name']
                source_path = None
                
                for old_split in source_splits:
                    candidate = source_images_dir / old_split / filename
                    if candidate.exists():
                        source_path = candidate
                        break
                
                if source_path:
                    # Yeni klasöre kopyala
                    dest_path = output_images_dir / split_name / filename
                    if not dest_path.exists():
                        shutil.copy2(source_path, dest_path)
                    images_copied += 1
                    
                    if images_copied % 1000 == 0:
                        print(f"    {images_copied} resim kopyalandı...")
                else:
                    images_not_found.append(filename)
        
        # Bu split'e ait annotasyonları filtrele
        split_annotations = [ann for ann in annotations if ann['image_id'] in split_img_ids]
        
        # COCO formatında kaydet
        split_data = {
            'images': split_images,
            'annotations': split_annotations,
            'categories': categories
        }
        
        output_path = output_annotations_dir / f"instances_{split_name}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(split_data, f, indent=2, ensure_ascii=False)
        
        print(f"   Annotasyon: {output_path}")
        print(f"   Resim kopyalandı: {images_copied}/{len(split_images)}")
        print(f"   Annotasyon sayısı: {len(split_annotations)}")
        
        if images_not_found:
            print(f"   Bulunamayan resim sayısı: {len(images_not_found)}")
            if len(images_not_found) <= 10:
                for fn in images_not_found:
                    print(f"      - {fn}")
    
    print("\n" + "=" * 80)
    print("STRATIFIED SPLIT VE RESİM KOPYALAMA TAMAMLANDI!")
    print("=" * 80)
    print(f"\nYeni dataset yapısı:")
    print(f"   {output_images_dir}/train/")
    print(f"   {output_images_dir}/val/")
    print(f"   {output_images_dir}/test/")
    print(f"   {output_annotations_dir}/instances_train.json")
    print(f"   {output_annotations_dir}/instances_val.json")
    print(f"   {output_annotations_dir}/instances_test.json")


if __name__ == "__main__":
    # 1. Önce merge et ve ID'leri yeniden numaralandır
    print("=" * 80)
    print("ADIM 1: Split'leri birleştir ve ID'leri yeniden numaralandır")
    print("=" * 80)
    
    train_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\annotations\instances_train.json"
    val_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\annotations\instances_val.json"
    test_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\annotations\instances_test.json"
    merged_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\annotations\all_data.json"
    
    merge_coco_splits_with_reindex(
        train_path=train_path,
        val_path=val_path,
        test_path=test_path,
        output_path=merged_path
    )
    
    # 2. Sonra stratified split yap
    print("\n" + "=" * 80)
    print("ADIM 2: Stratified split yap ve resimleri organize et")
    print("=" * 80)
    
    stratified_split_with_minimum_samples(
        input_json_path=merged_path,
        source_images_dir=r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data",
        output_annotations_dir=r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data_stratified\annotations",
        output_images_dir=r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data_stratified",
        train_ratio=0.8,
        val_ratio=0.1,
        test_ratio=0.1,
        min_samples_per_split=1,
        random_seed=42
    )