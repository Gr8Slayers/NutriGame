"""
Roboflow workspace bilgilerini kontrol etme scripti
"""

from roboflow import Roboflow

# API Key
API_KEY = "cvqeXjidc7oV5AKf7y00"

print("Roboflow'a bağlanılıyor...")
rf = Roboflow(api_key=API_KEY)
print("\n" + "="*50)
print("WORKSPACE BİLGİLERİ")
print("="*50)

try:
    # Workspace bilgilerini al
    workspace = rf.workspace()
    print(f"\nWorkspace Adı: {workspace.name}")
    print(f"Workspace URL: {workspace.url}")
    
    # Projeleri listele
    print("\n" + "="*50)
    print("PROJELER")
    print("="*50)
    
    projects = workspace.projects()
    if projects:
        for project in projects:
            print(f"\n📁 Proje Adı: {project.name}")
            print(f"   ID: {project.id}")
            print(f"   Type: {project.type}")
    else:
        print("\nHenüz proje yok.")
        
except Exception as e:
    print(f"\n❌ Hata: {e}")
    print("\nÖnerilen çözüm:")
    print("1. Web arayüzünde projenizin URL'sine bakın")
    print("   Örnek: https://app.roboflow.com/WORKSPACE-ADI/PROJE-ADI")
    print("2. O isimleri scripte girin")
