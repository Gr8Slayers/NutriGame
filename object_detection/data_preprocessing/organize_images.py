#!/usr/bin/env python3
"""
Resimleri JSON split dosyalarına göre organize eden script.
"""

import json
import os
import shutil
from pathlib import Path
from collections import defaultdict

def load_json(file_path):
    """JSON dosyasını yükle"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def collect_all_images(source_dirs, target_dir):
    """
    Birden fazla klasörden tüm resimleri tek klasöre topla
    """
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)
    
    total_copied = 0
    total_exists = 0
    
    print(f"Tüm resimler toplanıyor: {target_dir}")
    
    for source_dir in source_dirs:
        source_path = Path(source_dir)
        if not source_path.exists():
            print(f"⚠️  Kaynak dizin bulunamadı: {source_dir}")
            continue
            
        print(f"Kaynak: {source_dir}")
        
        # Tüm resim dosyalarını bul
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
        
        for ext in image_extensions:
            for img_file in source_path.rglob(f'*{ext}'):
                target_file = target_path / img_file.name
                
                # Eğer dosya zaten varsa atla
                if target_file.exists():
                    total_exists += 1
                    continue
                
                try:
                    shutil.copy2(img_file, target_file)
                    total_copied += 1
                    if total_copied % 1000 == 0:
                        print(f"  Kopyalanan: {total_copied}")
                except Exception as e:
                    print(f"  ❌ Hata: {img_file} -> {e}")
    
    print(f"✅ Toplanan resimler:")
    print(f"   - Yeni kopyalanan: {total_copied}")
    print(f"   - Zaten var olan: {total_exists}")
    print(f"   - Toplam: {total_copied + total_exists}")
    
    return total_copied + total_exists

def organize_images_by_splits(json_files, all_images_dir, output_base_dir):
    """
    JSON split dosyalarına göre resimleri organize et
    """
    all_images_path = Path(all_images_dir)
    output_base_path = Path(output_base_dir)
    
    # Split dosyalarını işle
    for json_file in json_files:
        split_name = Path(json_file).stem.replace('final_', '').replace('_split', '')
        print(f"\n📁 {split_name.upper()} split organize ediliyor...")
        
        # JSON'u yükle
        data = load_json(json_file)
        
        # Output klasörü oluştur
        split_dir = output_base_path / split_name
        split_dir.mkdir(parents=True, exist_ok=True)
        
        # Resim listesi
        image_files = {img['file_name']: img for img in data['images']}
        
        copied_count = 0
        missing_count = 0
        
        for img_filename in image_files.keys():
            source_file = all_images_path / img_filename
            target_file = split_dir / img_filename
            
            if source_file.exists():
                try:
                    # Eğer dosya zaten varsa ve aynıysa atla
                    if target_file.exists() and target_file.stat().st_size == source_file.stat().st_size:
                        continue
                        
                    shutil.copy2(source_file, target_file)
                    copied_count += 1
                    
                    if copied_count % 500 == 0:
                        print(f"  Kopyalanan: {copied_count}")
                        
                except Exception as e:
                    print(f"  ❌ Kopyalama hatası: {img_filename} -> {e}")
            else:
                missing_count += 1
                if missing_count <= 10:  # İlk 10 eksik dosyayı göster
                    print(f"  ❌ Eksik: {img_filename}")
        
        print(f"  ✅ {split_name}: {copied_count} resim kopyalandı")
        if missing_count > 0:
            print(f"  ⚠️  {missing_count} resim bulunamadı")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Resimleri organize et')
    parser.add_argument('--collect-from', nargs='+', help='Toplanacak kaynak dizinler')
    parser.add_argument('--collect-to', help='Tüm resimlerin toplandığı dizin')
    parser.add_argument('--split-jsons', nargs='+', help='Split JSON dosyaları')
    parser.add_argument('--output-dir', help='Organize edilmiş resimlerin çıktı dizini')
    parser.add_argument('--collect-only', action='store_true', help='Sadece toplama işlemi yap')
    
    args = parser.parse_args()
    
    # 1. Resim toplama
    if args.collect_from and args.collect_to:
        total_images = collect_all_images(args.collect_from, args.collect_to)
        print(f"\n📊 Toplam {total_images} resim toplandı")
    
    # 2. Split'lere göre organize etme
    if not args.collect_only and args.split_jsons and args.output_dir:
        organize_images_by_splits(args.split_jsons, args.collect_to, args.output_dir)
        print(f"\n🎉 Resimler {args.output_dir} altında organize edildi!")

if __name__ == '__main__':
    main()