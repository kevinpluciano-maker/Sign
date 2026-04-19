"""
Backend tests for the rebuilt Admin Portal + Auth system.
Covers: /api/health, /api/auth/*, /api/admin/*, /api/products public.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://checkout-flow-176.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "kevinpluciano@gmail.com"
ADMIN_PASSWORD = "Ke34023616@"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --- Health ---
class TestHealth:
    def test_health(self, s):
        r = s.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert j.get("status") == "ok"
        assert j.get("database") == "connected"


# --- Auth ---
class TestAuth:
    def test_login_wrong_password(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_login_unknown_email(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "nobody@example.com", "password": "x"}, timeout=15)
        assert r.status_code == 401

    def test_login_success(self, admin_token):
        assert admin_token  # fixture runs login

    def test_me_no_token(self, s):
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_invalid_token(self, s):
        r = s.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer abc.def.ghi"}, timeout=15)
        assert r.status_code == 401

    def test_me_success(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/auth/me", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL
        assert u["role"] == "admin"
        assert "_id" not in u
        assert "password_hash" not in u


# --- Admin: stats / reviews / content / orders ---
class TestAdminProtection:
    def test_stats_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/stats", timeout=15)
        assert r.status_code == 401

    def test_products_admin_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/products", timeout=15)
        assert r.status_code == 401

    def test_reviews_admin_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/reviews", timeout=15)
        assert r.status_code == 401

    def test_content_admin_requires_auth(self, s):
        r = s.get(f"{BASE_URL}/api/admin/content", timeout=15)
        assert r.status_code == 401


class TestAdminStats:
    def test_stats(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        for k in ["products", "reviews", "orders", "newsletter_subscribers", "contact_submissions"]:
            assert k in j
            assert isinstance(j[k], int)


# --- Product CRUD ---
class TestProductCRUD:
    created_id = None

    def test_admin_list_products(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/products", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "products" in j and isinstance(j["products"], list)

    def test_create_product(self, s, admin_headers):
        payload = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:6]}",
            "price": "$99.00",
            "category": "test-category",
            "description": "automated test product",
            "featured": False,
            "published": True,
        }
        r = s.post(f"{BASE_URL}/api/admin/products", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 201, r.text
        p = r.json()
        assert p["name"] == payload["name"]
        assert p["price"] == "$99.00"
        assert "id" in p and isinstance(p["id"], str)
        assert "slug" in p and p["slug"]
        assert "created_at" in p and "updated_at" in p
        assert "_id" not in p
        TestProductCRUD.created_id = p["id"]

        # GET to verify persistence via public endpoint
        r2 = s.get(f"{BASE_URL}/api/products/{p['id']}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["name"] == payload["name"]

    def test_update_product(self, s, admin_headers):
        pid = TestProductCRUD.created_id
        assert pid, "create test must run first"
        r = s.put(
            f"{BASE_URL}/api/admin/products/{pid}",
            json={"price": "$123.00", "description": "updated desc", "featured": True},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        u = r.json()
        assert u["price"] == "$123.00"
        assert u["description"] == "updated desc"
        assert u["featured"] is True
        assert "_id" not in u

        # Verify via GET
        r2 = s.get(f"{BASE_URL}/api/products/{pid}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["price"] == "$123.00"

    def test_public_products_only_published(self, s):
        r = s.get(f"{BASE_URL}/api/products", timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "products" in j
        for p in j["products"]:
            assert p.get("published") is True
            assert "_id" not in p

    def test_unpublish_hides_from_public(self, s, admin_headers):
        pid = TestProductCRUD.created_id
        r = s.put(
            f"{BASE_URL}/api/admin/products/{pid}",
            json={"published": False},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        r2 = s.get(f"{BASE_URL}/api/products/{pid}", timeout=15)
        assert r2.status_code == 404  # unpublished, public GET hides it

    def test_delete_product(self, s, admin_headers):
        pid = TestProductCRUD.created_id
        r = s.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        # verify 404 after
        r2 = s.get(f"{BASE_URL}/api/products/{pid}", timeout=15)
        assert r2.status_code == 404
        # deleting again -> 404
        r3 = s.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers, timeout=15)
        assert r3.status_code == 404


# --- Reviews admin ---
class TestReviews:
    def test_list_reviews(self, s, admin_headers):
        r = s.get(f"{BASE_URL}/api/admin/reviews", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "reviews" in j and isinstance(j["reviews"], list)
        for rev in j["reviews"]:
            assert "_id" not in rev

    def test_update_unknown_review(self, s, admin_headers):
        r = s.put(
            f"{BASE_URL}/api/admin/reviews/nonexistent-id",
            json={"status": "approved"},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 404


# --- Content admin ---
class TestContent:
    def test_upsert_and_list_content(self, s, admin_headers):
        sid = f"test-section-{uuid.uuid4().hex[:6]}"
        r = s.put(
            f"{BASE_URL}/api/admin/content/{sid}",
            json={
                "content": "<p>hello</p>",
                "font_size": "18px",
                "font_family": "Inter",
                "plain_text": "hello",
            },
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json().get("section_id") == sid

        # Update (same section_id)
        r2 = s.put(
            f"{BASE_URL}/api/admin/content/{sid}",
            json={"content": "<p>updated</p>"},
            headers=admin_headers,
            timeout=15,
        )
        assert r2.status_code == 200

        # List all content
        r3 = s.get(f"{BASE_URL}/api/admin/content", headers=admin_headers, timeout=15)
        assert r3.status_code == 200
        sections = r3.json().get("sections", [])
        ids = [sec.get("section_id") for sec in sections]
        assert sid in ids
        # No _id leakage
        for sec in sections:
            assert "_id" not in sec

        # Public GET works too
        r4 = s.get(f"{BASE_URL}/api/content/{sid}", timeout=15)
        assert r4.status_code == 200
        assert r4.json()["content"] == "<p>updated</p>"


# --- Payments endpoint sanity ---
class TestPayments:
    def test_checkout_endpoint_exists(self, s):
        # Do NOT create a real checkout; just verify the endpoint responds with something
        # other than 404 (i.e., it's registered on the router).
        r = s.post(f"{BASE_URL}/api/payments/create-checkout-session", json={}, timeout=15)
        # Endpoint exists => not 404. It may be 400/422 due to missing body fields, which is fine.
        assert r.status_code != 404, f"Payment endpoint missing. Response: {r.status_code} {r.text[:200]}"
