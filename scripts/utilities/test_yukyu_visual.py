#!/usr/bin/env python3
"""Visual test script for yukyu dashboard using Playwright"""

from playwright.sync_api import sync_playwright
import sys
import time

def test_yukyu_dashboard():
    """Test the yukyu dashboard visually"""

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # Listen for console messages
        console_messages = []
        def handle_console(msg):
            console_messages.append(f"[{msg.type}] {msg.text}")
        page.on("console", handle_console)

        # Listen for network requests
        api_calls = []
        def handle_request(request):
            if '/api/yukyu' in request.url:
                api_calls.append({
                    'url': request.url,
                    'method': request.method,
                    'time': time.time()
                })
        page.on("request", handle_request)

        # Listen for network responses
        api_responses = []
        def handle_response(response):
            if '/api/yukyu' in response.url:
                api_responses.append({
                    'url': response.url,
                    'status': response.status,
                    'time': time.time()
                })
        page.on("response", handle_response)

        print("\n" + "="*60)
        print("YUKYU DASHBOARD VISUAL TEST")
        print("="*60)

        # Step 1: Navigate to login page
        print("\n[1/5] Navigating to login page...")
        page.goto("http://localhost:3000/login")
        page.wait_for_load_state("networkidle")
        print("[OK] Login page loaded")

        # Step 2: Login
        print("\n[2/5] Logging in as admin...")
        page.fill('input#username', 'admin')
        page.fill('input#password', 'admin123')
        page.click('button[type="submit"]')
        page.wait_for_url("**/dashboard", timeout=10000)
        print("[OK] Login successful")

        # Step 3: Navigate to yukyu page
        print("\n[3/5] Navigating to yukyu dashboard...")
        page.goto("http://localhost:3000/yukyu", wait_until="domcontentloaded", timeout=60000)
        # Wait for the page to stabilize (not networkidle as it might have polling)
        time.sleep(3)  # Give time for React to render and data to load
        print("[OK] Yukyu dashboard loaded")

        # Step 4: Take screenshot
        print("\n[4/5] Taking screenshot...")
        screenshot_path = "D:/UNS-ClaudeJP-5.4.1/yukyu_dashboard_screenshot.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"[OK] Screenshot saved to: {screenshot_path}")

        # Step 5: Check page content
        print("\n[5/5] Checking page content...")

        # Check for summary cards
        try:
            total_employees = page.locator('text="Total Employees"').first
            if total_employees.is_visible():
                print("[OK] 'Total Employees' card found")
            else:
                print("[WARN] 'Total Employees' card not visible")
        except:
            print("[ERROR] 'Total Employees' card not found")

        try:
            avg_remaining = page.locator('text="Average Remaining"').first
            if avg_remaining.is_visible():
                print("[OK] 'Average Remaining' card found")
            else:
                print("[WARN] 'Average Remaining' card not visible")
        except:
            print("[ERROR] 'Average Remaining' card not found")

        try:
            total_requests = page.locator('text="Total Requests"').first
            if total_requests.is_visible():
                print("[OK] 'Total Requests' card found")
            else:
                print("[WARN] 'Total Requests' card not visible")
        except:
            print("[ERROR] 'Total Requests' card not found")

        # Print API calls
        print("\n" + "="*60)
        print("API CALLS DETECTED")
        print("="*60)
        if api_calls:
            for call in api_calls:
                print(f"[REQUEST] {call['method']} {call['url']}")
        else:
            print("[WARN] No API calls to /api/yukyu endpoints detected")

        # Print API responses
        print("\n" + "="*60)
        print("API RESPONSES RECEIVED")
        print("="*60)
        if api_responses:
            for resp in api_responses:
                status_icon = "[OK]" if resp['status'] == 200 else "[FAIL]"
                print(f"{status_icon} {resp['status']} {resp['url']}")
        else:
            print("[WARN] No API responses from /api/yukyu endpoints")

        # Print console messages
        print("\n" + "="*60)
        print("BROWSER CONSOLE MESSAGES")
        print("="*60)
        if console_messages:
            for msg in console_messages[-20:]:  # Last 20 messages
                print(msg)
        else:
            print("[OK] No console messages")

        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"[OK] Login: Success")
        print(f"[OK] Navigation to yukyu page: Success")
        print(f"[OK] Screenshot taken: {screenshot_path}")
        print(f"[INFO] API calls made: {len(api_calls)}")
        print(f"[INFO] API responses received: {len(api_responses)}")
        print(f"[INFO] Console messages: {len(console_messages)}")

        # Keep browser open for manual inspection
        print("\n[INFO] Browser will stay open for 10 seconds for manual inspection...")
        time.sleep(10)

        browser.close()

if __name__ == "__main__":
    try:
        test_yukyu_dashboard()
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
