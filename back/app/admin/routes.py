from app.admin import bp

@bp.route('/')
@bp.route('/backoffice')
def index():
  return "Hello Dash"