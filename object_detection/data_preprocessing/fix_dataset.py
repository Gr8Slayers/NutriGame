import json
import os

def validate_and_fix_dataset(json_path):
    """Validate and fix COCO dataset - fixes bbox issues instead of removing annotations"""
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(json_path)}")
    print(f"{'='*60}")

    with open(json_path, 'r') as f:
        data = json.load(f)

    # Get image dimensions
    img_dims = {img['id']: (img['width'], img['height']) for img in data['images']}
    num_categories = len(data['categories'])

    print(f"📁 Total images: {len(data['images'])}")
    print(f"📝 Total annotations: {len(data['annotations'])}")
    print(f"🏷️  Total categories: {num_categories}")
    print(f"🔢 Category ID range: 0 to {num_categories-1}")

    # Get all category IDs from annotations
    ann_cat_ids = set(ann['category_id'] for ann in data['annotations'])
    print(f"📊 Unique category IDs in annotations: {len(ann_cat_ids)}")
    print(f"   Min cat ID: {min(ann_cat_ids) if ann_cat_ids else 'N/A'}")
    print(f"   Max cat ID: {max(ann_cat_ids) if ann_cat_ids else 'N/A'}")

    fixed_annotations = []
    removed_annotations = []
    stats = {
        'negative_coords_fixed': 0,
        'out_of_bounds_clipped': 0,
        'invalid_category_removed': 0,
        'missing_image_removed': 0,
        'zero_area_removed': 0,
    }

    for i, ann in enumerate(data['annotations']):
        # Check if image exists
        img_id = ann['image_id']
        if img_id not in img_dims:
            stats['missing_image_removed'] += 1
            removed_annotations.append(f"Missing image: ann_id={ann.get('id', i)}, img_id={img_id}")
            continue

        # Check category ID
        cat_id = ann['category_id']
        if cat_id < 0 or cat_id >= num_categories:
            stats['invalid_category_removed'] += 1
            removed_annotations.append(f"Invalid category: ann_id={ann.get('id', i)}, cat_id={cat_id}")
            continue

        # Get image dimensions
        img_width, img_height = img_dims[img_id]
        x, y, width, height = ann['bbox']
        
        was_fixed = False

        # FIX negative coordinates (floating point errors like -0.004999...)
        if x < 0:
            if x > -1:  # Small negative value, likely floating point error
                x = 0.0
                was_fixed = True
                stats['negative_coords_fixed'] += 1
            else:
                removed_annotations.append(f"Large negative x: bbox=[{x}, {y}, {width}, {height}]")
                stats['missing_image_removed'] += 1
                continue
                
        if y < 0:
            if y > -1:  # Small negative value, likely floating point error
                y = 0.0
                was_fixed = True
                stats['negative_coords_fixed'] += 1
            else:
                removed_annotations.append(f"Large negative y: bbox=[{x}, {y}, {width}, {height}]")
                stats['missing_image_removed'] += 1
                continue

        # FIX out of bounds - clip to image boundaries
        if x + width > img_width:
            width = img_width - x
            was_fixed = True
            stats['out_of_bounds_clipped'] += 1
            
        if y + height > img_height:
            height = img_height - y
            was_fixed = True
            stats['out_of_bounds_clipped'] += 1

        # Check for zero area after fixes
        if width <= 0 or height <= 0:
            stats['zero_area_removed'] += 1
            removed_annotations.append(f"Zero area after fix: bbox=[{x}, {y}, {width}, {height}]")
            continue

        # Update bbox with fixed values
        ann['bbox'] = [x, y, width, height]
        fixed_annotations.append(ann)

    # Calculate total removed
    total_removed = len(data['annotations']) - len(fixed_annotations)
    total_fixed = stats['negative_coords_fixed'] + stats['out_of_bounds_clipped']

    # Print statistics
    print(f"\n📊 Fix Results:")
    print(f"   🔧 Negative coords fixed: {stats['negative_coords_fixed']}")
    print(f"   ✂️  Out of bounds clipped: {stats['out_of_bounds_clipped']}")
    print(f"   ❌ Invalid category removed: {stats['invalid_category_removed']}")
    print(f"   ❌ Missing image removed: {stats['missing_image_removed']}")
    print(f"   ❌ Zero area removed: {stats['zero_area_removed']}")
    print(f"   {'─'*50}")
    print(f"   🔧 Total fixed: {total_fixed}")
    print(f"   🗑️  Total removed: {total_removed}")
    print(f"   ✅ Final annotations: {len(fixed_annotations)}")

    # Show removed examples
    if removed_annotations and len(removed_annotations) <= 10:
        print(f"\n⚠️  Removed annotations:")
        for ex in removed_annotations[:10]:
            print(f"   - {ex}")
    elif removed_annotations:
        print(f"\n⚠️  First 10 removed annotations:")
        for ex in removed_annotations[:10]:
            print(f"   - {ex}")

    # Update data
    data['annotations'] = fixed_annotations

    # Save fixed dataset
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"   💾 Saved fixed dataset\n")

    return stats, total_removed, total_fixed

# Process all splits from annotations folder
base_dir = r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rtdetr\data\annotations"
splits = [
    'instances_train.json',
    'instances_val.json', 
    'instances_test.json'
]

print(f"{'='*60}")
print(f"🔧 FIXING COCO DATASET BBOX ISSUES")
print(f"{'='*60}")

grand_total_removed = 0
grand_total_fixed = 0

for json_file in splits:
    json_path = os.path.join(base_dir, json_file)
    if os.path.exists(json_path):
        stats, removed, fixed = validate_and_fix_dataset(json_path)
        grand_total_removed += removed
        grand_total_fixed += fixed
    else:
        print(f"⚠️  File not found: {json_path}")

print(f"\n{'='*60}")
print(f"🎯 SUMMARY:")
print(f"   🔧 Total fixed: {grand_total_fixed} bboxes")
print(f"   🗑️  Total removed: {grand_total_removed} annotations")
print(f"{'='*60}")
print(f"\n✅ Dataset validation and cleanup complete!")