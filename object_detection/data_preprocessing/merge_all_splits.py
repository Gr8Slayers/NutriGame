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




if __name__ == "__main__":
    # 1. Önce merge et ve ID'leri yeniden numaralandır
    print("=" * 80)
    print("ADIM 1: Split'leri birleştir ve ID'leri yeniden numaralandır")
    print("=" * 80)
    
    train_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\_train.json"
    val_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\_valid.json"
    test_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\_test.json"
    merged_path = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\data\all_data_merged.json"
    
    merge_coco_splits_with_reindex(
        train_path=train_path,
        val_path=val_path,
        test_path=test_path,
        output_path=merged_path
    )
    
