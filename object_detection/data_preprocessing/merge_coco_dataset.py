import json
import shutil
import os


def merge_coco_datasets(coco_files, image_paths, output_file, output_image_dir, category_mapping, master_categories):
    merged_data = merge_coco_annotations(coco_files, category_mapping, master_categories)
    merge_images(image_paths, output_image_dir)

    # Save the merged dataset
    with open(output_file, 'w') as f:
        json.dump(merged_data, f, indent=4)


def merge_images(image_dir_paths, output_dir):
    # Combine the merged data and images
    os.makedirs(output_dir, exist_ok=True)
    for image_dir in image_dir_paths:
        for filename in os.listdir(image_dir):
            if filename.endswith(('.jpg', '.jpeg', '.png')):
                src_path = os.path.join(image_dir, filename)
                dst_path = os.path.join(output_dir, filename)
                # print(f'Copying {src_path} to {dst_path}')
                shutil.copy2(src_path, dst_path)



def merge_coco_annotations(coco_files, category_mapping, master_categories):
    merged_data = {
        "images": [],
        "annotations": [],
        "categories": master_categories
    }

    image_id_offset = 0
    annotation_id_offset = 0

    for coco_file in coco_files:
        with open(coco_file, 'r') as f:
            coco_data = json.load(f)

        # Create a local mapping from old category ID to its name for the current file
        local_category_id_to_name = {cat['id']: cat['name'] for cat in coco_data['categories']}

        # Merge images
        for image in coco_data['images']:
            new_image = image.copy()
            new_image['id'] += image_id_offset
            merged_data['images'].append(new_image)

        # Merge annotations
        for annotation in coco_data['annotations']:
            new_annotation = annotation.copy()
            new_annotation['id'] += annotation_id_offset
            new_annotation['image_id'] += image_id_offset
            
            original_category_id = annotation['category_id']
            if original_category_id in local_category_id_to_name:
                original_category_name = local_category_id_to_name[original_category_id]
                if original_category_name in category_mapping:
                    new_annotation['category_id'] = category_mapping[original_category_name]
                    merged_data['annotations'].append(new_annotation)

        image_id_offset += len(coco_data['images'])
        # Find the max annotation ID in the current file to correctly calculate the next offset
        max_ann_id = max([ann['id'] for ann in coco_data['annotations']], default=0)
        annotation_id_offset += max_ann_id + 1

    # Re-index annotation IDs to be sequential
    for i, ann in enumerate(merged_data['annotations']):
        ann['id'] = i + 1
        
    return merged_data

def main():

    coco_file_list = [
        # train dataset
        [# r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\GFSD\annotations\instances_train.json',
        r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\Nutrition5k\annotations\instances_train.json',
        r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\roboflow\train\_annotations.coco.json'
        ],

        # test dataset
        [# r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\GFSD\annotations\instances_test.json',
        r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\Nutrition5k\annotations\instances_test.json',
        r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\roboflow\test\_annotations.coco.json'
        ],

        # validation dataset
        [# r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\GFSD\annotations\instances_val.json',
        r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\Nutrition5k\annotations\instances_val.json',
        r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\roboflow\valid\_annotations.coco.json'
        ],

    ]

    image_dir_list = [
        # train dataset
        [# r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\GFSD\train\images',
         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\Nutrition5k\train\images',
         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\roboflow\train'
        ],

        # test dataset
        [# r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\GFSD\test\images',
         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\Nutrition5k\test\images',
         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\roboflow\test'
        ],

        # validation dataset
        [# r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\GFSD\val\images',
         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\Nutrition5k\val\images',
         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\roboflow\valid'
        ]
    ]

    output_files = [r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged\instances_train.json',
                    r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged\instances_test.json',
                    r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged\instances_val.json']

    output_image_dirs = [r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged\train',
                         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged\test',
                         r'D:\Datalarım\Desktop\Bitirme\object_detection\data\dataset\merged\valid']

    # 1. Create a master category mapping across all datasets
    print("Creating master category list...")
    category_mapping = {}
    master_categories = []
    category_id_counter = 0  # Start from 0 for RF-DETR compatibility
    all_coco_files = [file for sublist in coco_file_list for file in sublist]

    for coco_file in all_coco_files:
        with open(coco_file, 'r') as f:
            coco_data = json.load(f)
        for category in coco_data['categories']:
            if category['name'] not in category_mapping:
                category_mapping[category['name']] = category_id_counter
                new_category = {
                    "id": category_id_counter,
                    "name": category['name'],
                    "supercategory": category.get('supercategory', '')
                }
                master_categories.append(new_category)
                category_id_counter += 1
    
    print(f"Found {len(master_categories)} unique categories.")

    # 2. Merge each dataset split using the master category mapping
    for i in range(3):
        coco_files = coco_file_list[i]
        image_dirs = image_dir_list[i]
        output_file = output_files[i]
        output_image_dir = output_image_dirs[i]
        
        split_name = os.path.basename(output_image_dir)
        print(f"\n--- Merging '{split_name}' dataset ---")
        
        merge_coco_datasets(coco_files, image_dirs, output_file, output_image_dir, category_mapping, master_categories)
        print(f"Finished merging for '{split_name}'. Annotations saved to {output_file}")

if __name__ == "__main__":
    main()