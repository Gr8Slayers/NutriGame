import os
import json
from collections import Counter

def print_categories(json_path, categories_txt_path=None):
    """
    COCO-format JSON dosyasından kategori bilgilerini yazdırır
    """
    print(f"Loading JSON file from: {json_path}")
    
    with open(json_path, 'r') as f:
        coco_data = json.load(f)

    categories = coco_data.get('categories', [])
    annotations = coco_data.get('annotations', [])
    
    print(f"\n{'='*80}")
    print(f"KATEGORİ LİSTESİ - {os.path.basename(json_path)}")
    print(f"{'='*80}")
    print(f"Toplam kategori: {len(categories)}")
    print(f"Toplam annotation: {len(annotations)}")
    
    # Kategori kullanım sayıları
    category_usage = Counter(ann['category_id'] for ann in annotations)
    category_id_to_name = {cat['id']: cat['name'] for cat in categories}
    
    print(f"\n{'ID':<3} {'Name':<25} {'Count':<6} {'%':<5}")
    print('-' * 40)
    
    output_lines = []
    
    for category in sorted(categories, key=lambda x: x['id']):
        cat_id = category['id']
        cat_name = category['name']
        count = category_usage.get(cat_id, 0)
        percentage = (count / len(annotations) * 100) if annotations else 0
        
        line = f"{cat_id:<3} {cat_name:<25} {count:<6} {percentage:<5.1f}"
        print(line)
        output_lines.append(f"{cat_id}: {cat_name} ({count} samples)")
    
    if categories_txt_path:
        with open(categories_txt_path, 'w', encoding='utf-8') as cat_file:
            cat_file.write(f"# Categories from {os.path.basename(json_path)}\n")
            cat_file.write(f"# Total categories: {len(categories)}\n")
            cat_file.write(f"# Total annotations: {len(annotations)}\n\n")
            
            for line in output_lines:
                cat_file.write(line + '\n')
        
        print(f"\n✅ Categories saved to: {categories_txt_path}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Print categories from COCO JSON files')
    parser.add_argument('--input', type=str, required=True, help='Input COCO JSON file path')
    parser.add_argument('--output', type=str, help='Output text file path (optional)')
    
    args = parser.parse_args()
    
    # Ana dosyayı analiz et
    print_categories(args.input, args.output)
    
    # Eğer input dosyası train_split.json ise, diğer split dosyalarını da kontrol et
    if args.input.endswith('train_split.json'):
        base_path = args.input.replace('train_split.json', '')
        val_path = base_path + 'val_split.json'
        test_path = base_path + 'test_split.json'
        
        # Val split
        if os.path.exists(val_path):
            print("")  # Boş satır ekle
            print_categories(val_path)
        else:
            print("⚠️  val_split.json bulunamadı!")
            
        # Test split  
        if os.path.exists(test_path):
            print("")  # Boş satır ekle
            print_categories(test_path)
        else:
            print("⚠️  test_split.json bulunamadı!")
    
    # Eğer input dosyası final_train_split.json ise, diğer final split dosyalarını da kontrol et
    elif args.input.endswith('final_train_split.json'):
        base_path = args.input.replace('final_train_split.json', '')
        val_path = base_path + 'final_val_split.json'
        test_path = base_path + 'final_test_split.json'
        
        # Val split
        if os.path.exists(val_path):
            print("")  # Boş satır ekle
            print_categories(val_path)
        else:
            print("⚠️  final_val_split.json bulunamadı!")
            
        # Test split  
        if os.path.exists(test_path):
            print("")  # Boş satır ekle
            print_categories(test_path)
        else:
            print("⚠️  final_test_split.json bulunamadı!")

if __name__ == "__main__":
    main()