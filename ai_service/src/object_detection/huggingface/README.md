---
title: Food Detection RT-DETR
emoji: 🍕
colorFrom: orange
colorTo: red
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# Food Detection with RT-DETR

RT-DETR model ile yemek tespiti servisi.

## Özellikler

- 🎯 Real-time food detection
- 🖼️ Bounding box visualization
- 📊 Confidence scores
- ⚡ Fast inference (GPU/CPU)

## Kullanım

1. Yemek fotoğrafı yükleyin
2. Confidence threshold ayarlayın (0.1-1.0)
3. "Detect Food" butonuna tıklayın
4. Sonuçları görün!

## Model

Fine-tuned RT-DETR model - food detection için özel eğitilmiş.

## API Kullanımı

```python
import requests

url = "https://YOUR_SPACE_NAME.hf.space/api/predict"
files = {"file": open("food.jpg", "rb")}
data = {"confidence_threshold": 0.5}

response = requests.post(url, files=files, data=data)
print(response.json())
```
