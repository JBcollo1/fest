import uuid
from datetime import datetime
import requests
from requests.auth import HTTPBasicAuth
from models import Payment
from flask import Flask, request
from app import app, db
import base64
from datetime import datetime
import time


MPESA_BUSINESS_SHORT_CODE = '174379'
MPESA_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
MPESA_CALLBACK_URL = 'https://fest-hrrc.onrender.com/mpesa/callback'
MPESA_ACCOUNT_REFERENCE = 'Fika Events'
MPESA_TRANSACTION_DESC = 'Payment for Fika Events'



BASE_URL = "https://sandbox.safaricom.co.ke"  # Change for production

# Generate Access Token (Fetch Once & Reuse)
def generate_access_token():
    consumer_key="NZJepip8u4ih8kHjfLjGa3NYF4mew49vMGF4HqAlUaR80e3N"
    consumer_secret = "RMQnuli4SbkhM6I6UzaODrY9VIGODG9G2ggRHNsGvtOBf0AlZAWsHnEFMLAChBq3"
    endpoint = f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
    
    response = requests.get(endpoint, auth=HTTPBasicAuth(consumer_key, consumer_secret))
    if response.status_code == 200:
        return response.json().get("access_token")
    raise Exception("Failed to fetch access token")


def format_phone_number(phone_number):
    phone_number = str(phone_number).strip()
    if phone_number.startswith("0"):
        return "254" + phone_number[1:]
    elif not phone_number.startswith("254"):
        return "254" + phone_number
    return phone_number

# Generate Base64 Encoded Password
def generate_password(shortcode, passkey, timestamp):
    data_to_encode = shortcode + passkey + timestamp
    return base64.b64encode(data_to_encode.encode("utf-8")).decode("utf-8")

# Initiate Payment Request
def initiate_mpesa_payment(amount, phone_number, access_token):
    phone_number = format_phone_number(phone_number)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = generate_password(MPESA_BUSINESS_SHORT_CODE, MPESA_PASSKEY, timestamp)
    
    payload = {
        "BusinessShortCode": MPESA_BUSINESS_SHORT_CODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": str(int(amount)),
        "PartyA": phone_number,
        "PartyB": MPESA_BUSINESS_SHORT_CODE,
        "PhoneNumber": phone_number,
        "CallBackURL": MPESA_CALLBACK_URL,
        "AccountReference": MPESA_ACCOUNT_REFERENCE,
        "TransactionDesc": MPESA_TRANSACTION_DESC
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(f"{BASE_URL}/mpesa/stkpush/v1/processrequest", json=payload, headers=headers)
    return response.json()

# Verify Payment
def verify_mpesa_payment(checkout_request_id, access_token):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = generate_password(MPESA_BUSINESS_SHORT_CODE, MPESA_PASSKEY, timestamp)
    
    payload = {
        "BusinessShortCode": MPESA_BUSINESS_SHORT_CODE,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(f"{BASE_URL}/mpesa/stkpushquery/v1/query", json=payload, headers=headers)
    return response.json()

# Wait for Payment Confirmation
def wait_for_payment_confirmation(checkout_request_id, access_token, max_retries=10, delay=10):
    for _ in range(max_retries):
        payment_status = verify_mpesa_payment(checkout_request_id, access_token)
        result_code = payment_status.get("ResultCode")
        
        if result_code == "0":  # Success
            metadata = payment_status.get("CallbackMetadata", {}).get("Item", [])
            
            receipt_number = next((item["Value"] for item in metadata if item["Name"] == "MpesaReceiptNumber"), None)
            transaction_date = next((item["Value"] for item in metadata if item["Name"] == "TransactionDate"), None)
            transaction_amount = next((item["Value"] for item in metadata if item["Name"] == "Amount"), None)
            
            if transaction_date:
                transaction_date = datetime.strptime(str(transaction_date), "%Y%m%d%H%M%S")
            
            return {
                "status": "confirmed",
                "MpesaReceiptNumber": receipt_number,
                "TransactionDate": transaction_date,
                "TransactionAmount": float(transaction_amount) if transaction_amount else None,
                "details": payment_status
            }
        elif result_code is not None:
            return {"status": "canceled", "details": payment_status}
        
        time.sleep(delay)
    
    return {"status": "canceled", "details": "Payment status could not be confirmed"}
