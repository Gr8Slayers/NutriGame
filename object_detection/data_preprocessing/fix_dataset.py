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

    print(f"📁 Total images: {len(data['images'])}")
    print(f"📝 Total annotations: {len(data['annotations'])}")
    print(f"🏷️  Total categories: {num_categories}")
    print(f"🔢 Category ID range: 0 to {num_categories-1}")

    # Get all category IDs from annotations
    ann_cat_ids = set(ann['category_id'] for ann in data['annotations'])
    print(f"📊 Unique category IDs in annotations: {len(ann_cat_ids)}")
    print(f"   Min cat ID: {min(ann_cat_ids) if ann_cat_ids else 'N/A'}")
    print(f"   Max cat ID: {max(ann_cat_ids) if ann_cat_ids else 'N/A'}")

    valid_annotations = []
    invalid_examples = []
    stats = {
        'negative_coords': 0,
        'invalid_size': 0,
        'out_of_bounds': 0,
        'invalid_category': 0,
        'missing_image': 0,
    }

    for i, ann in enumerate(data['annotations']):
        # Check if image exists
        img_id = ann['image_id']
        if img_id not in img_dims:
            stats['missing_image'] += 1
            if len(invalid_examples) < 5:
                invalid_examples.append(f"Missing image: ann_id={ann.get('id', i)}, img_id={img_id}")
            continue

        # Check category ID
        cat_id = ann['category_id']
        if cat_id < 0 or cat_id >= num_categories:
            stats['invalid_category'] += 1
            if len(invalid_examples) < 5:
                invalid_examples.append(f"Invalid category: ann_id={ann.get('id', i)}, cat_id={cat_id} (valid: 0-{num_categories-1})")
            continue

        # Get image dimensions
        img_width, img_height = img_dims[img_id]
        x, y, width, height = ann['bbox']

        # Check for negative coordinates
        if x < 0 or y < 0:
            stats['negative_coords'] += 1
            if len(invalid_examples) < 5:
                invalid_examples.append(f"Negative coords: bbox=[{x}, {y}, {width}, {height}]")
            continue

        # Check for invalid size
        if width <= 0 or height <= 0:
            stats['invalid_size'] += 1
            if len(invalid_examples) < 5:
                invalid_examples.append(f"Invalid size: bbox=[{x}, {y}, {width}, {height}]")
            continue

        # Check if bbox exceeds image boundaries
        if x + width > img_width or y + height > img_height:
            stats['out_of_bounds'] += 1
            if len(invalid_examples) < 5:
                invalid_examples.append(f"Out of bounds: bbox=[{x}, {y}, {width}, {height}], img_size=[{img_width}, {img_height}]")
            continue

        # Valid annotation
        valid_annotations.append(ann)

    # Calculate total removed
    total_removed = len(data['annotations']) - len(valid_annotations)

    # Print statistics
    print(f"\n📊 Validation Results:")
    print(f"   ❌ Negative coordinates: {stats['negative_coords']}")
    print(f"   ❌ Invalid size (w/h ≤ 0): {stats['invalid_size']}")
    print(f"   ❌ Out of bounds: {stats['out_of_bounds']}")
    print(f"   ❌ Invalid category ID: {stats['invalid_category']}")
    print(f"   ❌ Missing image: {stats['missing_image']}")
    print(f"   {'─'*50}")
    print(f"   🗑️  Total removed: {total_removed}")
    print(f"   ✅ Valid annotations: {len(valid_annotations)}")

    # Show invalid examples
    if invalid_examples:
        print(f"\n⚠️  First few invalid annotations:")
        for ex in invalid_examples:
            print(f"   - {ex}")

    # Update data
    data['annotations'] = valid_annotations

    # Save fixed dataset
    with open(json_path, 'w') as f:
        json.dump(data, f)

    print(f"   💾 Saved fixed dataset\n")

    return stats, total_removed

# Process all splits
base_dir = r"D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged_fixed"
splits = ['train', 'test', 'valid']

grand_total = 0
for split in splits:
    json_path = f'{base_dir}/{split}/_annotations.coco.json'
    print(json_path)
    if os.path.exists(json_path):
        stats, removed = validate_and_fix_dataset(json_path)
        grand_total += removed
    else:
        print(f"⚠️  File not found: {json_path}")

print(f"\n{'='*60}")
print(f"🎯 GRAND TOTAL: {grand_total} annotations removed across all splits")
print(f"{'='*60}")
print(f"\n✅ Dataset validation and cleanup complete!")