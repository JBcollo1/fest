from app.main import bp

@bp.route('/')
def main():
  return "Hello API"

@bp.route('/index')
def index():
  return {
    1 : "Hello",
    2 : "api"
  }