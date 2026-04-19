#!/usr/bin/env python3
"""
Specific verification tests for the 5 new admin endpoints as per review request
"""

import requests
import json
import time
import io
import uuid

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

def test_specific_requirements():
    """Test specific requirements from the review request"""
    token = get_admin_token()
    if not token:
        print("❌ Failed to get admin token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("🎯 TESTING SPECIFIC REQUIREMENTS FROM REVIEW REQUEST")
    print("="*60)
    
    # 1. Test Product Clone with specific requirements
    print("\n1. PRODUCT CLONE ENDPOINT VERIFICATION")
    
    # Get existing product (men-restroom-sign or any UUID)
    response = requests.get(f"{BASE_URL}/api/admin/products", headers=headers, timeout=30)
    products = response.json().get("products", [])
    
    if products:
        source_product = products[0]
        product_id = source_product.get("id")
        print(f"   Using source product: {source_product.get('name')} ({product_id})")
        
        # Clone the product
        response = requests.post(f"{BASE_URL}/api/admin/products/{product_id}/clone", headers=headers, timeout=30)
        if response.status_code == 201:
            clone = response.json()
            
            # Verify all requirements
            checks = [
                ("Fresh UUID (different from source)", clone.get("id") != product_id),
                ("Slug ends with -copy or -copy-N", clone.get("slug", "").endswith("-copy") or "-copy-" in clone.get("slug", "")),
                ("Name ends with ' (Copy)'", clone.get("name", "").endswith(" (Copy)")),
                ("Published is false", clone.get("published") == False),
                ("Featured is false", clone.get("featured") == False),
                ("Review count is 0", clone.get("review_count") == 0),
                ("Created_at is current UTC", "created_at" in clone),
                ("All other fields identical", clone.get("price") == source_product.get("price"))
            ]
            
            print(f"   ✅ Clone created successfully: {clone.get('name')}")
            for check_name, result in checks:
                status = "✓" if result else "✗"
                print(f"   {status} {check_name}")
        else:
            print(f"   ❌ Clone failed: Status {response.status_code}")
    
    # 2. Test Admin Review Creation with specific requirements
    print("\n2. ADMIN REVIEW CREATE ENDPOINT VERIFICATION")
    
    review_data = {
        "product_id": "men-restroom-sign",
        "author": "Backend Regression Tester",
        "rating": 5,
        "title": "Love it",
        "content": "Great product",
        "status": "approved",
        "featured": True,
        "verified": True
    }
    
    response = requests.post(f"{BASE_URL}/api/admin/reviews", headers=headers, json=review_data, timeout=30)
    if response.status_code == 201:
        review = response.json()
        
        checks = [
            ("Generated UUID", len(review.get("id", "")) == 36),
            ("Timestamps present", "created_at" in review),
            ("Same field values echoed", review.get("author") == "Backend Regression Tester"),
            ("Status is approved", review.get("status") == "approved"),
            ("Helpful is 0", review.get("helpful") == 0),
            ("Featured is true", review.get("featured") == True),
            ("Verified is true", review.get("verified") == True)
        ]
        
        print(f"   ✅ Review created successfully: {review.get('id')}")
        for check_name, result in checks:
            status = "✓" if result else "✗"
            print(f"   {status} {check_name}")
        
        # Test rating clamping
        clamp_tests = [
            (0, 1, "Rating 0 should clamp to 1"),
            (99, 5, "Rating 99 should clamp to 5")
        ]
        
        for test_rating, expected, description in clamp_tests:
            test_data = review_data.copy()
            test_data["rating"] = test_rating
            test_data["author"] = f"Clamp Test {test_rating}"
            
            response = requests.post(f"{BASE_URL}/api/admin/reviews", headers=headers, json=test_data, timeout=30)
            if response.status_code == 201:
                result_rating = response.json().get("rating")
                status = "✓" if result_rating == expected else "✗"
                print(f"   {status} {description}: got {result_rating}")
    else:
        print(f"   ❌ Review creation failed: Status {response.status_code}")
    
    # 3. Test Content Section Delete
    print("\n3. CONTENT SECTION DELETE ENDPOINT VERIFICATION")
    
    # Create a test section first
    test_section_id = "test-delete-verification"
    create_data = {
        "content": "<p>Test content for deletion verification</p>",
        "font_size": "16px",
        "font_family": "Inter",
        "plain_text": "Test content for deletion verification"
    }
    
    response = requests.put(f"{BASE_URL}/api/admin/content/{test_section_id}", headers=headers, json=create_data, timeout=30)
    if response.status_code == 200:
        print(f"   ✅ Test section created: {test_section_id}")
        
        # Delete the section
        response = requests.delete(f"{BASE_URL}/api/admin/content/{test_section_id}", headers=headers, timeout=30)
        if response.status_code == 200:
            delete_result = response.json()
            
            checks = [
                ("Status is success", delete_result.get("status") == "success"),
                ("Section_id returned", delete_result.get("section_id") == test_section_id)
            ]
            
            print(f"   ✅ Section deleted successfully")
            for check_name, result in checks:
                status = "✓" if result else "✗"
                print(f"   {status} {check_name}")
        else:
            print(f"   ❌ Delete failed: Status {response.status_code}")
    
    # 4. Test Media Rename
    print("\n4. MEDIA RENAME ENDPOINT VERIFICATION")
    
    # Get existing media files
    response = requests.get(f"{BASE_URL}/api/admin/media", headers=headers, timeout=30)
    if response.status_code == 200:
        files = response.json().get("files", [])
        if files:
            file_id = files[0].get("id")
            original_filename = files[0].get("filename")
            
            # Rename the file
            new_filename = "renamed-verification-test.png"
            rename_data = {"filename": new_filename}
            
            response = requests.put(f"{BASE_URL}/api/admin/media/{file_id}", headers=headers, json=rename_data, timeout=30)
            if response.status_code == 200:
                rename_result = response.json()
                file_data = rename_result.get("file", {})
                
                checks = [
                    ("Status is success", rename_result.get("status") == "success"),
                    ("Filename updated", file_data.get("filename") == new_filename),
                    ("File ID unchanged", file_data.get("id") == file_id)
                ]
                
                print(f"   ✅ File renamed: {original_filename} → {new_filename}")
                for check_name, result in checks:
                    status = "✓" if result else "✗"
                    print(f"   {status} {check_name}")
                
                # Test path sanitization
                evil_filename = "../evil.png"
                sanitize_data = {"filename": evil_filename}
                response = requests.put(f"{BASE_URL}/api/admin/media/{file_id}", headers=headers, json=sanitize_data, timeout=30)
                if response.status_code == 200:
                    sanitized = response.json().get("file", {}).get("filename", "")
                    is_sanitized = "/" not in sanitized and "\\" not in sanitized
                    status = "✓" if is_sanitized else "✗"
                    print(f"   {status} Path sanitization: '{evil_filename}' → '{sanitized}'")
            else:
                print(f"   ❌ Rename failed: Status {response.status_code}")
    
    # 5. Test Media Replace
    print("\n5. MEDIA REPLACE ENDPOINT VERIFICATION")
    
    response = requests.get(f"{BASE_URL}/api/admin/media", headers=headers, timeout=30)
    if response.status_code == 200:
        files = response.json().get("files", [])
        if files:
            file_id = files[0].get("id")
            original_size = files[0].get("size")
            
            # Create a new test image
            new_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x03\x00\x00\x00\x03\x08\x02\x00\x00\x00\x21\x21\x21\x21\x00\x00\x00\x15IDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00IEND\xaeB`\x82'
            files_data = {"file": ("replacement-verification.png", io.BytesIO(new_image_data), "image/png")}
            
            response = requests.post(f"{BASE_URL}/api/admin/media/{file_id}/replace", headers=headers, files=files_data, timeout=30)
            if response.status_code == 200:
                replace_result = response.json()
                new_size = replace_result.get("size")
                
                checks = [
                    ("Same ID maintained", replace_result.get("id") == file_id),
                    ("New size different", new_size != original_size),
                    ("Updated timestamp present", "updated_at" in replace_result),
                    ("URL ends with correct path", replace_result.get("url", "").endswith(f"/api/media/{file_id}"))
                ]
                
                print(f"   ✅ File replaced: size {original_size} → {new_size}")
                for check_name, result in checks:
                    status = "✓" if result else "✗"
                    print(f"   {status} {check_name}")
                
                # Verify new content is served
                response = requests.get(f"{BASE_URL}/api/media/{file_id}", timeout=30)
                if response.status_code == 200:
                    served_size = len(response.content)
                    status = "✓" if served_size == new_size else "✗"
                    print(f"   {status} New content served: size {served_size}")
            else:
                print(f"   ❌ Replace failed: Status {response.status_code}")
    
    print("\n" + "="*60)
    print("🎯 SPECIFIC REQUIREMENTS VERIFICATION COMPLETE")

if __name__ == "__main__":
    test_specific_requirements()