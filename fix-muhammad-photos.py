# -*- coding: utf-8 -*-
import json

# Read current data
with open('data/products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Fix Muhammad's photos - use URL encoded paths
muhammad_photos = [
    "images/Мухаммад/Снимок экрана 2025-12-23 131114.png",
    "images/Мухаммад/Снимок экрана 2025-12-23 131122.png",
    "images/Мухаммад/Снимок экрана 2025-12-23 131132.png",
    "images/Мухаммад/Снимок экрана 2025-12-23 131138.png",
    "images/Мухаммад/Снимок экрана 2025-12-23 131146.png",
    "images/Мухаммад/Снимок экрана 2025-12-23 131153.png",
    "images/Мухаммад/Снимок экрана 2025-12-23 131200.png"
]

# Find Muhammad and update
for product in data['products']:
    if 'Мухаммад' in product.get('title', ''):
        # Keep main image, add additional photos
        main_image = product.get('image', '')
        product['images'] = [main_image] + muhammad_photos
        print(f"Updated {product['title']} with {len(product['images'])} images")

# Save
with open('data/products.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done!")
