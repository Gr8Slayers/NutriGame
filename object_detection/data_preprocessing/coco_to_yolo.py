#!/usr/bin/env python3
"""
COCO formatından YOLO formatına dönüştürme ve YOLOv8 için klasör yapısı oluşturma scripti.
"""

import json
import os
import shutil
import argparse
import yaml
from pathlib import Path
from collections import defaultdict

def load_coco_data(json_file):
    """COCO JSON dosyasını yükle"""
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def convert_coco_bbox_to_yolo(bbox, image_width, image_height):
    """
    COCO bbox formatından YOLO formatına çevir
    COCO: [x_min, y_min, width, height]
    YOLO: [x_center, y_center, width, height] (normalized 0-1)
    """
    x_min, y_min, width, height = bbox
    
    # Merkez koordinatları
    x_center = x_min + width / 2
    y_center = y_min + height / 2
    
    # Normalize et (0-1 arasına)
    x_center_norm = x_center / image_width
    y_center_norm = y_center / image_height
    width_norm = width / image_width  
    height_norm = height / image_height
    
    return [x_center_norm, y_center_norm, width_norm, height_norm]

def process_split(coco_json_file, images_source_dir, output_base_dir, split_name):
    """
    Bir split'i (train/val/test) işle ve YOLO formatına çevir
    """
    print(f"\n📂 {split_name.upper()} split işleniyor...")
    
    # COCO verisini yükle
    coco_data = load_coco_data(coco_json_file)
    
    # Output klasörlerini oluştur
    output_images_dir = Path(output_base_dir) / "images" / split_name
    output_labels_dir = Path(output_base_dir) / "labels" / split_name
    
    output_images_dir.mkdir(parents=True, exist_ok=True)
    output_labels_dir.mkdir(parents=True, exist_ok=True)
    
    # Split-specific image source directory (train/val/test klasörünü kontrol et)
    split_specific_source = Path(images_source_dir) / split_name
    if split_specific_source.exists():
        actual_images_source = split_specific_source
        print(f"  📁 Resim kaynağı: {actual_images_source}")
    else:
        actual_images_source = Path(images_source_dir)
        print(f"  📁 Resim kaynağı: {actual_images_source}")
    
    # Image ve annotation mapping'i oluştur
    images_dict = {img['id']: img for img in coco_data['images']}
    
    # Her resim için annotation'ları grupla
    annotations_by_image = defaultdict(list)
    for ann in coco_data['annotations']:
        annotations_by_image[ann['image_id']].append(ann)
    
    # Statistikler
    processed_images = 0
    processed_annotations = 0
    copied_images = 0
    missing_images = 0
    
    for image_id, image_info in images_dict.items():
        image_filename = image_info['file_name']
        image_width = image_info['width']
        image_height = image_info['height']
        
        # Resmi kopyala
        source_image_path = actual_images_source / image_filename
        target_image_path = output_images_dir / image_filename
        
        if source_image_path.exists():
            if not target_image_path.exists():
                shutil.copy2(source_image_path, target_image_path)
                copied_images += 1
        else:
            missing_images += 1
            if missing_images <= 5:  # İlk 5 eksik dosyayı göster
                print(f"  ⚠️ Eksik resim: {image_filename}")
            continue
        
        # YOLO label dosyası oluştur
        label_filename = Path(image_filename).stem + '.txt'
        label_path = output_labels_dir / label_filename
        
        # Bu resmin annotation'larını al
        annotations = annotations_by_image.get(image_id, [])
        
        # YOLO formatında label dosyasını yaz
        with open(label_path, 'w') as label_file:
            for ann in annotations:
                category_id = ann['category_id']
                bbox = ann['bbox']
                
                # COCO'dan YOLO formatına çevir
                yolo_bbox = convert_coco_bbox_to_yolo(bbox, image_width, image_height)
                
                # YOLO formatı: class_id x_center y_center width height
                label_line = f"{category_id} {yolo_bbox[0]:.6f} {yolo_bbox[1]:.6f} {yolo_bbox[2]:.6f} {yolo_bbox[3]:.6f}\n"
                label_file.write(label_line)
                
                processed_annotations += 1
        
        processed_images += 1
        
        if processed_images % 1000 == 0:
            print(f"  İşlenen: {processed_images} resim")
    
    print(f"  ✅ {processed_images} resim işlendi")
    print(f"  📊 {processed_annotations} annotation dönüştürüldü")
    print(f"  📁 {copied_images} resim kopyalandı")
    if missing_images > 0:
        print(f"  ⚠️ {missing_images} resim eksik")
    
    return coco_data['categories'], processed_images, processed_annotations

