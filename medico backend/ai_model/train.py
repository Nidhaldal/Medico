import torch
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
from PIL import Image
import os

model_name = "google/vit-base-patch16-224"
model = AutoModelForImageClassification.from_pretrained(model_name)
extractor = AutoFeatureExtractor.from_pretrained(model_name)

dataset_dir = "datasets/prosthesis_images"  

def train():
    """
    Add your training code here.
    Example: loop through images, extract features, train model.
    """
    for img_file in os.listdir(dataset_dir):
        if img_file.endswith(".jpg") or img_file.endswith(".png"):
            img_path = os.path.join(dataset_dir, img_file)
            img = Image.open(img_path).convert("RGB")
            inputs = extractor(images=img, return_tensors="pt")
            outputs = model(**inputs)
            
            print(f"Processed {img_file}")

if __name__ == "__main__":
    train()
