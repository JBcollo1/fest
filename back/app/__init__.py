from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

my_metadata = MetaData()

class Base(DeclarativeBase):
  metadata = my_metadata
  
db = SQLAlchemy(model_class=Base)
migrate = Migrate()

def create_app(config_class=Config):
  app = Flask(__name__)
  app.config.from_object(config_class)

  db.init_app(app)
  migrate.init_app(app, db)

  from app.main import bp as main_bp
  app.register_blueprint(main_bp, url_prefix='/api')
  # http://127.0.0.1:5000/api/index

  from app.auth import bp as auth_bp
  app.register_blueprint(auth_bp, url_prefix='/api/auth')
  # http://127.0.0.1:5000/api/auth/login

  from app.admin import bp as admin_bp
  app.register_blueprint(admin_bp, url_prefix='/api/admin')
  # http://127.0.0.1:5000/api/admin/backoffice
  
  return app

from app import models