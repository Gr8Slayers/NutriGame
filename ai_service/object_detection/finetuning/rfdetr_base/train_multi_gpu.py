from rfdetr import RFDETRBase

model = RFDETRBase()
model.train(
    dataset_dir="/kaggle/input/merged-fixed3/merged_fixed",
    epochs=10,
    batch_size=2,  # 8'den 2'ye düşürdük
    grad_accum_steps=8,  # 2'den 8'e çıkardık (effective batch = 2*2*8 = 32)
    lr=1e-4,
    amp=True,
    checkpoint_interval=2,
    output_dir="/kaggle/working/rfdetr_base"
)
