import os

class Config2:
    
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'jbcollins254@gmail.com'
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')  
    MAIL_DEFAULT_SENDER = 'jbcollins254@gmail.com'
    BRAND_COLOR = "#2563eb"  
    BASE_URL = "https://fest-hrrc.onrender.com"  
    EMAIL_SENDER_NAME = "Event Team" 
