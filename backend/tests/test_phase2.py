"""
Backend tests for Phase 2 admin features:
- Pricing settings (public + admin)
- Media library (upload/list/delete/serve)
- Product bulk-import (idempotent)
- Reviews with approval queue (status='pending' default, filtered public GET)
- Stripe webhook (idempotent, creates orders, dev-mode accepts unverified)
"""
import io
import os
import uuid
import json
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://coding-walkthrough.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "kevin@decalmax.ca"
ADMIN_PASSWORD = "Ke34023616@"

# 1x1 PNG bytes
PNG_BYTES = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
    "890000000D4944415478DA63FCCFC0C0C0000005000100A0A9F39F0000000049"
    "454E44AE426082"
)


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok and isinstance(tok, str)
    return tok


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# -------- Pricing --------
class TestPricing:
    def test_public_pricing_returns_shape(self, s):
        r = s.get(f"{BASE_URL}/api/pricing", timeout=15)
        assert r.status_code == 200
        j = r.json()
        for k in ["global_adjustment_percent", "promos", "promo_banner_text", "promo_banner_active"]:
            assert k in j, f"missing {k} in public pricing"

    def test_admin_pricing_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/pricing", timeout=15)
        assert r.status_code == 401

    def test_update_and_get_pricing(self, s, admin_headers):
        payload = {
            "global_adjustment_percent": 12.5,
            "promos": [
                {"code": "TEST10", "discount_percent": 10, "active": True, "description": "test"},
                {"code": "TESTOFF", "discount_percent": 5, "active": False, "description": "disabled"},
            ],
            "promo_banner_text": "Hello banner",
            "promo_banner_active": True,
        }
        r = s.put(f"{BASE_URL}/api/admin/pricing", json=payload,
                  headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text

        r2 = s.get(f"{BASE_URL}/api/admin/pricing", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        j = r2.json()
        assert j["global_adjustment_percent"] == 12.5
        assert j["promo_banner_text"] == "Hello banner"
        assert j["promo_banner_active"] is True
        assert len(j["promos"]) == 2

        # Public should only show active promo
        r3 = s.get(f"{BASE_URL}/api/pricing", timeout=15)
        assert r3.status_code == 200
        jp = r3.json()
        codes = [p["code"] for p in jp["promos"]]
        assert "TEST10" in codes
        assert "TESTOFF" not in codes


# -------- Media --------
class TestMedia:
    created_id = None

    def test_admin_media_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/media", timeout=15)
        assert r.status_code == 401

    def test_upload_png(self, s, admin_headers):
        files = {"file": ("test.png", PNG_BYTES, "image/png")}
        r = s.post(f"{BASE_URL}/api/admin/media/upload",
                   files=files, headers=admin_headers, timeout=60)
        if r.status_code == 503:
            pytest.skip(f"Storage not available: {r.text}")
        assert r.status_code == 200, f"Upload failed: {r.status_code} {r.text}"
        j = r.json()
        assert "id" in j and "url" in j
        assert j["content_type"] == "image/png"
        TestMedia.created_id = j["id"]

    def test_upload_non_image_rejected(self, s, admin_headers):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = s.post(f"{BASE_URL}/api/admin/media/upload",
                   files=files, headers=admin_headers, timeout=30)
        assert r.status_code == 400

    def test_list_media(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/media", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "files" in j
        if TestMedia.created_id:
            ids = [f["id"] for f in j["files"]]
            assert TestMedia.created_id in ids

    def test_public_media_serves(self, s):
        if not TestMedia.created_id:
            pytest.skip("No media uploaded")
        r = s.get(f"{BASE_URL}/api/media/{TestMedia.created_id}", timeout=30)
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/")
        assert len(r.content) > 0

    def test_delete_media(self, s, admin_headers):
        if not TestMedia.created_id:
            pytest.skip("No media to delete")
        r = s.delete(f"{BASE_URL}/api/admin/media/{TestMedia.created_id}",
                     headers=admin_headers, timeout=15)
        assert r.status_code == 200
        # Subsequent list excludes
        r2 = s.get(f"{BASE_URL}/api/admin/media", headers=admin_headers, timeout=15)
        ids = [f["id"] for f in r2.json()["files"]]
        assert TestMedia.created_id not in ids


# -------- Bulk Import --------
class TestBulkImport:
    product_ids = []

    def test_bulk_import_first_run(self, s, admin_headers):
        pid1 = f"test-bulk-{uuid.uuid4().hex[:8]}"
        pid2 = f"test-bulk-{uuid.uuid4().hex[:8]}"
        TestBulkImport.product_ids = [pid1, pid2]
        items = [
            {"id": pid1, "name": "TEST_BULK A", "price": "$10", "category": "test"},
            {"id": pid2, "name": "TEST_BULK B", "price": "$20", "category": "test"},
        ]
        r = s.post(f"{BASE_URL}/api/admin/products/bulk-import",
                   json=items, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["imported"] == 2
        assert j["updated"] == 0

    def test_bulk_import_second_run_updates(self, s, admin_headers):
        if not TestBulkImport.product_ids:
            pytest.skip("first run didn't happen")
        items = [
            {"id": TestBulkImport.product_ids[0], "name": "TEST_BULK A2", "price": "$11", "category": "test"},
            {"id": TestBulkImport.product_ids[1], "name": "TEST_BULK B2", "price": "$21", "category": "test"},
        ]
        r = s.post(f"{BASE_URL}/api/admin/products/bulk-import",
                   json=items, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["imported"] == 0
        assert j["updated"] == 2

    def test_cleanup_bulk(self, s, admin_headers):
        for pid in TestBulkImport.product_ids:
            s.delete(f"{BASE_URL}/api/admin/products/{pid}",
                     headers=admin_headers, timeout=15)


# -------- Reviews with approval --------
class TestReviewApproval:
    review_id = None
    product_id = f"TEST_PROD_{uuid.uuid4().hex[:6]}"

    def test_public_post_creates_pending(self, s):
        payload = {
            "productId": TestReviewApproval.product_id,
            "productName": "TEST_ProdName",
            "author": "TEST_Author",
            "email": "test@example.com",
            "rating": 5,
            "title": "good",
            "content": "content",
        }
        r = s.post(f"{BASE_URL}/api/reviews", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        # Public GET should NOT return it since it's pending
        time.sleep(0.2)
        r2 = s.get(f"{BASE_URL}/api/reviews/{TestReviewApproval.product_id}", timeout=15)
        assert r2.status_code == 200
        j = r2.json()
        assert j["totalReviews"] == 0, f"Expected pending review hidden, got {j}"

    def test_admin_list_and_approve(self, s, admin_headers):
        # Find the review via admin list
        r = s.get(f"{BASE_URL}/api/admin/reviews", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        matches = [rev for rev in r.json()["reviews"]
                   if rev.get("productId") == TestReviewApproval.product_id]
        assert matches, "review not found in admin list"
        rid = matches[0]["id"]
        TestReviewApproval.review_id = rid
        assert matches[0].get("status") == "pending"

        # Approve
        r2 = s.put(f"{BASE_URL}/api/admin/reviews/{rid}",
                   json={"status": "approved"}, headers=admin_headers, timeout=15)
        assert r2.status_code == 200, r2.text

        # Public GET now shows it
        r3 = s.get(f"{BASE_URL}/api/reviews/{TestReviewApproval.product_id}", timeout=15)
        assert r3.status_code == 200
        assert r3.json()["totalReviews"] == 1

    def test_admin_hide(self, s, admin_headers):
        if not TestReviewApproval.review_id:
            pytest.skip("no review")
        r = s.put(f"{BASE_URL}/api/admin/reviews/{TestReviewApproval.review_id}",
                  json={"status": "hidden"}, headers=admin_headers, timeout=15)
        assert r.status_code == 200
        # Public GET now hides it again
        r2 = s.get(f"{BASE_URL}/api/reviews/{TestReviewApproval.product_id}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["totalReviews"] == 0

    def test_cleanup_review(self, s, admin_headers):
        if TestReviewApproval.review_id:
            s.delete(f"{BASE_URL}/api/admin/reviews/{TestReviewApproval.review_id}",
                     headers=admin_headers, timeout=15)


# -------- Stripe Webhook --------
class TestStripeWebhook:
    def test_webhook_invalid_body(self, s):
        r = s.post(f"{BASE_URL}/api/payments/webhook/stripe",
                   data=b"not-json", timeout=15,
                   headers={"Content-Type": "application/json"})
        assert r.status_code == 400

    def test_webhook_dev_mode_accepts_unverified(self, s):
        event_id = f"evt_TEST_{uuid.uuid4().hex[:12]}"
        session_id = f"cs_TEST_{uuid.uuid4().hex[:12]}"
        event = {
            "id": event_id,
            "object": "event",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": session_id,
                    "object": "checkout.session",
                    "customer_email": "buyer@example.com",
                    "customer_details": {"email": "buyer@example.com", "name": "Test Buyer"},
                    "amount_total": 12345,
                    "currency": "cad",
                    "payment_status": "paid",
                    "metadata": {"order_items": "1"},
                }
            },
        }
        r = s.post(f"{BASE_URL}/api/payments/webhook/stripe",
                   data=json.dumps(event), timeout=30,
                   headers={"Content-Type": "application/json"})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("status") == "success"
        assert j.get("event_id") == event_id

        # Idempotent replay
        r2 = s.post(f"{BASE_URL}/api/payments/webhook/stripe",
                    data=json.dumps(event), timeout=30,
                    headers={"Content-Type": "application/json"})
        assert r2.status_code == 200, r2.text
        assert r2.json().get("status") == "already_processed"
