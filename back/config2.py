import os

class Config:
    
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'jbcollins254@gmail.com'
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')  
    MAIL_DEFAULT_SENDER = 'jbcollins254@gmail.com'

