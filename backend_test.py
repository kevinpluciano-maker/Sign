#!/usr/bin/env python3
"""
Comprehensive backend testing for BSign Store Admin Endpoints
Tests 5 new admin endpoints + regression testing of existing endpoints
"""

import requests
import json
import time
import io
from typing import Dict, Any, Optional
import uuid

# Configuration
BASE_URL = "https://coding-walkthrough.preview.emergentagent.com"
ADMIN_EMAIL = "kevin@decalmax.ca"
ADMIN_PASSWORD = "Ke34023616@"

class BSignTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.test_results = []
        self.response_times = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_time: float = 0):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        if response_time > 0:
            self.response_times.append(response_time)
        print(f"{status} {test_name}: {details}")
        
    def admin_login(self) -> bool:
        """Authenticate as admin and get JWT token"""
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                # Handle both 'token' and 'access_token' field names
                self.admin_token = data.get("token") or data.get("access_token")
                if self.admin_token:
                    self.log_test("Admin Login", True, f"JWT token obtained ({response_time:.2f}ms)", response_time)
                    return True
                else:
                    self.log_test("Admin Login", False, f"No token in response: {data}")
                    return False
            else:
                self.log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers for admin requests"""
        if not self.admin_token:
            raise Exception("No admin token available")
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_product_clone_endpoint(self):
        """Test POST /api/admin/products/{product_id}/clone"""
        print("\n=== Testing Product Clone Endpoint ===")
        
        try:
            # First get list of existing products
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/api/admin/products",
                headers=self.get_auth_headers(),
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code != 200:
                self.log_test("Get Products for Clone", False, f"Status {response.status_code}: {response.text}")
                return
                
            products = response.json().get("products", [])
            if not products:
                self.log_test("Get Products for Clone", False, "No products found to clone")
                return
                
            # Use first product for cloning
            source_product = products[0]
            product_id = source_product.get("id")
            source_name = source_product.get("name", "Unknown")
            
            self.log_test("Get Products for Clone", True, f"Found {len(products)} products, using '{source_name}' ({product_id})", response_time)
            
            # Test 1: Clone existing product
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/products/{product_id}/clone",
                headers=self.get_auth_headers(),
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 201:
                clone_data = response.json()
                clone_id = clone_data.get("id")
                clone_name = clone_data.get("name")
                clone_slug = clone_data.get("slug")
                
                # Verify clone properties
                checks = []
                checks.append(("Fresh UUID", clone_id != product_id and len(clone_id) == 36))
                checks.append(("Name has (Copy)", clone_name and "(Copy)" in clone_name))
                checks.append(("Slug ends with -copy", clone_slug and clone_slug.endswith("-copy")))
                checks.append(("Published false", clone_data.get("published") == False))
                checks.append(("Featured false", clone_data.get("featured") == False))
                checks.append(("Review count 0", clone_data.get("review_count") == 0))
                checks.append(("Has created_at", "created_at" in clone_data))
                
                all_passed = all(check[1] for check in checks)
                details = f"Clone created: {clone_name} ({clone_id}). Checks: " + ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
                self.log_test("Clone Product - First Clone", all_passed, details, response_time)
                
                # Test 2: Clone again to test auto-increment slug
                start_time = time.time()
                response2 = requests.post(
                    f"{self.base_url}/api/admin/products/{product_id}/clone",
                    headers=self.get_auth_headers(),
                    timeout=30
                )
                response_time2 = (time.time() - start_time) * 1000
                
                if response2.status_code == 201:
                    clone2_data = response2.json()
                    clone2_slug = clone2_data.get("slug")
                    slug_incremented = clone2_slug and ("-copy-2" in clone2_slug)
                    self.log_test("Clone Product - Second Clone", slug_incremented, f"Second clone slug: {clone2_slug}", response_time2)
                else:
                    self.log_test("Clone Product - Second Clone", False, f"Status {response2.status_code}: {response2.text}")
                    
            else:
                self.log_test("Clone Product - First Clone", False, f"Status {response.status_code}: {response.text}")
            
            # Test 3: Clone non-existent product (should return 404)
            fake_id = str(uuid.uuid4())
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/products/{fake_id}/clone",
                headers=self.get_auth_headers(),
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_404 = response.status_code == 404
            self.log_test("Clone Non-existent Product", expected_404, f"Status {response.status_code} (expected 404)", response_time)
            
        except Exception as e:
            self.log_test("Clone Product Endpoint", False, f"Exception: {str(e)}")
    
    def test_admin_review_create_endpoint(self):
        """Test POST /api/admin/reviews"""
        print("\n=== Testing Admin Review Create Endpoint ===")
        
        try:
            # Test 1: Create valid review
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
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/reviews",
                headers=self.get_auth_headers(),
                json=review_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 201:
                review_response = response.json()
                review_id = review_response.get("id")
                
                # Verify review properties
                checks = []
                checks.append(("Generated UUID", review_id and len(review_id) == 36))
                checks.append(("Status approved", review_response.get("status") == "approved"))
                checks.append(("Featured true", review_response.get("featured") == True))
                checks.append(("Verified true", review_response.get("verified") == True))
                checks.append(("Helpful 0", review_response.get("helpful") == 0))
                checks.append(("Has timestamps", "created_at" in review_response))
                
                all_passed = all(check[1] for check in checks)
                details = f"Review created: {review_id}. Checks: " + ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
                self.log_test("Create Admin Review - Valid", all_passed, details, response_time)
                
                # Verify review appears in admin list
                start_time = time.time()
                list_response = requests.get(
                    f"{self.base_url}/api/admin/reviews",
                    headers=self.get_auth_headers(),
                    timeout=30
                )
                list_response_time = (time.time() - start_time) * 1000
                
                if list_response.status_code == 200:
                    reviews_list = list_response.json().get("reviews", [])
                    review_found = any(r.get("id") == review_id for r in reviews_list)
                    self.log_test("Verify Review in List", review_found, f"Found {len(reviews_list)} reviews, new review {'found' if review_found else 'not found'}", list_response_time)
                else:
                    self.log_test("Verify Review in List", False, f"Status {list_response.status_code}: {list_response.text}")
                    
            else:
                self.log_test("Create Admin Review - Valid", False, f"Status {response.status_code}: {response.text}")
            
            # Test 2: Rating clamping (rating=0 should clamp to 1)
            clamp_data = {
                "product_id": "men-restroom-sign",
                "author": "Clamp Tester",
                "rating": 0,
                "content": "Testing rating clamp"
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/reviews",
                headers=self.get_auth_headers(),
                json=clamp_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 201:
                clamped_rating = response.json().get("rating")
                rating_clamped = clamped_rating == 1
                self.log_test("Rating Clamp Low", rating_clamped, f"Rating 0 clamped to {clamped_rating}", response_time)
            else:
                self.log_test("Rating Clamp Low", False, f"Status {response.status_code}: {response.text}")
            
            # Test 3: Rating clamping (rating=99 should clamp to 5)
            clamp_data["rating"] = 99
            clamp_data["author"] = "High Clamp Tester"
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/reviews",
                headers=self.get_auth_headers(),
                json=clamp_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 201:
                clamped_rating = response.json().get("rating")
                rating_clamped = clamped_rating == 5
                self.log_test("Rating Clamp High", rating_clamped, f"Rating 99 clamped to {clamped_rating}", response_time)
            else:
                self.log_test("Rating Clamp High", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Review Create Endpoint", False, f"Exception: {str(e)}")
    
    def test_content_delete_endpoint(self):
        """Test DELETE /api/admin/content/{section_id}"""
        print("\n=== Testing Content Delete Endpoint ===")
        
        try:
            # First create a test section
            test_section_id = "test-delete-section"
            create_data = {
                "section_id": test_section_id,
                "content": "<p>Test content for deletion</p>",
                "font_size": "16px",
                "font_family": "Inter",
                "plain_text": "Test content for deletion"
            }
            
            start_time = time.time()
            response = requests.put(
                f"{self.base_url}/api/admin/content/{test_section_id}",
                headers=self.get_auth_headers(),
                json=create_data,
                timeout=30
            )
            create_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_test("Create Test Section", True, f"Section '{test_section_id}' created", create_time)
                
                # Now delete the section
                start_time = time.time()
                delete_response = requests.delete(
                    f"{self.base_url}/api/admin/content/{test_section_id}",
                    headers=self.get_auth_headers(),
                    timeout=30
                )
                delete_time = (time.time() - start_time) * 1000
                
                if delete_response.status_code == 200:
                    delete_data = delete_response.json()
                    success_status = delete_data.get("status") == "success"
                    correct_section_id = delete_data.get("section_id") == test_section_id
                    
                    all_passed = success_status and correct_section_id
                    details = f"Status: {delete_data.get('status')}, Section ID: {delete_data.get('section_id')}"
                    self.log_test("Delete Content Section", all_passed, details, delete_time)
                else:
                    self.log_test("Delete Content Section", False, f"Status {delete_response.status_code}: {delete_response.text}")
                    
            else:
                self.log_test("Create Test Section", False, f"Status {response.status_code}: {response.text}")
                return
            
            # Test deleting non-existent section (should return 404)
            fake_section_id = "non-existent-section-" + str(uuid.uuid4())[:8]
            start_time = time.time()
            response = requests.delete(
                f"{self.base_url}/api/admin/content/{fake_section_id}",
                headers=self.get_auth_headers(),
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_404 = response.status_code == 404
            self.log_test("Delete Non-existent Section", expected_404, f"Status {response.status_code} (expected 404)", response_time)
            
        except Exception as e:
            self.log_test("Content Delete Endpoint", False, f"Exception: {str(e)}")
    
    def test_media_rename_endpoint(self):
        """Test PUT /api/admin/media/{file_id}"""
        print("\n=== Testing Media Rename Endpoint ===")
        
        try:
            # First get existing media files or upload a test file
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/api/admin/media",
                headers=self.get_auth_headers(),
                timeout=30
            )
            list_time = (time.time() - start_time) * 1000
            
            file_id = None
            original_filename = None
            
            if response.status_code == 200:
                files = response.json().get("files", [])
                if files:
                    file_id = files[0].get("id")
                    original_filename = files[0].get("filename")
                    self.log_test("Get Media Files", True, f"Found {len(files)} files, using {original_filename} ({file_id})", list_time)
                else:
                    # Upload a test file if no files exist
                    test_image = self.create_test_image()
                    files = {"file": ("test.png", test_image, "image/png")}
                    
                    start_time = time.time()
                    upload_response = requests.post(
                        f"{self.base_url}/api/admin/media/upload",
                        headers=self.get_auth_headers(),
                        files=files,
                        timeout=30
                    )
                    upload_time = (time.time() - start_time) * 1000
                    
                    if upload_response.status_code == 200:
                        upload_data = upload_response.json()
                        file_id = upload_data.get("id")
                        original_filename = upload_data.get("filename")
                        self.log_test("Upload Test File", True, f"Uploaded {original_filename} ({file_id})", upload_time)
                    else:
                        self.log_test("Upload Test File", False, f"Status {upload_response.status_code}: {upload_response.text}")
                        return
            else:
                self.log_test("Get Media Files", False, f"Status {response.status_code}: {response.text}")
                return
            
            if not file_id:
                self.log_test("Media Rename Test", False, "No file available for testing")
                return
            
            # Test 1: Rename file
            new_filename = "renamed-by-test.png"
            rename_data = {"filename": new_filename}
            
            start_time = time.time()
            response = requests.put(
                f"{self.base_url}/api/admin/media/{file_id}",
                headers=self.get_auth_headers(),
                json=rename_data,
                timeout=30
            )
            rename_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                rename_response = response.json()
                file_data = rename_response.get("file", {})
                renamed_filename = file_data.get("filename")
                
                rename_success = renamed_filename == new_filename
                self.log_test("Rename Media File", rename_success, f"Renamed to: {renamed_filename}", rename_time)
                
                # Verify via GET that filename changed
                start_time = time.time()
                verify_response = requests.get(
                    f"{self.base_url}/api/admin/media",
                    headers=self.get_auth_headers(),
                    timeout=30
                )
                verify_time = (time.time() - start_time) * 1000
                
                if verify_response.status_code == 200:
                    files = verify_response.json().get("files", [])
                    target_file = next((f for f in files if f.get("id") == file_id), None)
                    if target_file:
                        verified_name = target_file.get("filename")
                        verify_success = verified_name == new_filename
                        self.log_test("Verify Rename", verify_success, f"Verified filename: {verified_name}", verify_time)
                    else:
                        self.log_test("Verify Rename", False, "File not found in list")
                else:
                    self.log_test("Verify Rename", False, f"Status {verify_response.status_code}: {verify_response.text}")
                    
            else:
                self.log_test("Rename Media File", False, f"Status {response.status_code}: {response.text}")
            
            # Test 2: Rename with path separators (should be sanitized)
            evil_filename = "../evil.png"
            sanitize_data = {"filename": evil_filename}
            
            start_time = time.time()
            response = requests.put(
                f"{self.base_url}/api/admin/media/{file_id}",
                headers=self.get_auth_headers(),
                json=sanitize_data,
                timeout=30
            )
            sanitize_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                sanitize_response = response.json()
                file_data = sanitize_response.get("file", {})
                sanitized_filename = file_data.get("filename")
                
                # Should not contain path separators
                is_sanitized = "/" not in sanitized_filename and "\\" not in sanitized_filename
                self.log_test("Sanitize Filename", is_sanitized, f"'{evil_filename}' sanitized to '{sanitized_filename}'", sanitize_time)
            else:
                self.log_test("Sanitize Filename", False, f"Status {response.status_code}: {response.text}")
            
            # Test 3: Rename unknown file (should return 404)
            fake_id = str(uuid.uuid4())
            start_time = time.time()
            response = requests.put(
                f"{self.base_url}/api/admin/media/{fake_id}",
                headers=self.get_auth_headers(),
                json={"filename": "test.png"},
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_404 = response.status_code == 404
            self.log_test("Rename Unknown File", expected_404, f"Status {response.status_code} (expected 404)", response_time)
            
            # Test 4: Empty filename (should return 400)
            start_time = time.time()
            response = requests.put(
                f"{self.base_url}/api/admin/media/{file_id}",
                headers=self.get_auth_headers(),
                json={"filename": ""},
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_400 = response.status_code == 400
            self.log_test("Empty Filename", expected_400, f"Status {response.status_code} (expected 400)", response_time)
            
        except Exception as e:
            self.log_test("Media Rename Endpoint", False, f"Exception: {str(e)}")
    
    def test_media_replace_endpoint(self):
        """Test POST /api/admin/media/{file_id}/replace"""
        print("\n=== Testing Media Replace Endpoint ===")
        
        try:
            # Get or create a file to replace
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/api/admin/media",
                headers=self.get_auth_headers(),
                timeout=30
            )
            list_time = (time.time() - start_time) * 1000
            
            file_id = None
            original_size = None
            
            if response.status_code == 200:
                files = response.json().get("files", [])
                if files:
                    file_id = files[0].get("id")
                    original_size = files[0].get("size")
                    self.log_test("Get File for Replace", True, f"Using file {file_id} (size: {original_size})", list_time)
                else:
                    # Upload a test file
                    test_image = self.create_test_image()
                    files_data = {"file": ("original.png", test_image, "image/png")}
                    
                    start_time = time.time()
                    upload_response = requests.post(
                        f"{self.base_url}/api/admin/media/upload",
                        headers=self.get_auth_headers(),
                        files=files_data,
                        timeout=30
                    )
                    upload_time = (time.time() - start_time) * 1000
                    
                    if upload_response.status_code == 200:
                        upload_data = upload_response.json()
                        file_id = upload_data.get("id")
                        original_size = upload_data.get("size")
                        self.log_test("Upload File for Replace", True, f"Uploaded {file_id} (size: {original_size})", upload_time)
                    else:
                        self.log_test("Upload File for Replace", False, f"Status {upload_response.status_code}: {upload_response.text}")
                        return
            else:
                self.log_test("Get File for Replace", False, f"Status {response.status_code}: {response.text}")
                return
            
            if not file_id:
                self.log_test("Media Replace Test", False, "No file available for testing")
                return
            
            # Test 1: Replace with new image
            new_image = self.create_test_image(size=(100, 100))  # Different size
            files_data = {"file": ("replacement.png", new_image, "image/png")}
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/media/{file_id}/replace",
                headers=self.get_auth_headers(),
                files=files_data,
                timeout=30
            )
            replace_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                replace_data = response.json()
                new_size = replace_data.get("size")
                same_id = replace_data.get("id") == file_id
                has_updated_at = "updated_at" in replace_data
                url_correct = replace_data.get("url", "").endswith(f"/api/media/{file_id}")
                
                checks = []
                checks.append(("Same ID", same_id))
                checks.append(("New size", new_size != original_size))
                checks.append(("Updated timestamp", has_updated_at))
                checks.append(("Correct URL", url_correct))
                
                all_passed = all(check[1] for check in checks)
                details = f"Size: {original_size} → {new_size}. Checks: " + ", ".join([f"{check[0]}: {'✓' if check[1] else '✗'}" for check in checks])
                self.log_test("Replace Media File", all_passed, details, replace_time)
                
                # Verify the file serves new content
                start_time = time.time()
                serve_response = requests.get(
                    f"{self.base_url}/api/media/{file_id}",
                    timeout=30
                )
                serve_time = (time.time() - start_time) * 1000
                
                if serve_response.status_code == 200:
                    served_size = len(serve_response.content)
                    size_matches = served_size == new_size
                    self.log_test("Verify Replaced Content", size_matches, f"Served size: {served_size}, expected: {new_size}", serve_time)
                else:
                    self.log_test("Verify Replaced Content", False, f"Status {serve_response.status_code}: {serve_response.text}")
                    
            else:
                self.log_test("Replace Media File", False, f"Status {response.status_code}: {response.text}")
            
            # Test 2: Replace unknown file (should return 404)
            fake_id = str(uuid.uuid4())
            files_data = {"file": ("test.png", self.create_test_image(), "image/png")}
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/media/{fake_id}/replace",
                headers=self.get_auth_headers(),
                files=files_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_404 = response.status_code == 404
            self.log_test("Replace Unknown File", expected_404, f"Status {response.status_code} (expected 404)", response_time)
            
            # Test 3: Replace with non-image (should return 400)
            text_file = io.BytesIO(b"This is not an image")
            files_data = {"file": ("test.txt", text_file, "text/plain")}
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/media/{file_id}/replace",
                headers=self.get_auth_headers(),
                files=files_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_400 = response.status_code == 400
            self.log_test("Replace with Non-image", expected_400, f"Status {response.status_code} (expected 400)", response_time)
            
            # Test 4: Replace with huge file (should return 413)
            # Create a file larger than 10MB
            huge_data = b"x" * (11 * 1024 * 1024)  # 11MB
            files_data = {"file": ("huge.png", io.BytesIO(huge_data), "image/png")}
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/api/admin/media/{file_id}/replace",
                headers=self.get_auth_headers(),
                files=files_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            expected_413 = response.status_code == 413
            self.log_test("Replace with Huge File", expected_413, f"Status {response.status_code} (expected 413)", response_time)
            
        except Exception as e:
            self.log_test("Media Replace Endpoint", False, f"Exception: {str(e)}")
    
    def create_test_image(self, size=(50, 50)) -> io.BytesIO:
        """Create a minimal PNG image for testing"""
        if size == (50, 50):
            # Create a minimal 1x1 PNG (84 bytes)
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        else:
            # Create a larger PNG with different content (different size)
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x02\x00\x00\x00\x02\x08\x02\x00\x00\x00\xfd\xd4\x9a\xf8\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        return io.BytesIO(png_data)
    
    def test_regression_endpoints(self):
        """Test existing endpoints to ensure no regressions"""
        print("\n=== Testing Regression Endpoints ===")
        
        # Test admin login (already done, but verify token works)
        if not self.admin_token:
            self.log_test("Admin Token Available", False, "No admin token for regression tests")
            return
        
        # Test existing admin endpoints
        endpoints_to_test = [
            ("GET", "/api/admin/products", "Admin Products List"),
            ("GET", "/api/admin/reviews", "Admin Reviews List"),
            ("GET", "/api/admin/content", "Admin Content List"),
            ("GET", "/api/admin/media", "Admin Media List"),
        ]
        
        for method, endpoint, name in endpoints_to_test:
            try:
                start_time = time.time()
                response = requests.request(
                    method,
                    f"{self.base_url}{endpoint}",
                    headers=self.get_auth_headers(),
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                success = response.status_code == 200
                details = f"Status {response.status_code}"
                if success:
                    data = response.json()
                    if "products" in data:
                        details += f", {len(data['products'])} products"
                    elif "reviews" in data:
                        details += f", {len(data['reviews'])} reviews"
                    elif "sections" in data:
                        details += f", {len(data['sections'])} sections"
                    elif "files" in data:
                        details += f", {len(data['files'])} files"
                
                self.log_test(name, success, details, response_time)
                
            except Exception as e:
                self.log_test(name, False, f"Exception: {str(e)}")
        
        # Test public endpoints
        public_endpoints = [
            ("GET", "/api/", "API Health Check"),
            ("GET", "/api/products", "Public Products"),
            ("GET", "/api/reviews/men-restroom-sign", "Public Reviews"),
        ]
        
        for method, endpoint, name in public_endpoints:
            try:
                start_time = time.time()
                response = requests.request(
                    method,
                    f"{self.base_url}{endpoint}",
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                success = response.status_code == 200
                details = f"Status {response.status_code}"
                if success and endpoint == "/api/":
                    data = response.json()
                    details += f", message: {data.get('message', 'N/A')}"
                
                self.log_test(name, success, details, response_time)
                
            except Exception as e:
                self.log_test(name, False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests and generate summary"""
        print("🚀 Starting BSign Store Admin Endpoints Testing")
        print(f"Backend URL: {self.base_url}")
        print(f"Admin Email: {ADMIN_EMAIL}")
        
        # Login first
        if not self.admin_login():
            print("❌ Cannot proceed without admin authentication")
            return
        
        # Run all endpoint tests
        self.test_product_clone_endpoint()
        self.test_admin_review_create_endpoint()
        self.test_content_delete_endpoint()
        self.test_media_rename_endpoint()
        self.test_media_replace_endpoint()
        self.test_regression_endpoints()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*80)
        print("🎯 TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.response_times:
            avg_response_time = sum(self.response_times) / len(self.response_times)
            median_response_time = sorted(self.response_times)[len(self.response_times) // 2]
            print(f"Average Response Time: {avg_response_time:.2f}ms")
            print(f"Median Response Time: {median_response_time:.2f}ms")
        
        # Show failed tests
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print(f"\n❌ FAILED TESTS ({len(failed_results)}):")
            for result in failed_results:
                print(f"  • {result['test']}: {result['details']}")
        
        # Show new endpoint results specifically
        new_endpoint_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in ["Clone", "Admin Review", "Content Delete", "Media Rename", "Media Replace"])]
        new_passed = sum(1 for r in new_endpoint_tests if r["success"])
        new_total = len(new_endpoint_tests)
        
        print(f"\n🆕 NEW ADMIN ENDPOINTS: {new_passed}/{new_total} tests passed")
        
        # Show regression test results
        regression_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in ["Admin Products List", "Admin Reviews List", "Admin Content List", "Admin Media List", "API Health Check", "Public Products", "Public Reviews"])]
        regression_passed = sum(1 for r in regression_tests if r["success"])
        regression_total = len(regression_tests)
        
        print(f"🔄 REGRESSION TESTS: {regression_passed}/{regression_total} tests passed")
        
        print("\n" + "="*80)

if __name__ == "__main__":
    tester = BSignTester()
    tester.run_all_tests()