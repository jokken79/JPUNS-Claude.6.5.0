#!/usr/bin/env python3
"""Test script for yukyu API endpoints"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def get_token():
    """Get JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"[ERROR] Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

def test_endpoint(token, endpoint, description):
    """Test an API endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"Endpoint: {endpoint}")
    print(f"{'='*60}")

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        try:
            data = response.json()
            print(f"[OK] Response received successfully")
            print(f"Data type: {type(data).__name__}")
            if isinstance(data, list):
                print(f"Number of items: {len(data)}")
                if len(data) > 0:
                    print(f"First item sample:")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
            elif isinstance(data, dict):
                print(f"Keys: {list(data.keys())}")
                print(f"Response:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"[ERROR] Error parsing JSON: {e}")
            print(f"Raw response: {response.text[:500]}")
    else:
        print(f"[FAIL] Request failed")
        print(f"Response: {response.text}")

    return response

def main():
    print("Starting Yukyu API End-to-End Test")
    print("="*60)

    # Step 1: Get authentication token
    print("\nStep 1: Getting JWT token...")
    token = get_token()
    print(f"Token obtained: {token[:50]}...")

    # Step 2: Check employees count
    print("\nStep 2: Checking employee data...")
    employees_response = test_endpoint(token, "/api/employees?limit=5", "Employees List")

    # Step 3: Test yukyu balances
    print("\nStep 3: Testing yukyu balances endpoint...")
    balances_response = test_endpoint(token, "/api/yukyu/balances", "Yukyu Balances")

    # Step 4: Test yukyu requests
    print("\nStep 4: Testing yukyu requests endpoint...")
    requests_response = test_endpoint(token, "/api/yukyu/requests", "Yukyu Requests")

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"[OK] Authentication: Success")
    print(f"[{'OK' if employees_response.status_code == 200 else 'FAIL'}] Employees endpoint: {employees_response.status_code}")
    print(f"[{'OK' if balances_response.status_code == 200 else 'FAIL'}] Yukyu balances endpoint: {balances_response.status_code}")
    print(f"[{'OK' if requests_response.status_code == 200 else 'FAIL'}] Yukyu requests endpoint: {requests_response.status_code}")

    if balances_response.status_code == 200:
        try:
            balances = balances_response.json()
            print(f"\nYukyu balances data: {len(balances)} items")
        except:
            pass

    if requests_response.status_code == 200:
        try:
            reqs = requests_response.json()
            print(f"Yukyu requests data: {len(reqs)} items")
        except:
            pass

if __name__ == "__main__":
    main()
