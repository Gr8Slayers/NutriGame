import os
from inference.models.sam3 import SegmentAnything3
from inference.core.entities.requests.sam3 import Sam3Prompt



# Set your API key
os.environ["API_KEY"] = "cvqeXjidc7oV5AKf7y00"

# Initialize the model
# The model will automatically download weights if not present
model = SegmentAnything3(model_id="sam3/sam3_final")

# Define your image (can be a path, URL, or numpy array)
image_path = "D:\Datalarım\Desktop\Bitirme\NutriGame\ai_service\mock_data\banana.jpg"

# Define prompts
# SAM 3 supports both text and visual prompts
prompts = [
    Sam3Prompt(type="text", text="banana"),
    Sam3Prompt(type="text", text="car")
]

# Run inference
response = model.segment_image(
    image=image_path,
    prompts=prompts,
    output_prob_thresh=0.5,
    format="polygon" # or "rle", "json"
)

# Process results
for prompt_result in response.prompt_results:
    print(f"Prompt: {prompt_result.echo.text}")
    for prediction in prompt_result.predictions:
        print(f"  Confidence: {prediction.confidence}")
        print(f"  Mask: {prediction.masks}")