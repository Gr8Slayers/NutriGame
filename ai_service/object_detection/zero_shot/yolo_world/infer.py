from ultralytics import YOLOWorld
import cv2

# Initialize a YOLO-World model
model = YOLOWorld("yolov8x-worldv2.pt")  # or select yolov8m/l-world.pt for different sizes
classes = ["a portion of karniyarik", "stuffed eggplant", "parsley","pizza","ramen","egg","cucumber","tomato","onion","garlic","meat","rice","potato","karnıyarık","yoghurt"]
model.set_classes(classes)

# Execute inference with the YOLOv8s-world model on the specified image
results = model.predict(r"D:\Datalarım\Desktop\Bitirme\object_detection\zero_shot\karnıyarık.jpg")

# Show results
cv2.imwrite(r"D:\Datalarım\Desktop\Bitirme\object_detection\zero_shot\yolo_world\karnıyarık_result.jpg", results[0].plot())
