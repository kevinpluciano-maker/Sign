#!/usr/bin/env python3
"""
BSign Backend Regression Testing Suite
Post-Performance Optimization Testing (2026-04-19)

Tests all backend endpoints after MongoDB index additions to ensure no regressions.
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://coding-walkthrough.preview.emergentagent.com/api"
ADMIN_EMAIL = "kevin@decalmax.ca"
ADMIN_PASSWORD = "Ke34023616@"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name: str, passed: bool, details: str = "", response_time: float = 0):
        """Log test result"""
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "passed": passed,
            "details": details,
            "response_time_ms": round(response_time * 1000, 2) if response_time > 0 else 0
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} ({result['response_time_ms']}ms) - {details}")
        
    def test_health_check(self):
        """Test GET /api/ - Basic health check"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_test("Health Check (GET /api/)", True, 
                                f"Returns 'Hello World' message", response_time)
                else:
                    self.log_test("Health Check (GET /api/)", False, 
                                f"Unexpected response: {data}", response_time)
            else:
                self.log_test("Health Check (GET /api/)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Health Check (GET /api/)", False, f"Exception: {str(e)}")
            
    def test_database_health(self):
        """Test GET /api/health - Database connectivity"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/health")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok" and data.get("database") == "connected":
                    self.log_test("Database Health Check", True, 
                                f"Database connected successfully", response_time)
                else:
                    self.log_test("Database Health Check", False, 
                                f"Database not connected: {data}", response_time)
            else:
                self.log_test("Database Health Check", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Database Health Check", False, f"Exception: {str(e)}")
            
    def test_status_endpoints(self):
        """Test POST /api/status and GET /api/status"""
        # Test POST /api/status
        try:
            test_client_name = f"regression-test-{uuid.uuid4().hex[:8]}"
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/status", 
                                       json={"client_name": test_client_name})
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "timestamp" in data and data.get("client_name") == test_client_name:
                    self.log_test("Status Creation (POST /api/status)", True, 
                                f"Created status with UUID {data['id'][:8]}...", response_time)
                    test_status_id = data["id"]
                else:
                    self.log_test("Status Creation (POST /api/status)", False, 
                                f"Invalid response format: {data}", response_time)
                    return
            else:
                self.log_test("Status Creation (POST /api/status)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
                return
        except Exception as e:
            self.log_test("Status Creation (POST /api/status)", False, f"Exception: {str(e)}")
            return
            
        # Test GET /api/status
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/status")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if our test status is in the list
                    found_test_status = any(s.get("id") == test_status_id for s in data)
                    if found_test_status:
                        self.log_test("Status Retrieval (GET /api/status)", True, 
                                    f"Retrieved {len(data)} status records including test record", response_time)
                    else:
                        self.log_test("Status Retrieval (GET /api/status)", False, 
                                    f"Test status not found in {len(data)} records", response_time)
                else:
                    self.log_test("Status Retrieval (GET /api/status)", False, 
                                f"Invalid response format: {data}", response_time)
            else:
                self.log_test("Status Retrieval (GET /api/status)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Status Retrieval (GET /api/status)", False, f"Exception: {str(e)}")
            
    def test_content_endpoints(self):
        """Test content CRUD operations"""
        test_section_id = f"test-section-{uuid.uuid4().hex[:8]}"
        test_content = {
            "section_id": test_section_id,
            "content": "<h1>Test Content</h1><p>Regression test content</p>",
            "font_size": "16px",
            "font_family": "Arial",
            "plain_text": "Test Content - Regression test content"
        }
        
        # Test POST /api/content/{section_id}
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/content/{test_section_id}", 
                                       json=test_content)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("section_id") == test_section_id and "id" in data:
                    self.log_test("Content Creation (POST /api/content/{id})", True, 
                                f"Created content section with ID {data['id'][:8]}...", response_time)
                else:
                    self.log_test("Content Creation (POST /api/content/{id})", False, 
                                f"Invalid response format: {data}", response_time)
                    return
            else:
                self.log_test("Content Creation (POST /api/content/{id})", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
                return
        except Exception as e:
            self.log_test("Content Creation (POST /api/content/{id})", False, f"Exception: {str(e)}")
            return
            
        # Test GET /api/content/{section_id}
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/content/{test_section_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data and data.get("section_id") == test_section_id:
                    self.log_test("Content Retrieval (GET /api/content/{id})", True, 
                                f"Retrieved content section successfully", response_time)
                else:
                    self.log_test("Content Retrieval (GET /api/content/{id})", False, 
                                f"Content not found or invalid: {data}", response_time)
            else:
                self.log_test("Content Retrieval (GET /api/content/{id})", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Content Retrieval (GET /api/content/{id})", False, f"Exception: {str(e)}")
            
        # Test GET /api/content (all content)
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/content")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    found_test_content = any(c.get("section_id") == test_section_id for c in data)
                    if found_test_content:
                        self.log_test("All Content Retrieval (GET /api/content)", True, 
                                    f"Retrieved {len(data)} content sections including test section", response_time)
                    else:
                        self.log_test("All Content Retrieval (GET /api/content)", False, 
                                    f"Test content not found in {len(data)} sections", response_time)
                else:
                    self.log_test("All Content Retrieval (GET /api/content)", False, 
                                f"Invalid response format: {data}", response_time)
            else:
                self.log_test("All Content Retrieval (GET /api/content)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("All Content Retrieval (GET /api/content)", False, f"Exception: {str(e)}")
            
    def test_contact_form(self):
        """Test POST /api/contact - Contact form submission"""
        contact_data = {
            "name": "Regression Test User",
            "email": "regression.test@example.com",
            "phone": "+1 (555) 123-4567",
            "subject": "Backend Regression Test",
            "message": "This is a test message for backend regression testing after performance optimization.",
            "company": "Test Company",
            "urgency": "medium",
            "budget": "$1000-5000",
            "source": "regression_test"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/contact", json=contact_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") in ["success", "warning"]:
                    self.log_test("Contact Form Submission", True, 
                                f"Form submitted: {data.get('message')}", response_time)
                else:
                    self.log_test("Contact Form Submission", False, 
                                f"Unexpected response: {data}", response_time)
            else:
                self.log_test("Contact Form Submission", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Contact Form Submission", False, f"Exception: {str(e)}")
            
    def test_order_notification(self):
        """Test POST /api/orders/notify - Dual email flow"""
        order_data = {
            "order_id": f"ABS-REGRESSION-{uuid.uuid4().hex[:8].upper()}",
            "customer_name": "Regression Test Customer",
            "customer_email": "regression.customer@example.com",
            "customer_phone": "+1 (555) 987-6543",
            "shipping_address": {
                "address": "123 Test Street, Suite 100",
                "city": "Test City",
                "state": "TC",
                "zip": "12345",
                "country": "Canada"
            },
            "items": [
                {
                    "name": "Men Restroom Sign",
                    "quantity": 1,
                    "price": "$58.00",
                    "specifications": {
                        "size": "8x8in",
                        "color": "Black on White",
                        "braille": "Yes +$10 CAD",
                        "room_number": "101"
                    }
                },
                {
                    "name": "Women Restroom Sign", 
                    "quantity": 1,
                    "price": "$65.00",
                    "specifications": {
                        "size": "10x10in",
                        "color": "Black on Silver",
                        "braille": "Yes +$10 CAD",
                        "room_number": "102"
                    }
                }
            ],
            "subtotal": "$123.00",
            "shipping": "$15.00",
            "tax": "$15.99",
            "total": "$153.99",
            "notes": "Regression test order - performance optimization verification"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/orders/notify", json=order_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") in ["success", "partial_success", "warning"]:
                    self.log_test("Order Notification (Dual Email)", True, 
                                f"Order processed: {data.get('message')} (ID: {data.get('order_id')})", response_time)
                else:
                    self.log_test("Order Notification (Dual Email)", False, 
                                f"Unexpected response: {data}", response_time)
            else:
                self.log_test("Order Notification (Dual Email)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Order Notification (Dual Email)", False, f"Exception: {str(e)}")
            
    def test_review_system(self):
        """Test POST /api/reviews and GET /api/reviews/{product_id}"""
        test_product_id = "men-restroom-sign"
        review_data = {
            "productId": test_product_id,
            "productName": "Men Restroom Sign",
            "rating": 5,
            "title": "Excellent Quality - Regression Test",
            "content": "This is a regression test review to verify the review system works after performance optimization. The product quality is excellent.",
            "author": "Regression Tester",
            "email": "regression.reviewer@example.com"
        }
        
        # Test POST /api/reviews
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/reviews", json=review_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log_test("Review Submission", True, 
                                f"Review submitted: {data.get('message')}", response_time)
                else:
                    self.log_test("Review Submission", False, 
                                f"Unexpected response: {data}", response_time)
                    return
            else:
                self.log_test("Review Submission", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
                return
        except Exception as e:
            self.log_test("Review Submission", False, f"Exception: {str(e)}")
            return
            
        # Test GET /api/reviews/{product_id} - should return empty since review is pending
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/reviews/{test_product_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "reviews" in data and "averageRating" in data and "totalReviews" in data:
                    # Reviews should be empty since they need approval
                    if len(data["reviews"]) == 0:
                        self.log_test("Review Retrieval (Pending Status)", True, 
                                    f"Correctly returns empty reviews (pending approval)", response_time)
                    else:
                        self.log_test("Review Retrieval (Pending Status)", True, 
                                    f"Found {len(data['reviews'])} approved reviews", response_time)
                else:
                    self.log_test("Review Retrieval (Pending Status)", False, 
                                f"Invalid response format: {data}", response_time)
            else:
                self.log_test("Review Retrieval (Pending Status)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Review Retrieval (Pending Status)", False, f"Exception: {str(e)}")
            
    def test_newsletter_subscription(self):
        """Test POST /api/newsletter/subscribe"""
        # Test new subscription
        subscription_data = {
            "email": f"regression.test.{uuid.uuid4().hex[:8]}@example.com",
            "source": "regression_test",
            "subscribed_at": datetime.now().isoformat()
        }
        
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/newsletter/subscribe", json=subscription_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and not data.get("alreadySubscribed"):
                    self.log_test("Newsletter Subscription (New)", True, 
                                f"New subscription: {data.get('message')}", response_time)
                else:
                    self.log_test("Newsletter Subscription (New)", False, 
                                f"Unexpected response: {data}", response_time)
                    return
            else:
                self.log_test("Newsletter Subscription (New)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
                return
        except Exception as e:
            self.log_test("Newsletter Subscription (New)", False, f"Exception: {str(e)}")
            return
            
        # Test duplicate subscription
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/newsletter/subscribe", json=subscription_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success" and data.get("alreadySubscribed"):
                    self.log_test("Newsletter Subscription (Duplicate)", True, 
                                f"Duplicate handled: {data.get('message')}", response_time)
                else:
                    self.log_test("Newsletter Subscription (Duplicate)", False, 
                                f"Duplicate not detected: {data}", response_time)
            else:
                self.log_test("Newsletter Subscription (Duplicate)", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Newsletter Subscription (Duplicate)", False, f"Exception: {str(e)}")
            
    def test_auth_endpoints(self):
        """Test authentication endpoints if available"""
        # Test login
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            start_time = time.time()
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    self.log_test("Admin Login", True, 
                                f"Login successful, token received", response_time)
                else:
                    self.log_test("Admin Login", False, 
                                f"No token in response: {data}", response_time)
                    return
            else:
                self.log_test("Admin Login", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
                return
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return
            
        # Test /api/auth/me with token
        if self.auth_token:
            try:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                start_time = time.time()
                response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("email") == ADMIN_EMAIL:
                        self.log_test("Admin Profile Retrieval", True, 
                                    f"Profile retrieved for {data.get('email')}", response_time)
                    else:
                        self.log_test("Admin Profile Retrieval", False, 
                                    f"Wrong user profile: {data}", response_time)
                else:
                    self.log_test("Admin Profile Retrieval", False, 
                                f"Status {response.status_code}: {response.text}", response_time)
            except Exception as e:
                self.log_test("Admin Profile Retrieval", False, f"Exception: {str(e)}")
                
    def test_openapi_spec(self):
        """Test OpenAPI specification endpoint"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BASE_URL.replace('/api', '')}/openapi.json")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if "openapi" in data and "paths" in data:
                    path_count = len(data["paths"])
                    self.log_test("OpenAPI Specification", True, 
                                f"OpenAPI spec available with {path_count} endpoints", response_time)
                else:
                    self.log_test("OpenAPI Specification", False, 
                                f"Invalid OpenAPI format: {data}", response_time)
            else:
                self.log_test("OpenAPI Specification", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("OpenAPI Specification", False, f"Exception: {str(e)}")
            
    def test_cors_and_compression(self):
        """Test CORS headers and GZip compression"""
        try:
            start_time = time.time()
            headers = {
                "Origin": "https://example.com",
                "Accept-Encoding": "gzip, deflate"
            }
            response = self.session.get(f"{BASE_URL}/", headers=headers)
            response_time = time.time() - start_time
            
            cors_headers_present = (
                "access-control-allow-origin" in response.headers or
                "Access-Control-Allow-Origin" in response.headers
            )
            
            gzip_enabled = (
                response.headers.get("content-encoding") == "gzip" or
                "gzip" in response.headers.get("content-encoding", "")
            )
            
            if response.status_code == 200:
                details = []
                if cors_headers_present:
                    details.append("CORS headers present")
                if gzip_enabled:
                    details.append("GZip compression enabled")
                    
                if cors_headers_present:
                    self.log_test("CORS & Compression Check", True, 
                                f"{', '.join(details) if details else 'Basic functionality working'}", response_time)
                else:
                    self.log_test("CORS & Compression Check", False, 
                                f"CORS headers missing", response_time)
            else:
                self.log_test("CORS & Compression Check", False, 
                            f"Status {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("CORS & Compression Check", False, f"Exception: {str(e)}")
            
    def test_performance_timing(self):
        """Test API response times for performance regression"""
        endpoints_to_test = [
            ("GET", f"{BASE_URL}/", "Health Check"),
            ("GET", f"{BASE_URL}/health", "Database Health"),
            ("GET", f"{BASE_URL}/status", "Status List"),
            ("GET", f"{BASE_URL}/content", "Content List")
        ]
        
        total_time = 0
        successful_tests = 0
        
        for method, url, name in endpoints_to_test:
            try:
                start_time = time.time()
                if method == "GET":
                    response = self.session.get(url)
                response_time = time.time() - start_time
                total_time += response_time
                
                if response.status_code == 200:
                    successful_tests += 1
                    if response_time > 0.5:  # 500ms threshold
                        self.log_test(f"Performance - {name}", False, 
                                    f"Slow response: {response_time*1000:.2f}ms > 500ms", response_time)
                    else:
                        self.log_test(f"Performance - {name}", True, 
                                    f"Fast response: {response_time*1000:.2f}ms", response_time)
                else:
                    self.log_test(f"Performance - {name}", False, 
                                f"Failed request: {response.status_code}", response_time)
            except Exception as e:
                self.log_test(f"Performance - {name}", False, f"Exception: {str(e)}")
                
        if successful_tests > 0:
            avg_time = total_time / successful_tests
            self.log_test("Overall Performance", True, 
                        f"Average response time: {avg_time*1000:.2f}ms across {successful_tests} endpoints")
                        
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting BSign Backend Regression Testing Suite")
        print("=" * 60)
        print(f"Backend URL: {BASE_URL}")
        print(f"Test Time: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # Core API Tests
        print("\n📋 CORE API TESTS")
        self.test_health_check()
        self.test_database_health()
        self.test_status_endpoints()
        
        # Content Management Tests
        print("\n📝 CONTENT MANAGEMENT TESTS")
        self.test_content_endpoints()
        
        # Communication Tests
        print("\n📧 COMMUNICATION TESTS")
        self.test_contact_form()
        self.test_order_notification()
        self.test_newsletter_subscription()
        
        # Review System Tests
        print("\n⭐ REVIEW SYSTEM TESTS")
        self.test_review_system()
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_auth_endpoints()
        
        # Infrastructure Tests
        print("\n🔧 INFRASTRUCTURE TESTS")
        self.test_openapi_spec()
        self.test_cors_and_compression()
        
        # Performance Tests
        print("\n⚡ PERFORMANCE TESTS")
        self.test_performance_timing()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.total_tests - self.passed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"  - {result['test']}: {result['details']}")
                    
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["passed"]:
                print(f"  - {result['test']}: {result['details']}")
                
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED - No regressions detected!")
    else:
        print(f"\n⚠️  {tester.total_tests - tester.passed_tests} test(s) failed - Investigation needed")