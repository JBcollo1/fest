# from flask_restful import reqparse
# from flask import jsonify
# from email_service import EmailService

# email_service = EmailService()

# # Define parsers for email arguments
# email_parser = reqparse.RequestParser()
# email_parser.add_argument('recipient', type=str, required=True, help='Recipient email is required')
# email_parser.add_argument('subject', type=str, required=True, help='Subject is required')
# email_parser.add_argument('body', type=str, required=True, help='Body is required')
# email_parser.add_argument('attachment_path', type=str, required=False)

# qr_email_parser = reqparse.RequestParser()
# qr_email_parser.add_argument('recipient', type=str, required=True, help='Recipient email is required')
# qr_email_parser.add_argument('subject', type=str, required=True, help='Subject is required')
# qr_email_parser.add_argument('body', type=str, required=True, help='Body is required')
# qr_email_parser.add_argument('qr_data', type=str, required=True, help='QR data is required')

# def send_email():
#     args = email_parser.parse_args()
#     recipient = args['recipient']
#     subject = args['subject']
#     body = args['body']
#     attachment_path = args.get('attachment_path')

#     try:
#         email_service.send_email(recipient, subject, body, attachment_path)
#         return jsonify({"message": "Email sent successfully"})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# def send_email_with_qr():
#     args = qr_email_parser.parse_args()
#     recipient = args['recipient']
#     subject = args['subject']
#     body = args['body']
#     qr_data = args['qr_data']

#     try:
#         email_service.send_email_with_qr(recipient, subject, body, qr_data)
#         return jsonify({"message": "Email with QR code sent successfully"})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500 