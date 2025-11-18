import json
import os

def validate_and_fix_dataset(json_path):
    """Validate and fix COCO dataset"""
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(json_path)}")
    print(f"{'='*60}")
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Get image dimensions
    img_dims = {img['id']: (img['width'], img['height']) for img in data['images']}
    num_categories = len(data['categories'])
    
    print(f"Total images: {len(data['images'])}")
    print(f"Total annotations: {len(data['annotations'])}")
    print(f"Total categories: {num_categories}")
    print(f"Category ID range: 0 to {num_categories-1}")
    
    valid_annotations = []
    stats = {
        'negative_coords': 0,
        'invalid_size': 0,
        'out_of_bounds': 0,
        'invalid_category': 0,
        'missing_image': 0,
        'total_removed': 0
    }
    
    for ann in data['annotations']:
        # Check if image exists
        img_id = ann['image_id']
        if img_id not in img_dims:
            stats['missing_image'] += 1
            continue
        
        # Check category ID
        cat_id = ann['category_id']
        if cat_id < 0 or cat_id >= num_categories:
            stats['invalid_category'] += 1
            print(f"  ⚠️ Invalid category_id: {cat_id} (must be 0-{num_categories-1})")
            continue
        
        # Get image dimensions
        img_width, img_height = img_dims[img_id]
        x, y, width, height = ann['bbox']
        
        # Check for negative coordinates
        if x < 0 or y < 0:
            stats['negative_coords'] += 1
            continue
        
        # Check for invalid size
        if width <= 0 or height <= 0:
            stats['invalid_size'] += 1
            continue
        
        # Check if bbox exceeds image boundaries
        if x + width > img_width or y + height > img_height:
            stats['out_of_bounds'] += 1
            continue
        
        # Valid annotation
        valid_annotations.append(ann)
    
    # Calculate total removed
    stats['total_removed'] = len(data['annotations']) - len(valid_annotations)
    
    # Print statistics
    print(f"\n📊 Validation Results:")
    print(f"  ❌ Negative coordinates: {stats['negative_coords']}")
    print(f"  ❌ Invalid size (w/h ≤ 0): {stats['invalid_size']}")
    print(f"  ❌ Out of bounds: {stats['out_of_bounds']}")
    print(f"  ❌ Invalid category ID: {stats['invalid_category']}")
    print(f"  ❌ Missing image: {stats['missing_image']}")
    print(f"  {'─'*50}")
    print(f"  🗑️  Total removed: {stats['total_removed']}")
    print(f"  ✅ Valid annotations: {len(valid_annotations)}")
    
    # Update data
    data['annotations'] = valid_annotations
    
    # Save fixed dataset
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"  💾 Saved fixed dataset to {json_path}")
    
    return stats

# Process all splits
base_dir = "/content/merged"
splits = ['train', 'test', 'val']

total_stats = {
    'negative_coords': 0,
    'invalid_size': 0,
    'out_of_bounds': 0,
    'invalid_category': 0,
    'missing_image': 0,
    'total_removed': 0
}

for split in splits:
    json_path = os.path.join(base_dir, f'instances_{split}.json')
    if os.path.exists(json_path):
        stats = validate_and_fix_dataset(json_path)
        for key in total_stats:
            total_stats[key] += stats[key]

print(f"\n{'='*60}")
print(f"OVERALL SUMMARY")
print(f"{'='*60}")
print(f"Total annotations removed: {total_stats['total_removed']}")
print(f"  - Negative coordinates: {total_stats['negative_coords']}")
print(f"  - Invalid size: {total_stats['invalid_size']}")
print(f"  - Out of bounds: {total_stats['out_of_bounds']}")
print(f"  - Invalid category ID: {total_stats['invalid_category']}")
print(f"  - Missing image: {total_stats['missing_image']}")
print(f"\n✅ Dataset validation and cleanup complete!")
