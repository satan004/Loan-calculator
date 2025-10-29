import os

# Use an absolute path for the SQLite file to avoid working-directory issues
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Flask configuration settings
    SECRET_KEY = 'your-secret-key'  # Change this to a secure secret key

    # Database configuration (SQLite DB stored next to config.py)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'calculations.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False