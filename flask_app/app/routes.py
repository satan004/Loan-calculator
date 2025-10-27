from flask import Blueprint, render_template, request, jsonify
import math

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/basic-calculator')
def basic_calculator():
    return render_template('basic_calculator.html')

@bp.route('/scientific-calculator')
def scientific_calculator():
    return render_template('scientific_calculator.html')

@bp.route('/loan-calculator')
def loan_calculator():
    return render_template('loan_calculator.html')

@bp.route('/api/calculate/basic', methods=['POST'])
def calculate_basic():
    try:
        data = request.json
        num1 = float(data.get('num1', 0))
        num2 = float(data.get('num2', 0))
        operation = data.get('operation')
        
        result = 0
        if operation == 'add':
            result = num1 + num2
        elif operation == 'subtract':
            result = num1 - num2
        elif operation == 'multiply':
            result = num1 * num2
        elif operation == 'divide':
            if num2 == 0:
                return jsonify({'error': 'Cannot divide by zero'}), 400
            result = num1 / num2
        
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/api/calculate/scientific', methods=['POST'])
def calculate_scientific():
    try:
        data = request.json
        value = float(data.get('value', 0))
        operation = data.get('operation')
        
        result = 0
        if operation == 'sin':
            result = math.sin(math.radians(value))
        elif operation == 'cos':
            result = math.cos(math.radians(value))
        elif operation == 'tan':
            result = math.tan(math.radians(value))
        elif operation == 'sqrt':
            if value < 0:
                return jsonify({'error': 'Cannot calculate square root of negative number'}), 400
            result = math.sqrt(value)
        elif operation == 'log':
            if value <= 0:
                return jsonify({'error': 'Cannot calculate logarithm of non-positive number'}), 400
            result = math.log10(value)
        elif operation == 'ln':
            if value <= 0:
                return jsonify({'error': 'Cannot calculate natural logarithm of non-positive number'}), 400
            result = math.log(value)
        elif operation == 'exp':
            result = math.exp(value)
        elif operation == 'power':
            power = float(data.get('power', 2))
            result = math.pow(value, power)
        
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/api/calculate/loan', methods=['POST'])
def calculate_loan():
    try:
        data = request.json
        principal = float(data.get('principal', 0))
        annual_rate = float(data.get('annual_rate', 0))
        years = float(data.get('years', 0))
        
        if principal <= 0 or annual_rate < 0 or years <= 0:
            return jsonify({'error': 'Invalid input values'}), 400
        
        # Convert annual rate to monthly rate
        monthly_rate = annual_rate / 100 / 12
        # Convert years to months
        months = years * 12
        
        # Calculate monthly payment using formula: M = P[r(1+r)^n]/[(1+r)^n-1]
        if monthly_rate == 0:
            monthly_payment = principal / months
        else:
            monthly_payment = principal * (monthly_rate * math.pow(1 + monthly_rate, months)) / (math.pow(1 + monthly_rate, months) - 1)
        
        total_payment = monthly_payment * months
        total_interest = total_payment - principal
        
        return jsonify({
            'monthly_payment': round(monthly_payment, 2),
            'total_payment': round(total_payment, 2),
            'total_interest': round(total_interest, 2),
            'principal': round(principal, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400