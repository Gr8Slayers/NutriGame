import os


def print_categories(json_path, categories_txt_path):
    """
    Given a COCO-format JSON file, prints out the category IDs and names.
    """
    import json

    print(f"Loading JSON file from: {json_path}")
    with open(json_path, 'r') as f:
        coco_data = json.load(f)

    print("Categories in the dataset:")
    
    with open(categories_txt_path, 'w') as cat_file:
        for category in coco_data.get('categories', []):
            # print(f"{category['id']}: {category['name']}")
            cat_file.write(f"{category['id']}: {category['name']}\n")


def main():
    json_path = r'D:\Desktop\Bitirme\NutriGame\object_detection\data\train\_annotations.coco.json'
    txt_output_path = r'D:\Desktop\Bitirme\NutriGame\object_detection\data_preprocessing\categories.txt'
    print_categories(json_path, txt_output_path)

if __name__ == "__main__":
    main()