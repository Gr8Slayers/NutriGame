from PIL import Image
import torch
from transformers import OwlViTProcessor, OwlViTForObjectDetection
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Load the processor and model
processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")

# Load the image
image = Image.open(r"D:\Datalarım\Desktop\Bitirme\object_detection\zero_shot\karnıyarık.jpg")

# --- MODIFICATION ---
# Define the text queries for the objects you want to detect.
# You can provide one or more queries.
texts = [["a portion of karniyarik", "stuffed eggplant", "parsley","pizza","ramen","egg","cucumber","tomato","onion","garlic","meat","rice","potato"]]
inputs = processor(text=texts, images=image, return_tensors="pt")
# --------------------

# Pass the inputs to the model
outputs = model(**inputs)

# Target image sizes (height, width) to rescale box predictions
target_sizes = torch.Tensor([image.size[::-1]])

# Convert outputs (bounding boxes and class logits) to a usable format
# You can adjust the threshold to be more or less sensitive
results = processor.post_process_object_detection(outputs=outputs, threshold=0.01, target_sizes=target_sizes)

# --- VISUALIZATION (ENHANCED) ---
# Get the first (and only) result
i = 0
text = texts[i]
boxes, scores, labels = results[i]["boxes"], results[i]["scores"], results[i]["labels"]

# Plot the image and the bounding boxes
fig, ax = plt.subplots(1)
ax.imshow(image)

for box, score, label in zip(boxes, scores, labels):
    x0, y0, x1, y1 = box.detach().numpy()
    rect = patches.Rectangle((x0, y0), x1-x0, y1-y0, linewidth=2, edgecolor='r', facecolor='none')
    ax.add_patch(rect)
    # Add the label and score
    plt.text(x0, y0, f'{text[label]}: {score:.2f}', bbox=dict(facecolor='yellow', alpha=0.5))

plt.axis('off')
plt.savefig("karnıyarık_result.jpg", bbox_inches='tight', pad_inches=0)
plt.show() # Use show() to display the image directly if you're running this in a notebook
plt.close()