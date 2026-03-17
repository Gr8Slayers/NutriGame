import argparse
import json
import shutil
import struct
from pathlib import Path


def parse_args() -> argparse.Namespace:
	script_dir = Path(__file__).resolve().parent
	default_input = script_dir.parent / "raw_datasets" / "UECFOOD256"
	default_output = script_dir.parent / "raw_datasets" / "uecfood256_coco"

	parser = argparse.ArgumentParser(
		description="Convert UECFOOD256 dataset to COCO format."
	)
	parser.add_argument("--input", type=Path, default=default_input, help="UECFOOD256 root path")
	parser.add_argument(
		"--output",
		type=Path,
		default=default_output,
		help="Output directory for COCO dataset",
	)
	parser.add_argument(
		"--copy-images",
		action="store_true",
		default=True,
		help="Copy images into output images directory (default: enabled)",
	)
	parser.add_argument(
		"--no-copy-images",
		dest="copy_images",
		action="store_false",
		help="Do not copy images; only generate annotations",
	)
	return parser.parse_args()


def read_categories(category_file: Path) -> list[dict]:
	categories = []
	with category_file.open("r", encoding="utf-8") as f:
		for line in f:
			line = line.strip()
			if not line or line.startswith("id\t"):
				continue
			parts = line.split("\t", maxsplit=1)
			if len(parts) != 2:
				continue
			category_id = int(parts[0])
			name = parts[1].strip()
			categories.append({"id": category_id, "name": name, "supercategory": "food"})
	return categories


def read_jpeg_size(image_path: Path) -> tuple[int, int]:
	# Read JPEG dimensions without third-party dependencies.
	with image_path.open("rb") as f:
		if f.read(2) != b"\xff\xd8":
			raise ValueError(f"Unsupported image format (expected JPEG): {image_path}")

		while True:
			marker_start = f.read(1)
			if not marker_start:
				break
			if marker_start != b"\xff":
				continue

			marker = f.read(1)
			while marker == b"\xff":
				marker = f.read(1)
			if not marker:
				break

			marker_int = marker[0]
			if marker_int in {0xD8, 0xD9}:
				continue

			length_bytes = f.read(2)
			if len(length_bytes) != 2:
				break
			seg_len = struct.unpack(">H", length_bytes)[0]
			if seg_len < 2:
				raise ValueError(f"Invalid JPEG segment length in {image_path}")

			# SOF markers carry image height/width.
			if marker_int in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
				sof_data = f.read(seg_len - 2)
				if len(sof_data) < 5:
					break
				height, width = struct.unpack(">HH", sof_data[1:5])
				return width, height

			f.seek(seg_len - 2, 1)

	raise ValueError(f"Could not read JPEG dimensions: {image_path}")


def parse_bb_info(bb_info_path: Path) -> list[tuple[int, int, int, int, int]]:
	records = []
	with bb_info_path.open("r", encoding="utf-8") as f:
		for idx, line in enumerate(f):
			line = line.strip()
			if not line:
				continue
			if idx == 0 and line.lower().startswith("img"):
				continue

			parts = line.split()
			if len(parts) != 5:
				continue

			img_id, x1, y1, x2, y2 = map(int, parts)
			records.append((img_id, x1, y1, x2, y2))
	return records


def convert_uecfood_to_coco(input_root: Path, output_root: Path, copy_images: bool) -> None:
	category_file = input_root / "category.txt"
	if not category_file.exists():
		raise FileNotFoundError(f"category.txt not found: {category_file}")

	annotations_dir = output_root / "annotations"
	images_dir = output_root / "images"
	annotations_dir.mkdir(parents=True, exist_ok=True)
	if copy_images:
		images_dir.mkdir(parents=True, exist_ok=True)

	categories = read_categories(category_file)
	category_ids = {c["id"] for c in categories}

	images = []
	annotations = []
	image_id_map: dict[str, int] = {}
	next_image_id = 1
	next_ann_id = 1

	class_dirs = sorted(
		[p for p in input_root.iterdir() if p.is_dir() and p.name.isdigit()],
		key=lambda p: int(p.name),
	)

	for class_dir in class_dirs:
		category_id = int(class_dir.name)
		if category_id not in category_ids:
			continue

		bb_info_path = class_dir / "bb_info.txt"
		if not bb_info_path.exists():
			continue

		for img_id_raw, x1, y1, x2, y2 in parse_bb_info(bb_info_path):
			filename = f"{img_id_raw}.jpg"
			src_image = class_dir / filename
			if not src_image.exists():
				continue

			if filename not in image_id_map:
				image_id = next_image_id
				next_image_id += 1

				if copy_images:
					dst_image = images_dir / filename
					if not dst_image.exists():
						shutil.copy2(src_image, dst_image)
					image_for_size = dst_image
				else:
					image_for_size = src_image

				img_w, img_h = read_jpeg_size(image_for_size)
				images.append(
					{
						"id": image_id,
						"width": img_w,
						"height": img_h,
						"file_name": filename,
					}
				)
				image_id_map[filename] = image_id

			image_id = image_id_map[filename]

			# Clamp bbox to image boundaries and convert xyxy -> xywh.
			image_entry = images[image_id - 1]
			img_w = image_entry["width"]
			img_h = image_entry["height"]

			x1c = max(0, min(x1, img_w))
			y1c = max(0, min(y1, img_h))
			x2c = max(0, min(x2, img_w))
			y2c = max(0, min(y2, img_h))
			bw = max(1, x2c - x1c)
			bh = max(1, y2c - y1c)

			annotations.append(
				{
					"id": next_ann_id,
					"image_id": image_id,
					"category_id": category_id,
					"bbox": [x1c, y1c, bw, bh],
					"area": bw * bh,
					"iscrowd": 0,
					"segmentation": [],
				}
			)
			next_ann_id += 1

	coco = {
		"info": {
			"description": "UECFOOD256 converted to COCO format",
			"version": "1.0",
			"year": 2026,
		},
		"licenses": [],
		"images": images,
		"annotations": annotations,
		"categories": categories,
	}

	out_file = annotations_dir / "instances_all.json"
	with out_file.open("w", encoding="utf-8") as f:
		json.dump(coco, f, ensure_ascii=False)

	print(f"Conversion complete.")
	print(f"Images: {len(images)}")
	print(f"Annotations: {len(annotations)}")
	print(f"Output annotations: {out_file}")
	if copy_images:
		print(f"Output images: {images_dir}")


def main() -> None:
	args = parse_args()
	convert_uecfood_to_coco(args.input, args.output, args.copy_images)


if __name__ == "__main__":
	main()
