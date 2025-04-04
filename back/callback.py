# from flask import Blueprint, request, jsonify
# from app import db
# from models import Payment, Ticket
# from datetime import datetime
# from flask_restful import Resource



# def process_mpesa_callback(data):
#     result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
#     checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
#     callback_metadata = data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata', {}).get('Item', [])

#     if result_code == 0:
#         receipt_number = None
#         transaction_date = None
#         transaction_amount = None

#         for item in callback_metadata:
#             if item.get('Name') == 'MpesaReceiptNumber':
#                 receipt_number = item.get('Value')
#             elif item.get('Name') == 'TransactionDate':
#                 transaction_date_str = str(item.get('Value'))
#                 transaction_date = datetime.strptime(transaction_date_str, "%Y%m%d%H%M%S")
#             elif item.get('Name') == 'Amount':
#                 transaction_amount = float(item.get('Value'))

#         # Update Payment Record
#         payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
#         if payment:
#             payment.payment_status = 'Completed'
#             payment.transaction_id = receipt_number
#             payment.amount = transaction_amount
#             payment.payment_date = transaction_date
#             db.session.commit()

#             # Mark Ticket as Purchased
#             ticket = Ticket.query.filter_by(id=payment.ticket_id).first()
#             if ticket:
#                 ticket.status = 'purchased'
#                 db.session.commit()

#         return {'ResultCode': 0, 'ResultDesc': 'Accepted'}

#     return {'ResultCode': 1, 'ResultDesc': 'Failed'}
