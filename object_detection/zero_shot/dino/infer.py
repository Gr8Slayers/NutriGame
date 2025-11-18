import matplotlib.pyplot as plt
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
import matplotlib.patches as patches

model_id = "IDEA-Research/grounding-dino-tiny"
device = "cuda" if torch.cuda.is_available() else "cpu"

processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id).to(device)


image = Image.open(r"D:\Datalarım\Desktop\Bitirme\object_detection\zero_shot\karnıyarık.jpg")

# Etiketleri noktalarla ayrılmış tek bir metin olarak veriyoruz.
text = [["parsley", "pizza", "ramen", "egg", "cucumber", "tomato", "onion", "garlic", "meat", "rice", "potato", "karnıyarık", "yoghurt"]]

inputs = processor(images=image, text=text, return_tensors="pt").to(device)
with torch.no_grad():
    outputs = model(**inputs)

# --- ANA DÜZELTME BURADA ---
# 'box_threshold' parametresini 'threshold' olarak değiştiriyoruz.
results = processor.post_process_grounded_object_detection(
    outputs,
    inputs.input_ids,
    threshold=0.4,  # Doğru parametre adı
    text_threshold=0.3,
    target_sizes=[image.size[::-1]]
)

result = results[0]

fig, ax = plt.subplots(1)
ax.imshow(image)
for box, score, labels in zip(result["boxes"], result["scores"], result["labels"]):
    box = [round(x, 2) for x in box.tolist()]
    print(f"Detected '{labels}' with confidence {round(score.item(), 3)} at location {box}")
    x0, y0, x1, y1 = box
    rect = patches.Rectangle((x0, y0), x1-x0, y1-y0, linewidth=2, edgecolor='lime', facecolor='none')
    ax.add_patch(rect)
    # Etiketi ve skoru ekle
    if(labels in text[0]):
        plt.text(x0, y0, f'{labels}: {score:.2f}', bbox=dict(facecolor='yellow', alpha=0.5))
    else:
        label_list = labels.split(" ")
        for label in label_list:
            if label in text[0]:
                plt.text(x0, y0, f'{label}: {score:.2f}', bbox=dict(facecolor='yellow', alpha=0.5))
                break

plt.axis('off')
plt.savefig("karnıyarık_result.jpg", bbox_inches='tight', pad_inches=0)
plt.show()
plt.close()