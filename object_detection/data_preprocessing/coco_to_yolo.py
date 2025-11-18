import json
import os

def convert_coco_to_yolo(coco_annotations, image_size):
    yolo_annotations = []
    width, height = image_size

    for annotation in coco_annotations:
        bbox = annotation['bbox']
        x_min = bbox[0]
        y_min = bbox[1]
        box_width = bbox[2]
        box_height = bbox[3]

        x_center = x_min + box_width / 2
        y_center = y_min + box_height / 2

        # Normalize coordinates
        x_center /= width
        y_center /= height
        box_width /= width
        box_height /= height

        yolo_annotations.append([annotation['category_id'], x_center, y_center, box_width, box_height])

    return yolo_annotations

def main():
    coco_annotation_file = 'path/to/coco/annotations.json'
    output_dir = 'path/to/yolo/annotations/'

    with open(coco_annotation_file, 'r') as f:
        coco_data = json.load(f)

    images_info = {img['id']: img for img in coco_data['images']}
    annotations_info = {}

    for annotation in coco_data['annotations']:
        image_id = annotation['image_id']
        if image_id not in annotations_info:
            annotations_info[image_id] = []
        annotations_info[image_id].append(annotation)

    for image_id, image_info in images_info.items():
        image_size = (image_info['width'], image_info['height'])
        coco_annotations = annotations_info.get(image_id, [])
        yolo_annotations = convert_coco_to_yolo(coco_annotations, image_size)

        yolo_file_path = os.path.join(output_dir, f"{os.path.splitext(image_info['file_name'])[0]}.txt")
        with open(yolo_file_path, 'w') as yolo_file:
            for yolo_ann in yolo_annotations:
                yolo_file.write(' '.join(map(str, yolo_ann)) + '\n')

if __name__ == "__main__":
    main()
