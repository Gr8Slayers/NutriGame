# Hugging Face Spaces Deploy

## 🚀 Deploy Adımları

### 1. Hugging Face Hesabı Oluştur
https://huggingface.co/join

### 2. Yeni Space Oluştur

1. https://huggingface.co/new-space adresine git
2. Space adı gir (örn: `food-detection-rtdetr`)
3. SDK: **Gradio** seç
4. Hardware: **CPU basic** (ücretsiz) veya **GPU** (daha hızlı, ücretsiz tier var)
5. **Create Space** tıkla

### 3. Model Dosyasını Yükle

Space oluşturulduktan sonra:

```bash
# Git LFS kur (büyük dosyalar için)
git lfs install

# Space'i clone et
git clone https://huggingface.co/spaces/YOUR_USERNAME/food-detection-rtdetr
cd food-detection-rtdetr

# Dosyaları kopyala
copy D:\Desktop\Bitirme\NutriGame\ai_service\src\object_detection\huggingface\* .

# Model dosyasını ekle (opsiyonel - başlangıçta mock mode)
# copy D:\Desktop\Bitirme\NutriGame\object_detection\finetuning\rfdetr_base\rfdetr_base\checkpoint_best_ema.pth .

# Commit ve push
git add .
git commit -m "Initial commit"
git push
```

### 4. Otomatik Deploy

Hugging Face otomatik olarak deploy eder. 2-5 dakika içinde:
- ✅ Space URL'i: `https://YOUR_USERNAME-food-detection-rtdetr.hf.space`
- ✅ API endpoint: `https://YOUR_USERNAME-food-detection-rtdetr.hf.space/api/predict`

### 5. Space'i Test Et

Web arayüzünden:
- URL'i tarayıcıda aç
- Resim yükle
- Test et

## 📝 Not: Model Yükleme

Başlangıçta **mock mode** çalışır (test için). Gerçek modeli kullanmak için:

### Seçenek A: Git LFS ile (önerilen <5GB için)

```bash
# Model dosyasını ekle
git lfs track "*.pth"
git add .gitattributes
git add checkpoint_best_ema.pth
git commit -m "Add model file"
git push
```

### Seçenek B: Hugging Face Model Hub'dan

1. Modeli ayrı bir Model repo'suna yükle
2. `app.py`'da model yükleme kodunu güncelle:

```python
from huggingface_hub import hf_hub_download

model_path = hf_hub_download(
    repo_id="YOUR_USERNAME/food-detection-model",
    filename="checkpoint_best_ema.pth"
)
```

## 🔧 app.py'ı Güncelleme

Model yükledikten sonra `app.py`'daki TODO kısımlarını doldurun:

```python
def load_model():
    global model, device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # RT-DETR yükleme
    from rfdetr import RFDETRBase
    model = RFDETRBase(pretrain_weights="checkpoint_best_ema.pth")
    model.to(device)
    model.eval()
```

## 💰 Maliyet

- **CPU Basic**: Tamamen ücretsiz ✅
- **CPU Upgrade**: $0.03/saat (~$20/ay)
- **GPU T4**: Ücretsiz community tier ✅ (sınırlı)
- **GPU A10G**: $0.60/saat

**Öneri**: Başlangıçta CPU basic kullanın - yeterli olacaktır.

## 🌐 URL'i Node.js Servisine Ekle

Deploy tamamlandıktan sonra `.env` dosyasına ekleyin:

```env
INFERENCE_SERVICE_URL=https://YOUR_USERNAME-food-detection-rtdetr.hf.space
```

## 🔗 API Kullanımı

### Python:

```python
from gradio_client import Client

client = Client("YOUR_USERNAME/food-detection-rtdetr")
result = client.predict(
    image="food.jpg",
    confidence_threshold=0.5
)
```

### Node.js / curl:

```bash
curl -X POST "https://YOUR_USERNAME-food-detection-rtdetr.hf.space/api/predict" \
  -F "file=@food.jpg" \
  -F "confidence_threshold=0.5"
```

## 🎯 Sonraki Adımlar

1. ✅ Space'i test et (mock mode)
2. ✅ Model dosyasını yükle
3. ✅ app.py'ı güncelle (gerçek inference)
4. ✅ Node.js servisini bağla
5. ✅ Test et!
