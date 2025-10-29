from flask import Flask
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize database (models.db is defined in app.models)
    from app import models
    models.db.init_app(app)

    with app.app_context():
        # create tables if they don't exist and show errors if creation fails
        try:
            models.db.create_all()
        except Exception as e:
            # print stacktrace so OperationalError details are visible when starting the app
            import traceback
            traceback.print_exc()
            # re-raise so startup fails loudly and the root cause can be diagnosed
            raise

    from app.routes import bp
    app.register_blueprint(bp)

    return app