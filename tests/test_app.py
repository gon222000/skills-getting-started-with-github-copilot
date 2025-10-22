import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "testuser@example.com"
    # Remove if exists (ignore error)
    client.delete(f"/activities/{activity}/participant", params={"email": email})
    # Signup
    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert response.status_code == 200
    assert f"Signed up {email}" in response.json()["message"]
    # Try duplicate signup
    response_dup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert response_dup.status_code == 400
    # Remove
    response_del = client.delete(f"/activities/{activity}/participant", params={"email": email})
    assert response_del.status_code == 200
    assert f"Removed {email}" in response_del.json()["message"]
    # Remove again (should 404)
    response_del2 = client.delete(f"/activities/{activity}/participant", params={"email": email})
    assert response_del2.status_code == 404

def test_signup_activity_not_found():
    response = client.post("/activities/Nonexistent/signup", params={"email": "nobody@example.com"})
    assert response.status_code == 404

def test_remove_participant_not_found():
    response = client.delete("/activities/Chess Club/participant", params={"email": "notfound@example.com"})
    assert response.status_code == 404
