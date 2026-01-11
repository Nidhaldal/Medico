import os
import json
import logging
from ultralytics import YOLO

# --------------------------
# SETUP LOGGING
# --------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# --------------------------
# PATH CONFIG
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "datasets", "prosthesis_images")
OUTPUT_DIR = os.path.join(BASE_DIR, "datasets", "keypoints")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --------------------------
# LOAD YOLO MODEL
# --------------------------
logger.info("🔹 Loading YOLOv8 Pose model...")
model = YOLO("yolov8n-pose.pt")
logger.info("✅ Model loaded successfully.")

# --------------------------
# PREDICTION FUNCTION
# --------------------------
def predict_prosthesis(image_path: str, save_image: bool = False):
    """
    Run inference on a given image file, log keypoints summary,
    and save keypoints + boxes to a JSON file.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"❌ Image not found at {image_path}")

    image_filename = os.path.basename(image_path)
    logger.info(f"🔸 Running inference on: {image_path}")
    results = model(image_path, save=save_image)  

    output_data = []

    for idx, r in enumerate(results):
        keypoints = r.keypoints.xy
        boxes = r.boxes.xyxy

        num_people = len(keypoints)
        logger.info(f"✅ Detected {num_people} person(s) in {image_filename}")

        people_data = [keypoints[i].cpu().numpy().tolist() for i in range(num_people)]

        # Log detailed keypoints
        for i, person_kp in enumerate(people_data):
            for j, kp in enumerate(person_kp):
                logger.debug(f"Person {i} Keypoint {j}: x={kp[0]:.2f}, y={kp[1]:.2f}")

        output_data.append({
            "num_detections": num_people,
            "keypoints": people_data,
            "boxes": boxes.tolist() if len(boxes) > 0 else [],
        })

    # Save JSON
    output_file = os.path.splitext(image_filename)[0] + "_keypoints.json"
    output_path = os.path.join(OUTPUT_DIR, output_file)
    with open(output_path, "w") as f:
        json.dump({
            "file": image_filename,
            "detections": output_data
        }, f)

    logger.info(f"📁 Keypoints saved to: {output_path}")
    return output_data
