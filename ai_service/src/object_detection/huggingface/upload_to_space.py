"""
HuggingFace Space'e app.py ve best.pt yukler.

Kullanim:
    pip install huggingface_hub
    python upload_to_space.py
"""

from huggingface_hub import HfApi
from pathlib import Path

# --- Ayarlar ---
HF_TOKEN  = ""                         
SPACE_ID  = "nceyda/yolo-food-det"           

APP_PY    = Path(r"D:\Desktop\Bitirme\NutriGame\ai_service\src\object_detection\huggingface\app.py")
BEST_PT   = Path(r"D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\yolov8\large\version2\weights\best.pt")
# ---------------

api = HfApi(token=HF_TOKEN)

print("app.py yukleniyor...")
api.upload_file(
    path_or_fileobj = str(APP_PY),
    path_in_repo    = "app.py",
    repo_id         = SPACE_ID,
    repo_type       = "space",
    commit_message  = "Update app.py: YOLOv8l 115-class model",
)
print("app.py yuklendi.")

print("best.pt yukleniyor (251 MB, birkac dakika surebilir)...")
api.upload_file(
    path_or_fileobj = str(BEST_PT),
    path_in_repo    = "best.pt",
    repo_id         = SPACE_ID,
    repo_type       = "space",
    commit_message  = "Add YOLOv8l finetuned weights (115 classes)",
)
print("best.pt yuklendi. Space simdi yeniden basliyor...")
