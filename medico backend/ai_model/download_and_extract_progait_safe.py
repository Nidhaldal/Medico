from huggingface_hub import hf_hub_download, list_repo_files
import cv2
import os
import shutil

# --------------------------
# 1️⃣ Set folders
# --------------------------
VIDEOS_DIR = "datasets/progait_videos"
FRAMES_DIR = "datasets/progait_frames"
os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)

# --------------------------
# 2️⃣ List all files in the ProGait dataset
# --------------------------
repo_id = "ericyxy98/ProGait"
all_files = list_repo_files(repo_id, repo_type="dataset")

# Filter for MP4 videos only
videos = [f for f in all_files if f.endswith(".mp4")]
print(f"Found {len(videos)} videos in the dataset.")

# --------------------------
# 3️⃣ Download videos and extract frames
# --------------------------
for file in videos:
    try:
        print(f"Downloading {file} ...")
        local_path = hf_hub_download(
            repo_id=repo_id,
            filename=file,
            repo_type="dataset",
            cache_dir=VIDEOS_DIR
        )

        # Move video to VIDEOS_DIR root
        dest_path = os.path.join(VIDEOS_DIR, os.path.basename(file))
        shutil.move(local_path, dest_path)
        print(f"Saved to {dest_path}")

        # Extract frames
        cap = cv2.VideoCapture(dest_path)
        frame_num = 0
        video_frames_dir = os.path.join(FRAMES_DIR, os.path.splitext(os.path.basename(file))[0])
        os.makedirs(video_frames_dir, exist_ok=True)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_path = os.path.join(video_frames_dir, f"frame_{frame_num:04d}.jpg")
            cv2.imwrite(frame_path, frame)
            frame_num += 1

        cap.release()
        print(f"Extracted {frame_num} frames from {file}\n")

    except Exception as e:
        print(f"⚠️ Failed to download {file}: {e}\n")
