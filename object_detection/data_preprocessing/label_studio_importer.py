import argparse
import json
import os
import base64
from label_studio_sdk import Client


def coco_ann_importer(images_path, annotations_path, port, token):
    """
    COCO formatındaki annotasyonları Label Studio'ya import eder.
    """
    ls_url = f"http://localhost:{port}"
    ls = Client(url=ls_url, api_key=token)
    
    # COCO annotasyon dosyasını yükle
    with open(annotations_path, 'r', encoding='utf-8') as f:
        coco_data = json.load(f)
    
    # Image ID'lere göre annotasyonları grupla
    image_annotations = {}
    for ann in coco_data.get('annotations', []):
        img_id = ann['image_id']
        if img_id not in image_annotations:
            image_annotations[img_id] = []
        image_annotations[img_id].append(ann)
    
    # Category ID'leri mapping'ini oluştur
    categories = {cat['id']: cat['name'] for cat in coco_data.get('categories', [])}
    
    # Proje oluştur
    try:
        projects = ls.list_projects()
        if projects:
            project = projects[0]
            print(f"Mevcut projeye ekleniyor: {project.title}")
            project_id = project.id
        else:
            label_config = """
            <View>
              <Image name="image" value="$image"/>
              <RectangleLabels name="label" toName="image">
                """ + "".join([f'<Label value="{cat}"/>' for cat in categories.values()]) + """
              </RectangleLabels>
            </View>
            """
            
            project = ls.create_project(
                title="Food Detection COCO Import",
                label_config=label_config
            )
            project_id = project.id
            print(f"Yeni proje oluşturuldu: {project.title}")
        
        # Her resim için task oluştur
        tasks = []
        for idx, img in enumerate(coco_data.get('images', []), 1):
            img_filename = img['file_name']
            img_path = os.path.join(images_path, img_filename)
            
            if not os.path.exists(img_path):
                print(f"Uyarı: {img_path} bulunamadı, atlanıyor...")
                continue
            
            # Resmi base64'e çevir
            try:
                with open(img_path, 'rb') as f:
                    img_data = base64.b64encode(f.read()).decode('utf-8')
            except Exception as e:
                print(f"Hata: {img_filename} okunamadı - {e}")
                continue
            
            # Dosya uzantısını al
            ext = os.path.splitext(img_filename)[1].lower()
            mime_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.bmp': 'image/bmp',
                '.webp': 'image/webp'
            }
            mime_type = mime_types.get(ext, 'image/jpeg')
            
            # Task data'sını hazırla - base64 VE metadata birlikte
            task_data = {
                "image": f"data:{mime_type};base64,{img_data}",
                "local_filename": img_filename,  # ← Metadata buraya
                "image_id": img['id'],
                "width": img.get('width'),
                "height": img.get('height')
            }
            
            # Annotasyonları hazırla
            predictions = []
            if img['id'] in image_annotations:
                annotations = []
                for ann in image_annotations[img['id']]:
                    bbox = ann['bbox']
                    category_name = categories.get(ann['category_id'], 'unknown')
                    
                    img_width = img['width']
                    img_height = img['height']
                    
                    x_percent = (bbox[0] / img_width) * 100
                    y_percent = (bbox[1] / img_height) * 100
                    width_percent = (bbox[2] / img_width) * 100
                    height_percent = (bbox[3] / img_height) * 100
                    
                    annotation = {
                        "value": {
                            "x": x_percent,
                            "y": y_percent,
                            "width": width_percent,
                            "height": height_percent,
                            "rotation": 0,
                            "rectanglelabels": [category_name]
                        },
                        "from_name": "label",
                        "to_name": "image",
                        "type": "rectanglelabels"
                    }
                    annotations.append(annotation)
                
                predictions = [{
                    "result": annotations
                }]
            
            task = {
                "data": task_data  # Meta ayrı değil, data içinde
            }
            
            if predictions:
                task["predictions"] = predictions
            
            tasks.append(task)
            
            # Her 100 resimde bir ilerleme göster
            if idx % 100 == 0:
                print(f"Hazırlandı: {idx}/{len(coco_data['images'])}")
        
        # Task'ları import et
        print(f"\n{len(tasks)} task import ediliyor...")
        
        # Batch halinde import et (her seferde 100 task)
        batch_size = 100
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i+batch_size]
            project.import_tasks(batch)
            print(f"Import edildi: {min(i+batch_size, len(tasks))}/{len(tasks)}")
        
        print(f"✅ {len(tasks)} task başarıyla import edildi!")
        print(f"Proje ID: {project_id}")
        
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")
        import traceback
        traceback.print_exc()
        raise


def main():
    parser = argparse.ArgumentParser(
        description='COCO formatındaki annotasyonları Label Studio\'ya import eder.'
    )
    
    parser.add_argument('--images_path', type=str, required=True,
                       help='Resimlerin bulunduğu klasör yolu')
    parser.add_argument('--annotations_path', type=str, required=True,
                       help='COCO formatındaki annotasyon dosyasının yolu')
    parser.add_argument('--port', type=str, required=True,
                       help='Label Studio port numarası')
    parser.add_argument('--token', type=str, required=True,
                       help='Label Studio API token')
    
    args = parser.parse_args()
    
    print(f"Images Path: {args.images_path}")
    print(f"Annotations Path: {args.annotations_path}")
    print(f"Port: {args.port}")
    print("Token: ***")
    print("-" * 50)
    
    coco_ann_importer(
        images_path=args.images_path,
        annotations_path=args.annotations_path,
        port=args.port,
        token=args.token
    )


if __name__ == "__main__":
    main()