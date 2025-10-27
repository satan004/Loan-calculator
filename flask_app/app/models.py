# This file is for database models if needed
# Currently, the calculator doesn't require any database models
# You can add database models here if needed in the future

from datetime import datetime

class CalculationHistory:
    def __init__(self, expression, result, calculation_type):
        self.expression = expression
        self.result = result
        self.calculation_type = calculation_type
        self.timestamp = datetime.now()

# Example model for future use if you want to store calculations:
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Calculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    expression = db.Column(db.String(200), nullable=False)
    result = db.Column(db.Float, nullable=False)
    calculation_type = db.Column(db.String(50), nullable=False)  # 'basic', 'scientific', or 'loan'
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f'<Calculation {self.expression} = {self.result}>'
"""
