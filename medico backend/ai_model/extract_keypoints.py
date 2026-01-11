import os
import json
from ultralytics import YOLO
from tqdm import tqdm

# --- PATH CONFIG ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
OUTPUT_DIR = os.path.join(DATASET_DIR, "keypoints")


os.makedirs(OUTPUT_DIR, exist_ok=True)


print("🔹 Loading YOLOv8 Pose model...")
model = YOLO("yolov8n-pose.pt")


classes = ["good", "bad"]


for cls in classes:
    class_path = os.path.join(DATASET_DIR, cls)
    if not os.path.exists(class_path):
        print(f"⚠️ Folder {class_path} not found. Skipping...")
        continue

    
    for img_file in tqdm(os.listdir(class_path), desc=f"Processing {cls}"):
        if not img_file.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        img_path = os.path.join(class_path, img_file)
        results = model(img_path, verbose=False)

      
        if len(results[0].keypoints.xy) == 0:
            print(f"❌ No person detected in {img_file}, skipping...")
            continue

       
        keypoints = results[0].keypoints.xy[0].cpu().numpy().tolist()
        print(f"✅ Detected {len(keypoints)} keypoints in {img_file}:")
        for i, kp in enumerate(keypoints):
            print(f"   Keypoint {i}: x={kp[0]:.2f}, y={kp[1]:.2f}")


        output_file = os.path.splitext(img_file)[0] + ".json"
        output_path = os.path.join(OUTPUT_DIR, output_file)

        data = {
            "file": img_file,
            "label": cls,
            "keypoints": keypoints  
        }

        with open(output_path, "w") as f:
            json.dump(data, f)

print("✅ Keypoint extraction completed.")
print(f"📁 Saved keypoints to: {OUTPUT_DIR}")
