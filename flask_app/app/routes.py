from flask import Blueprint, render_template, request, jsonify
from datetime import datetime

bp = Blueprint('main', __name__)

# In-memory storage for calculation history
calculation_history = []

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/about')
def about():
    return render_template('about.html')

@bp.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    
    if not data or 'expression' not in data or 'result' not in data:
        return jsonify({'error': 'Invalid request'}), 400
    
    # Add to history
    calculation = {
        'expression': data['expression'],
        'result': data['result'],
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Keep only the last 10 calculations
    calculation_history.append(calculation)
    if len(calculation_history) > 10:
        calculation_history.pop(0)
    
    return jsonify({'status': 'success'})

@bp.route('/history')
def history():
    return jsonify(calculation_history)