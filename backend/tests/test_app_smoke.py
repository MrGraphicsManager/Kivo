import os

os.environ.setdefault("JWT_SECRET", "ci-only-test-secret")
os.environ.setdefault("CORS_ORIGINS", "https://officialdukaan.in")
os.environ.setdefault("SERVERLESS_TOKEN_SECRET", "ci-only-serverless-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "ci-google-client-id")

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import app


def test_app_imports_and_health_route_exists():
    routes = {route.path for route in app.routes}
    assert "/api/health" in routes
