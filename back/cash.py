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

def generate_access_token():
    consumer_key="NZJepip8u4ih8kHjfLjGa3NYF4mew49vMGF4HqAlUaR80e3N"
    consumer_secret = "RMQnuli4SbkhM6I6UzaODrY9VIGODG9G2ggRHNsGvtOBf0AlZAWsHnEFMLAChBq3"
    endpoint = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

    response = requests.get (endpoint, auth=HTTPBasicAuth (consumer_key, consumer_secret))
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        raise Exception("Failed to fetch access token")


def format_phone_number(phone_number):
    if phone_number.startswith('0'):
        return '254' + phone_number[1:]
    elif not phone_number.startswith('254'):
        return '254' + phone_number
    return phone_number

import base64

def generate_password(business_short_code, passkey, timestamp):
    data_to_encode = business_short_code + passkey + timestamp
    encoded_bytes = base64.b64encode(data_to_encode.encode('utf-8'))  # Encode as bytes
    return encoded_bytes.decode('utf-8')  # Convert back to string

def initiate_mpesa_payment(amount, phone_number):
    phone_number = format_phone_number(phone_number)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = generate_password(MPESA_BUSINESS_SHORT_CODE, MPESA_PASSKEY, timestamp)

    payload = {
        "BusinessShortCode": MPESA_BUSINESS_SHORT_CODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": str(int(amount)) , 
        "PartyA": str(phone_number),
        "PartyB": MPESA_BUSINESS_SHORT_CODE,
        "PhoneNumber": str(phone_number),
        "CallBackURL": MPESA_CALLBACK_URL,
        "AccountReference": MPESA_ACCOUNT_REFERENCE,
        "TransactionDesc": MPESA_TRANSACTION_DESC
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {generate_access_token()}'
    }

    response = requests.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', json=payload, headers=headers)
    return response.json()



def verify_mpesa_payment(checkout_request_id):
    url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query"
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = generate_password(MPESA_BUSINESS_SHORT_CODE, MPESA_PASSKEY, timestamp)
    
    payload = {
        "BusinessShortCode": MPESA_BUSINESS_SHORT_CODE,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {generate_access_token()}'
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()



def wait_for_payment_confirmation(checkout_request_id, max_retries=10, delay=10):
    for _ in range(max_retries):
        payment_status = verify_mpesa_payment(checkout_request_id)
        result_code = payment_status.get('ResultCode')

        if result_code == '0':  # Success
            callback_metadata = payment_status.get('CallbackMetadata', {}).get('Item', [])
            receipt_number = None
            transaction_date = None
            transaction_amount = None  

            for item in callback_metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    receipt_number = item.get('Value')
                elif item.get('Name') == 'TransactionDate':
                    transaction_date_str = str(item.get('Value'))
                    transaction_date = datetime.strptime(transaction_date_str, "%Y%m%d%H%M%S")  # Convert to datetime
                elif item.get('Name') == 'Amount':  # Get actual amount received
                    transaction_amount = float(item.get('Value'))

            return {
                'status': 'confirmed',
                'MpesaReceiptNumber': receipt_number,
                'TransactionDate': transaction_date,
                'TransactionAmount': transaction_amount,  # Include amount
                'details': payment_status
            }
        elif result_code is not None:  
            return {'status': 'canceled', 'details': payment_status}

        time.sleep(delay)

    return {'status': 'canceled', 'details': 'Payment status could not be confirmed'}