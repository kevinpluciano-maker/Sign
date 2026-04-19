#!/usr/bin/env python3
"""
Test script to verify the order email notification content
"""

import requests
import json
import time

# Test data as specified in the review request
order_test_data = {
    "order_id": "ABS-TEST-002",
    "customer_name": "John Doe",
    "customer_email": "johndoe@example.com",
    "customer_phone": "+1 (555) 123-4567",
    "shipping_address": {
        "address": "123 Main Street, Apt 4B",
        "city": "Los Angeles",
        "state": "CA",
        "zip": "90001",
        "country": "US"
    },
    "items": [
        {
            "name": "Men Restroom Sign",
            "quantity": 2,
            "price": "58.00",
            "specifications": {
                "Size": "8 x 8 in",
                "Color": "Black on White",
                "Braille": "Yes (+$10 CAD)",
                "Custom Number": "Room 101"
            }
        },
        {
            "name": "Acrylic WC Restroom Sign",
            "quantity": 1,
            "price": "25.00",
            "specifications": {
                "Size": "3.9 in height",
                "Color": "Silver"
            }
        }
    ],
    "subtotal": "141.00",
    "shipping": "15.00",
    "tax": "18.33",
    "total": "174.33",
    "notes": "Please rush delivery - needed by Friday"
}

def test_order_notification():
    """Test the order notification endpoint"""
    print("🛒 Testing Order Notification with Detailed Logging")
    print("=" * 60)
    
    try:
        # Send the order notification
        response = requests.post(
            "https://coding-walkthrough.preview.emergentagent.com/api/orders/notify",
            json=order_test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📋 Response Data: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Order notification sent successfully!")
            print("\n📧 Check the backend logs above for the complete email content")
            print("🔍 The email should contain:")
            print("   • Order number: ABS-TEST-002")
            print("   • Customer: John Doe (johndoe@example.com)")
            print("   • Total: $174.33")
            print("   • Product specifications in highlighted sections:")
            print("     - Men Restroom Sign: 8 x 8 in, Black on White, Braille: Yes (+$10 CAD), Room 101")
            print("     - Acrylic WC Restroom Sign: 3.9 in height, Silver")
            print("   • Order notes: Please rush delivery - needed by Friday")
            return True
        else:
            print(f"❌ Order notification failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_order_notification()
    
    # Wait a moment for logs to appear
    time.sleep(2)
    
    print("\n" + "=" * 60)
    print("📋 BACKEND LOGS (Last 30 lines):")
    print("=" * 60)
    
    import subprocess
    try:
        result = subprocess.run(
            ["tail", "-n", "30", "/var/log/supervisor/backend.out.log"],
            capture_output=True,
            text=True
        )
        print(result.stdout)
    except Exception as e:
        print(f"Could not read logs: {e}")