def create_data_yaml(categories, output_dir, dataset_name="Turkish Food Dataset"):
    """
    YOLOv8 için data.yaml dosyasını oluştur
    """
    data_yaml_path = Path(output_dir) / "data.yaml"
    
    # Kategori isimlerini al (ID sırasına göre)
    class_names = [''] * len(categories)  # ID'lere göre sırala
    for cat in categories:
        class_names[cat['id']] = cat['name']
    
    # YAML içeriği
    yaml_content = {
        'path': str(Path(output_dir).absolute()),  # Veri seti kök dizini
        'train': 'images/train',  # Train resim dizini (path'e göre relative)
        'val': 'images/val',      # Val resim dizini
        'test': 'images/test',    # Test resim dizini
        'nc': len(categories),    # Sınıf sayısı
        'names': class_names      # Sınıf isimleri
    }
    
    # YAML dosyasını yaz
    with open(data_yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_content, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    print(f"✅ data.yaml oluşturuldu: {data_yaml_path}")
    print(f"   - Sınıf sayısı: {len(categories)}")
    print(f"   - İlk 5 sınıf: {class_names[:5]}")
    
    return data_yaml_path

def main():
    parser = argparse.ArgumentParser(description='COCO to YOLO Converter for YOLOv8')
    parser.add_argument('--train-json', required=True, help='Train JSON dosyası')
    parser.add_argument('--val-json', required=True, help='Validation JSON dosyası')
    parser.add_argument('--test-json', required=True, help='Test JSON dosyası')
    parser.add_argument('--images-dir', required=True, help='Kaynak resimler dizini')
    parser.add_argument('--output-dir', required=True, help='Çıktı dizini')
    parser.add_argument('--dataset-name', default='Turkish Food Dataset', help='Dataset adı')
    
    args = parser.parse_args()
    
    print("🚀 COCO to YOLO dönüştürme başlıyor...")
    print(f"📁 Çıktı dizini: {args.output_dir}")
    
    # Çıktı dizinini oluştur
    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Her split'i işle
    splits = [
        ('train', args.train_json),
        ('val', args.val_json),
        ('test', args.test_json)
    ]
    
    categories = None
    total_images = 0
    total_annotations = 0
    
    for split_name, json_file in splits:
        if os.path.exists(json_file):
            split_categories, img_count, ann_count = process_split(
                json_file, args.images_dir, args.output_dir, split_name
            )
            
            if categories is None:
                categories = split_categories
            
            total_images += img_count
            total_annotations += ann_count
        else:
            print(f"⚠️ JSON dosyası bulunamadı: {json_file}")
    
    # data.yaml oluştur
    if categories:
        create_data_yaml(categories, args.output_dir, args.dataset_name)
    
    # Özet
    print(f"\n🎉 DÖNÜŞTÜRME TAMAMLANDI!")
    print(f"📊 Toplam: {total_images} resim, {total_annotations} annotation")
    print(f"📁 YOLOv8 formatında hazır: {args.output_dir}")
    
    # Klasör yapısını göster
    print(f"\n📂 Klasör yapısı:")
    print(f"   {args.output_dir}/")
    print(f"   ├── data.yaml")
    print(f"   ├── images/")
    print(f"   │   ├── train/ ({len(list((output_path / 'images' / 'train').glob('*')))} resim)")
    print(f"   │   ├── val/   ({len(list((output_path / 'images' / 'val').glob('*')))} resim)")
    print(f"   │   └── test/  ({len(list((output_path / 'images' / 'test').glob('*')))} resim)")
    print(f"   └── labels/")
    print(f"       ├── train/ ({len(list((output_path / 'labels' / 'train').glob('*.txt')))} label)")
    print(f"       ├── val/   ({len(list((output_path / 'labels' / 'val').glob('*.txt')))} label)")
    print(f"       └── test/  ({len(list((output_path / 'labels' / 'test').glob('*.txt')))} label)")

if __name__ == "__main__":
    main()
