# Render.com Deploy

## 🚀 Deploy Adımları

### 1. Render Hesabı Oluştur
https://render.com/register

### 2. GitHub Repo Oluştur (Önerilen)

```bash
# render klasörünü ayrı bir repo yap
cd D:\Desktop\Bitirme\NutriGame\ai_service\src\object_detection\render

git init
git add .
git commit -m "Initial commit"

# GitHub'da yeni repo oluştur: food-detection-render
git remote add origin https://github.com/YOUR_USERNAME/food-detection-render.git
git push -u origin main
```

### 3. Render'da Web Service Oluştur

1. Render Dashboard → **New +** → **Web Service**
2. GitHub repo'nuzu bağlayın
3. Settings:
   - **Name**: `food-detection-api`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free ✅
4. **Create Web Service**

### 4. Deploy Süreci

Render otomatik build başlatır:
- ⏱️ İlk deploy: 5-10 dakika
- ✅ Sonraki deploylar: 2-3 dakika
- 🔄 Her git push otomatik deploy eder

### 5. Service URL

Deploy tamamlandığında:
```
https://food-detection-api.onrender.com
```

## ⚡ Önemli: Free Tier Limitleri

- **CPU**: 0.1 vCPU (yavaş ama ücretsiz)
- **RAM**: 512 MB
- **Idle Shutdown**: 15 dakika boş kalırsa kapanır
- **Cold Start**: ~30-60 saniye (ilk istek)
- **Build Time**: 500 saat/ay (yeterli)

**Not**: İlk istek yavaş olabilir (cold start). Sonraki istekler hızlı olur.

## 🔧 Alternatif Deploy: render.yaml ile

Render.yaml varsa otomatik configuration:

1. Render Dashboard → **New +** → **Blueprint**
2. Repo seç
3. `render.yaml` dosyasını algılar
4. **Apply** tıkla

## 💾 Model Dosyası

**Problem**: Free tier 512 MB RAM - büyük model sığmayabilir.

**Çözüm**: Model dosyasını external storage'da tut:

### Seçenek A: Hugging Face Hub

```python
from huggingface_hub import hf_hub_download

model_path = hf_hub_download(
    repo_id="YOUR_USERNAME/food-detection-model",
    filename="checkpoint_best_ema.pth",
    cache_dir="/tmp"
)
```

### Seçenek B: Google Drive / Dropbox

```python
import gdown

# Google Drive'dan indir
url = "https://drive.google.com/uc?id=FILE_ID"
output = "/tmp/model.pth"
gdown.download(url, output, quiet=False)
```

## 🌐 URL'i Node.js Servisine Ekle

`.env` dosyasına:

```env
INFERENCE_SERVICE_URL=https://food-detection-api.onrender.com
```

## 📊 Monitoring

Render Dashboard'da:
- Logs (real-time)
- Metrics (CPU, Memory)
- Deploy history
- Environment variables

## 🔄 Cold Start Azaltma

Free tier'da idle shutdown var. Çözümler:

### 1. Cron Job (Ping)

External service ile 10 dakikada bir ping:
- https://cron-job.org/
- https://uptimerobot.com/

```bash
# Her 10 dakikada bir
curl https://food-detection-api.onrender.com/health
```

### 2. Paid Plan ($7/ay)

- Always-on
- Daha fazla CPU/RAM
- No cold start

## 🧪 Test

```bash
# Health check
curl https://food-detection-api.onrender.com/health

# Predict
curl -X POST https://food-detection-api.onrender.com/predict \
  -F "image=@test.jpg" \
  -F "confidence_threshold=0.5"
```

## 🆚 Render vs Hugging Face

| Özellik | Render | Hugging Face |
|---------|---------|--------------|
| Ücretsiz | ✅ 512MB RAM | ✅ Daha fazla |
| Cold Start | ~30-60s | ~10-20s |
| GPU | ❌ (paid only) | ✅ Free tier |
| Idle Shutdown | ✅ 15 dk | ✅ 48 saat |
| API | ✅ Full REST | ✅ Gradio + API |
| Deploy | Git push | Git push |

**Öneri**: 
- Model küçükse (<200MB) → Render ✅
- Model büyükse veya GPU gerekiyorsa → Hugging Face ✅

## 🎯 Sonraki Adımlar

1. ✅ GitHub repo oluştur
2. ✅ Render'a deploy et
3. ✅ Service URL'i kopyala
4. ✅ Node.js servisine ekle
5. ✅ Test et
