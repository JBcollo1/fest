from app.auth import bp
from flask import redirect, url_for


@bp.route('/')
@bp.route('/login', methods=['GET', 'POST'])
def login():
  return "login - auth stuff"

@bp.route('/logout')
def logout():
  # logout function
  return redirect(url_for('main.index'))