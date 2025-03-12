from app.admin import bp


@bp.route('/backoffice')
def index():
  return "Hello Dash"