import json
import os

def remove_images_without_annotations(input_json_path: str, output_json_path: str):
    """
    Bir COCO formatındaki annotation dosyasını okur ve hiç annotation'ı olmayan
    görselleri 'images' listesinden kaldırır.

    Args:
        input_json_path (str): İşlem yapılacak orijinal annotation dosyasının yolu.
        output_json_path (str): Temizlenmiş verinin kaydedileceği yeni dosyanın yolu.
    """
    print(f"Annotation dosyası yükleniyor: {input_json_path}")
    
    try:
        with open(input_json_path, 'r', encoding='utf-8') as f:
            coco_data = json.load(f)
    except FileNotFoundError:
        print(f"HATA: '{input_json_path}' adında bir dosya bulunamadı.")
        return
    except json.JSONDecodeError:
        print(f"HATA: '{input_json_path}' dosyası geçerli bir JSON formatında değil.")
        return

    # Adım 1: En az bir annotation'ı olan tüm 'image_id'lerini topla.
    # set kullanmak, her ID'nin sadece bir kez eklenmesini ve hızlı kontrolü sağlar.
    print("Hangi görsellerin annotation'ı olduğu taranıyor...")
    image_ids_with_annotations = {ann['image_id'] for ann in coco_data['annotations']}
    
    if not image_ids_with_annotations:
        print("UYARI: Dosyada hiç annotation bulunamadı. Hiçbir görsel korunmayacak.")

    # Adım 2: 'images' listesini bu sete göre filtrele.
    original_image_count = len(coco_data['images'])
    
    filtered_images = [
        image for image in coco_data['images'] 
        if image['id'] in image_ids_with_annotations
    ]
    
    new_image_count = len(filtered_images)
    
    # Adım 3: 'images' listesini güncellenmiş haliyle değiştir.
    coco_data['images'] = filtered_images
    
    # Adım 4: Yeni JSON dosyasını kaydet.
    print(f"Temizlenmiş annotation dosyası kaydediliyor: {output_json_path}")
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(coco_data, f, indent=4, ensure_ascii=False)
        
    # Özet bilgisi yazdır
    print("\n" + "-"*30)
    print("İşlem Başarıyla Tamamlandı!")
    print(f"Orijinal görsel sayısı: {original_image_count}")
    print(f"Kalan (etiketli) görsel sayısı: {new_image_count}")
    print(f"Kaldırılan (etiketsiz) görsel sayısı: {original_image_count - new_image_count}")
    print("-" * 30)


import time

def delete_orphan_image_files(
    final_json_path: str, 
    image_directory_path: str,
    # Hangi uzantılara sahip dosyaların resim olarak kabul edileceğini belirtir
    image_extensions=('.jpg', '.jpeg', '.png', '.bmp', '.gif') 
):
    """
    Bir COCO JSON dosyasını okur, resim klasöründeki dosyalarla karşılaştırır
    ve JSON'da referansı olmayan resim dosyalarını kalıcı olarak siler.

    Args:
        final_json_path (str): Sadece korunacak görselleri içeren, son ve
                               temizlenmiş annotation dosyasının yolu.
        image_directory_path (str): Resim dosyalarının bulunduğu klasörün yolu.
        image_extensions (tuple): Resim dosyası olarak kabul edilecek uzantılar.
    """
    # Adım 1: JSON dosyasını yükle ve korunacak dosya adlarını bir set'e al.
    # Set, listeye göre çok daha hızlı 'içinde var mı?' kontrolü yapar.
    try:
        with open(final_json_path, 'r', encoding='utf-8') as f:
            coco_data = json.load(f)
        
        # 'images' listesindeki her bir resmin 'file_name' alanını alıyoruz.
        files_to_keep = {image['file_name'] for image in coco_data['images']}
        
        print(f"✔️ '{final_json_path}' dosyasından korunacak {len(files_to_keep)} resim adı başarıyla okundu.")

    except FileNotFoundError:
        print(f"❌ HATA: Annotation dosyası bulunamadı: '{final_json_path}'")
        return
    except KeyError:
        print(f"❌ HATA: JSON dosyasında 'images' anahtarı bulunamadı. Lütfen dosya formatını kontrol edin.")
        return

    # Adım 2: Resim klasöründeki tüm dosyaları tara.
    try:
        # Sadece belirtilen uzantılara sahip dosyaları alıyoruz.
        files_on_disk = {
            f for f in os.listdir(image_directory_path) 
            if os.path.isfile(os.path.join(image_directory_path, f)) and f.lower().endswith(image_extensions)
        }
        print(f"✔️ '{image_directory_path}' klasöründe {len(files_on_disk)} resim dosyası bulundu.")
        
    except FileNotFoundError:
        print(f"❌ HATA: Resim klasörü bulunamadı: '{image_directory_path}'")
        return

    # Adım 3: Silinecek dosyaları belirle (diskte olan ama korunacaklar listesinde olmayanlar).
    files_to_delete = files_on_disk - files_to_keep
    
    if not files_to_delete:
        print("\n🎉 Harika! Klasör zaten temiz. Silinecek gereksiz resim dosyası bulunamadı.")
        return

    print("\n" + "="*50)
    print(f"⚠️  DİKKAT: {len(files_to_delete)} adet resim dosyası silinmek üzere bulundu.")
    print("="*50)
    
    # Kullanıcıya silinecek bazı dosyaları örnek olarak göster
    print("Silinecek dosyalardan bazıları:")
    for filename in list(files_to_delete)[:5]:
        print(f"  - {filename}")
    if len(files_to_delete) > 5:
        print("  ...")

    # Adım 4: GÜVENLİK ONAYI - En önemli adım!
    print(f"\nBu dosyalar '{image_directory_path}' klasöründen KALICI OLARAK silinecektir.")
    
    # Kullanıcıya son bir düşünme süresi verelim
    try:
        for i in range(5, 0, -1):
            print(f"İşlem {i} saniye içinde onayınızı bekliyor...", end='\r')
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nİşlem kullanıcı tarafından iptal edildi.")
        return
        
    print("\n")
    confirm = input("Devam etmek ve bu dosyaları silmek için 'yes' yazın: ")

    if confirm.lower() == 'yes':
        print("\nSilme işlemi başlatılıyor...")
        deleted_count = 0
        for filename in files_to_delete:
            file_path = os.path.join(image_directory_path, filename)
            try:
                os.remove(file_path)
                deleted_count += 1
                # Çok fazla dosya varsa ekranı doldurmamak için her 100 dosyada bir bildirim ver
                if deleted_count % 100 == 0:
                     print(f"{deleted_count} dosya silindi...", end='\r')
            except OSError as e:
                print(f"❌ HATA: '{filename}' silinirken bir hata oluştu: {e}")
        
        print(f"\n✔️ İşlem tamamlandı. Toplam {deleted_count} dosya başarıyla silindi.")
    else:
        print("\nİptal edildi. Hiçbir dosya silinmedi.")

# --- KODU ÇALIŞTIR ---
if __name__ == '__main__':
    base_dir = r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged_fixed'  
    splits = ['train', 'test', 'valid']

    for split in splits:
        input_file = os.path.join(base_dir, split, '_annotations.coco.json')
        output_file = os.path.join(base_dir, split, '_annotations.coco.json')
        remove_images_without_annotations(input_file, output_file)

        image_dir = os.path.join(base_dir, split)
        delete_orphan_image_files(output_file, image_dir)

