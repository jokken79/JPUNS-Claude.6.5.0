def test_health_endpoint_returns_ok(client):
    response = client.get("/api/health", headers={"host": "localhost"})

    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    assert "timestamp" in data
