import json
import os

def remove_missing_images(json_path, image_dir):
    """Remove annotations and image entries for missing image files"""
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(json_path)}")
    print(f"{'='*60}")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    original_images = len(data['images'])
    original_annotations = len(data['annotations'])
    
    # Check which images exist
    missing_images = []
    valid_images = []
    valid_image_ids = set()
    
    print(f"📁 Checking {original_images} images...")
    
    for img in data['images']:
        img_path = os.path.join(image_dir, img['file_name'])
        
        if os.path.exists(img_path):
            valid_images.append(img)
            valid_image_ids.add(img['id'])
        else:
            missing_images.append(img['file_name'])
    
    # Filter annotations to only keep those with valid images
    valid_annotations = [
        ann for ann in data['annotations'] 
        if ann['image_id'] in valid_image_ids
    ]
    
    removed_annotations = original_annotations - len(valid_annotations)
    
    # Update data
    data['images'] = valid_images
    data['annotations'] = valid_annotations
    
    # Print results
    print(f"\n📊 Results:")
    print(f"   ❌ Missing image files: {len(missing_images)}")
    print(f"   ✅ Valid images: {len(valid_images)}")
    print(f"   🗑️  Removed annotations: {removed_annotations}")
    print(f"   ✅ Remaining annotations: {len(valid_annotations)}")
    
    if missing_images:
        print(f"\n📝 Missing files:")
        for fname in missing_images:
            print(f"   - {fname}")
    
    # Save cleaned data
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n   💾 Saved cleaned dataset")
    
    return len(missing_images), removed_annotations


# Process all splits
base_dir = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data"

datasets = [
    ("annotations/instances_train.json", "train"),
    ("annotations/instances_val.json", "valid"),
    ("annotations/instances_test.json", "test")
]

print(f"{'='*60}")
print(f"🗑️  REMOVING MISSING IMAGE REFERENCES")
print(f"{'='*60}")

total_missing = 0
total_removed_anns = 0

for json_file, img_folder in datasets:
    json_path = os.path.join(base_dir, json_file)
    image_dir = os.path.join(base_dir, img_folder)
    
    if os.path.exists(json_path):
        missing, removed = remove_missing_images(json_path, image_dir)
        total_missing += missing
        total_removed_anns += removed
    else:
        print(f"⚠️  File not found: {json_path}")

print(f"\n{'='*60}")
print(f"🎯 SUMMARY:")
print(f"   📁 Total missing images: {total_missing}")
print(f"   🗑️  Total removed annotations: {total_removed_anns}")
print(f"{'='*60}")
print(f"\n✅ Cleanup complete! Dataset is now ready for training.")
