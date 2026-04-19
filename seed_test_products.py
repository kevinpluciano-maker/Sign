#!/usr/bin/env python3
"""
Seed test products for testing the clone endpoint
"""

import requests
import json

BASE_URL = "https://coding-walkthrough.preview.emergentagent.com"
ADMIN_EMAIL = "kevin@decalmax.ca"
ADMIN_PASSWORD = "Ke34023616@"

def get_admin_token():
    """Get admin JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    return None

def create_test_products():
    """Create test products"""
    token = get_admin_token()
    if not token:
        print("❌ Failed to get admin token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    test_products = [
        {
            "name": "Men Restroom Sign",
            "price": "$58.00",
            "category": "restroom-signs",
            "description": "Professional men's restroom sign with ADA compliance",
            "image": "/images/men-restroom-sign.jpg",
            "images": ["/images/men-restroom-sign.jpg", "/images/men-restroom-sign-2.jpg"],
            "materials": ["Premium Acrylic", "Raised Characters", "Braille Dots"],
            "features": ["ADA Compliant", "Weather Resistant", "Easy Installation"],
            "size_options": [
                {"size": "8x8in", "price": "$58.00"},
                {"size": "10x10in", "price": "$65.00"},
                {"size": "12x12in", "price": "$76.00"}
            ],
            "color_options": ["Black on White", "White on Black", "Blue on White"],
            "braille_options": ["Yes", "No"],
            "badges": ["ADA Compliant", "Best Seller"],
            "rating": 4.8,
            "review_count": 15,
            "in_stock": True,
            "published": True,
            "featured": True,
            "slug": "men-restroom-sign"
        },
        {
            "name": "Women Restroom Sign",
            "price": "$58.00",
            "category": "restroom-signs",
            "description": "Professional women's restroom sign with ADA compliance",
            "image": "/images/women-restroom-sign.jpg",
            "images": ["/images/women-restroom-sign.jpg", "/images/women-restroom-sign-2.jpg"],
            "materials": ["Premium Acrylic", "Raised Characters", "Braille Dots"],
            "features": ["ADA Compliant", "Weather Resistant", "Easy Installation"],
            "size_options": [
                {"size": "8x8in", "price": "$58.00"},
                {"size": "10x10in", "price": "$65.00"},
                {"size": "12x12in", "price": "$76.00"}
            ],
            "color_options": ["Black on White", "White on Black", "Blue on White"],
            "braille_options": ["Yes", "No"],
            "badges": ["ADA Compliant", "Best Seller"],
            "rating": 4.9,
            "review_count": 12,
            "in_stock": True,
            "published": True,
            "featured": True,
            "slug": "women-restroom-sign"
        },
        {
            "name": "Door Number Sign",
            "price": "from $45.00",
            "category": "door-number-signs",
            "description": "Custom door number sign with room numbering",
            "image": "/images/door-number-sign.jpg",
            "images": ["/images/door-number-sign.jpg"],
            "materials": ["Wood", "Stainless Steel"],
            "features": ["Custom Numbers", "Professional Look", "Durable"],
            "size_options": [
                {"size": "9.8x4.7in", "price": "$45.00"},
                {"size": "12x6in", "price": "$55.00"}
            ],
            "color_options": ["Natural Wood", "Dark Wood", "Brushed Steel"],
            "braille_options": ["Yes", "No"],
            "badges": ["Customizable"],
            "rating": 4.7,
            "review_count": 8,
            "in_stock": True,
            "published": True,
            "featured": False,
            "slug": "door-number-wood-stainless-steel"
        }
    ]
    
    created_count = 0
    for product in test_products:
        try:
            response = requests.post(
                f"{BASE_URL}/api/admin/products",
                headers=headers,
                json=product,
                timeout=30
            )
            if response.status_code == 201:
                created_data = response.json()
                print(f"✅ Created product: {created_data.get('name')} (ID: {created_data.get('id')})")
                created_count += 1
            else:
                print(f"❌ Failed to create {product['name']}: Status {response.status_code}")
        except Exception as e:
            print(f"❌ Exception creating {product['name']}: {str(e)}")
    
    print(f"\n🎯 Created {created_count}/{len(test_products)} test products")

if __name__ == "__main__":
    create_test_products()