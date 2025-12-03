"""
Roboflow'a toplu veri yükleme scripti
COCO formatındaki veri setinizi Roboflow'a yükler
"""

from roboflow import Roboflow
import os
import glob
from pathlib import Path

# API Key - "Private API Key" kullanın (web arayüzünde göz ikonuna basarak görebilirsiniz)
# Settings > Roboflow API > Private API Key (••••••••••)
API_KEY = "sDi5WbWsM5oPhoeL7BlW"  # Noktalı olan API key'i göz ikonuna basıp kopyalayın

# Proje bilgileri
WORKSPACE_URL = "food-xslsx"  # check_workspace.py'den aldığımız Workspace URL
PROJECT_NAME = "food-detection-yefje"  # Proje adınız

# Veri seti yolu - Buraya kendi veri setinizin yolunu girin
DATASET_PATH = r"D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged_fixed"

def upload_dataset():
    """
    COCO formatındaki veri setini Roboflow'a yükler
    """
    print("Roboflow'a bağlanılıyor...")
    rf = Roboflow(api_key=API_KEY)
    
    # Workspace'e erişim
    workspace = rf.workspace()
    
    # Projeye erişim - Roboflow'da proje ID genellikle küçük harflerle ve tire ile yazılır
    # Web arayüzünde gördüğünüz "food-detection" tam olarak proje ID'sidir
    print(f"'{PROJECT_NAME}' projesine bağlanılıyor...")
    try:
        # Direkt workspace URL ve proje adı ile erişim
        project = rf.workspace(WORKSPACE_URL).project(PROJECT_NAME)
        print("✅ Proje bulundu!")
    except Exception as e:
        print(f"❌ Projeye erişilemedi: {e}")
        print("\nLütfen web arayüzünde projenizin tam URL'sini kontrol edin:")
        print("https://app.roboflow.com/WORKSPACE-URL/PROJE-ADI")
        print(f"\nŞu an denenen: https://app.roboflow.com/{WORKSPACE_URL}/{PROJECT_NAME}")
        return
    
    print(f"Proje: {PROJECT_NAME}")
    print(f"Veri seti yolu: {DATASET_PATH}\n")
    
    # train, valid, test klasörlerini tara
    for split in ['train', 'valid', 'test']:
        split_path = os.path.join(DATASET_PATH, split)
        
        if not os.path.exists(split_path):
            print(f"⚠️  {split} klasörü bulunamadı: {split_path}")
            continue
            
        # Resimleri bul (jpg, jpeg, png)
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        image_files = []
        for ext in image_extensions:
            image_files.extend(glob.glob(os.path.join(split_path, ext)))
        
        # Test için sadece ilk 1000 resmi al
        MAX_IMAGES_PER_SPLIT = 1000
        if len(image_files) > MAX_IMAGES_PER_SPLIT:
            print(f"\n📁 {split.upper()} klasörü: {len(image_files)} resim bulundu (İlk {MAX_IMAGES_PER_SPLIT} resim yüklenecek)")
            image_files = image_files[:MAX_IMAGES_PER_SPLIT]
        else:
            print(f"\n📁 {split.upper()} klasörü: {len(image_files)} resim bulundu")
        
        # COCO annotation dosyasını bul
        annotation_file = os.path.join(split_path, f"instances_{split}.json")
        if not os.path.exists(annotation_file):
            # Alternatif isimler dene
            annotation_file = os.path.join(split_path, "_annotations.coco.json")
        
        if not os.path.exists(annotation_file):
            print(f"⚠️  Annotation dosyası bulunamadı: {split}")
            continue
        
        print(f"   Annotation dosyası: {os.path.basename(annotation_file)}")
        
        # Resimleri yükle
        uploaded_count = 0
        failed_count = 0
        
        for i, image_path in enumerate(image_files, 1):
            try:
                # Her 10 resimde bir ilerleme göster
                if i % 10 == 0 or i == 1:
                    print(f"   Yükleniyor: {i}/{len(image_files)}", end='\r')
                
                # Roboflow'a yükle
                project.upload(
                    image_path=image_path,
                    annotation_path=annotation_file,
                    split=split,  # train, valid veya test
                    batch_name=f"{split}_batch_{i//100 + 1}"  # Her 100 resimde bir batch
                )
                uploaded_count += 1
                
            except Exception as e:
                failed_count += 1
                print(f"\n   ❌ Hata ({os.path.basename(image_path)}): {e}")
        
        print(f"\n   ✅ {split.upper()}: {uploaded_count} başarılı, {failed_count} başarısız")
    
    print("\n🎉 Yükleme tamamlandı!")
    print(f"Projenizi kontrol edin: https://app.roboflow.com/{WORKSPACE_URL}/{PROJECT_NAME}")

if __name__ == "__main__":
    # Veri seti yolunu kontrol et
    if not os.path.exists(DATASET_PATH):
        print(f"❌ HATA: Veri seti yolu bulunamadı: {DATASET_PATH}")
        print("\nLütfen DATASET_PATH değişkenini güncelleyin.")
    else:
        upload_dataset()
