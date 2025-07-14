import os
import json
import pandas as pd
import requests
from ddgs import DDGS
from urllib.parse import quote
from PIL import Image
from io import BytesIO

# Paths
PRODUCTS_PATH = "data/products.json"
IMAGE_FOLDER = "images"
os.makedirs(IMAGE_FOLDER, exist_ok=True)

# Load product list
with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
    products = json.load(f)

# Fetch and save image for each product
with DDGS() as ddgs:
    for product in products:
        name = product["name"]
        file_name = f"{name.lower().replace(' ', '_')}.jpg"
        file_path = os.path.join(IMAGE_FOLDER, file_name)

        # Skip if image already exists
        if os.path.exists(file_path):
            print(f"[🟡] Skipping {name} (already downloaded)")
            product["image"] = file_path
            continue

        try:
            print(f"[🔍] Searching image for: {name}")
            results = ddgs.images(name, max_results=1)
            image_url = results[0]['image'] if results else None

            if image_url:
                response = requests.get(image_url, timeout=10)
                img = Image.open(BytesIO(response.content)).convert("RGB")
                img.save(file_path)
                product["image"] = file_path
                print(f"[✅] Saved: {file_path}")
            else:
                print(f"[❌] No image found for {name}")
                product["image"] = "images/placeholder.jpg"

        except Exception as e:
            print(f"[🔥] Failed for {name}: {e}")
            product["image"] = "images/placeholder.jpg"

# Save updated products.json
with open(PRODUCTS_PATH, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"\n✅ All done. Updated {len(products)} entries in {PRODUCTS_PATH}")
