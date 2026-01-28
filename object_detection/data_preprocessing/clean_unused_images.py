#!/usr/bin/env python3
"""
Annotation'u olmayan resimleri analiz eden script.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

def load_json(file_path):
    """JSON dosyasını yükle"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_unused_images(json_files, image_dirs):
    """
    JSON dosyalarında annotation'u olan resimleri bul,
    kullanılmayan resimleri tespit et
    """
    # Tüm JSON'lardan kullanılan resimleri topla
    used_images = set()
    total_annotations = 0
    
    print("📊 JSON dosyaları analiz ediliyor...")
    for json_file in json_files:
        if os.path.exists(json_file):
            data = load_json(json_file)
            split_name = Path(json_file).stem
            
            # Bu split'teki resim sayısı
            image_count = len(data['images'])
            annotation_count = len(data['annotations'])
            
            print(f"  {split_name}: {image_count} resim, {annotation_count} annotation")
            
            # Resim isimlerini kaydet
            for img in data['images']:
                used_images.add(img['file_name'])
            
            total_annotations += annotation_count
    
    print(f"  Toplam kullanılan resim: {len(used_images)}")
    print(f"  Toplam annotation: {total_annotations}")
    
    # Disk üzerindeki tüm resimleri analiz et
    print(f"\n🗂️ Disk resimleri analiz ediliyor...")
    
    all_images = set()
    total_size_mb = 0
    unused_images = []
    unused_size_mb = 0
    
    for image_dir in image_dirs:
        img_path = Path(image_dir)
        if not img_path.exists():
            print(f"  ⚠️ Dizin bulunamadı: {image_dir}")
            continue
            
        print(f"  Dizin: {image_dir}")
        
        # Resim dosyalarını bul
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
        dir_images = 0
        dir_size_mb = 0
        
        for ext in image_extensions:
            for img_file in img_path.rglob(f'*{ext}'):
                file_size_mb = img_file.stat().st_size / (1024 * 1024)
                all_images.add(img_file.name)
                total_size_mb += file_size_mb
                dir_images += 1
                dir_size_mb += file_size_mb
                
                # Eğer bu resim JSON'larda kullanılmıyorsa
                if img_file.name not in used_images:
                    unused_images.append({
                        'name': img_file.name,
                        'path': str(img_file),
                        'size_mb': file_size_mb
                    })
                    unused_size_mb += file_size_mb
        
        print(f"    {dir_images} resim, {dir_size_mb:.1f} MB")
    
    # Sonuçları göster
    print(f"\n📈 ANALIZ SONUÇLARI:")
    print(f"  🖼️  Toplam disk resimleri: {len(all_images)}")
    print(f"  💾 Toplam disk boyutu: {total_size_mb:.1f} MB")
    print(f"  ✅ Kullanılan resimler: {len(used_images)}")
    print(f"  ❌ Kullanılmayan resimler: {len(unused_images)}")
    print(f"  🗑️  Kullanılmayan boyut: {unused_size_mb:.1f} MB ({unused_size_mb/total_size_mb*100:.1f}%)")
    
    # Kullanılmayan resimlerin detayları
    if unused_images:
        print(f"\n🗂️ KULLANILMAYAN RESİMLER (ilk 20):")
        for i, img in enumerate(unused_images[:20]):
            print(f"  {i+1:2d}. {img['name']} ({img['size_mb']:.2f} MB)")
        
        if len(unused_images) > 20:
            print(f"  ... ve {len(unused_images) - 20} tane daha")
    
    return unused_images, unused_size_mb

def delete_unused_images(unused_images):
    """Kullanılmayan resimleri sil"""
    if not unused_images:
        print("Silinecek resim yok!")
        return
    
    print(f"\n🗑️ {len(unused_images)} resim siliniyor...")
    
    deleted_count = 0
    deleted_size_mb = 0
    error_count = 0
    
    for img in unused_images:
        try:
            img_path = Path(img['path'])
            if img_path.exists():
                img_path.unlink()
                deleted_count += 1
                deleted_size_mb += img['size_mb']
                
                if deleted_count % 1000 == 0:
                    print(f"  Silinen: {deleted_count}")
            
        except Exception as e:
            error_count += 1
            if error_count <= 5:  # İlk 5 hatayı göster
                print(f"  ❌ Silme hatası: {img['name']} -> {e}")
    
    print(f"  ✅ {deleted_count} resim silindi")
    print(f"  💾 {deleted_size_mb:.1f} MB disk alanı açıldı")
    if error_count > 0:
        print(f"  ⚠️ {error_count} dosyada hata oluştu")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Kullanılmayan resimleri analiz et/sil')
    parser.add_argument('--json-files', nargs='+', required=True, help='JSON split dosyaları')
    parser.add_argument('--image-dirs', nargs='+', required=True, help='Resim dizinleri')
    parser.add_argument('--delete', action='store_true', help='Kullanılmayan resimleri sil')
    parser.add_argument('--confirm', action='store_true', help='Silme işlemini onaylayın')
    
    args = parser.parse_args()
    
    # Analiz yap
    unused_images, unused_size_mb = analyze_unused_images(args.json_files, args.image_dirs)
    
    # Silme işlemi
    if args.delete:
        if not unused_images:
            print("\n✅ Silinecek resim yok - her şey temiz!")
            return
            
        if not args.confirm:
            print(f"\n⚠️  DİKKAT: {len(unused_images)} resim ({unused_size_mb:.1f} MB) silinecek!")
            print("Emin misiniz? --confirm parametresi ekleyin")
            return
            
        delete_unused_images(unused_images)
        print("\n🎉 Temizlik tamamlandı!")
    else:
        if unused_images:
            print(f"\n💡 Silmek için: --delete --confirm parametrelerini ekleyin")

if __name__ == '__main__':
    main()