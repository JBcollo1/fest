import os
basedir = os.path.abspath(os.path.dirname(__file__))
from datetime import timedelta

class Config:
  SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
  SQLALCHEMY_TRACK_MODIFICATIONS = False

  # JWT config
 
#   JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
#   JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30) 

  ITEMS_PER_PAGE = 8