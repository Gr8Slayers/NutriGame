from ultralytics import RTDETR

# Load a COCO-pretrained RT-DETR-l model
model = RTDETR("rtdetr-l.pt")

# Train the model on the COCO8 example dataset for 100 epochs
results = model.train(data="D:\\Desktop\\Bitirme\\NutriGame\\object_detection\\finetuning\\rtdetr\\data.yaml", epochs=100, imgsz=640)

