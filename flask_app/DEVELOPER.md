Developer Guide — Loan Calculator
=========================================================

This file explains the main functions, routes, models, and client-side helpers so a developer can quickly understand and extend the project.

Project layout (short)
- run.py — small runner that builds the app with create_app() and starts it.
- config.py — Flask config.
- app/__init__.py — create_app() application factory, DB init and create_all.
- app/models.py — SQLAlchemy `db` object and `Calculation` model.
- app/routes.py — page routes and JSON API endpoints.
- app/static/js/script.js — client-side helpers used by calculator pages.
- app/templates/* — Jinja templates for UI.

Important design notes
- App uses factory pattern: `create_app()` in `app/__init__.py`.
- Database: Flask-SQLAlchemy. Tables are created at startup using `db.create_all()` (suitable for small projects; consider Flask-Migrate for production).
- Client-side evaluation: Basic and scientific calculators evaluate in browser using `eval`/`Function`. Keep that in mind for security.

File-by-file function reference

1) app/__init__.py
------------------
- create_app()
  - Purpose: create and configure a Flask app instance.
  - Steps:
    - Instantiate Flask, load `Config` from `config.py`.
    - Import `app.models` and call `models.db.init_app(app)` to bind SQLAlchemy to the app.
    - Enter an `app.app_context()` and call `models.db.create_all()` to ensure tables exist. Exceptions are printed and re-raised to make DB startup failures visible.
    - Register the blueprint `bp` from `app.routes`.
  - Inputs: none; returns a configured Flask app.
  - Notes: If you add models, the DB tables will be created automatically on startup.

2) app/models.py
----------------
- db: SQLAlchemy() instance
  - Used by routes to perform DB operations.
- Calculation (SQLAlchemy model)
  - Columns:
    - id: Integer primary key
    - expression: String(200) — a textual representation of the calculation
    - result: Float — numeric result
    - calculation_type: String(50) — e.g., 'basic', 'scientific', 'loan', 'client'
    - inputs_count: Integer — # of input fields used for the calculation
    - timestamp: DateTime — defaults to utcnow
  - __repr__ returns a readable string for debugging

3) app/routes.py — page routes and API endpoints
------------------------------------------------
This file registers a Blueprint `bp` and exposes both page routes (GET) and JSON API endpoints (POST). All JSON endpoints assume/expect application/json bodies.

Page routes (GET):
- index()
  - Route: `/`
  - Renders: `index.html` (home page)
- basic_calculator()
  - Route: `/basic-calculator`
  - Renders: `basic_calculator.html`
- scientific_calculator()
  - Route: `/scientific-calculator`
  - Renders: `scientific_calculator.html`
- loan_calculator()
  - Route: `/loan-calculator`
  - Renders: `loan_calculator.html`
- history()
  - Route: `/history`
  - Behavior: queries last 100 `Calculation` entries ordered by timestamp desc and renders `history.html` with `entries` context.

JSON API endpoints (POST):
- calculate_basic()
  - Route: `/api/calculate/basic`
  - Payload: JSON { num1, num2, operation }
    - operation: 'add' | 'subtract' | 'multiply' | 'divide'
  - Behavior:
    - Converts num1 and num2 to float, performs operation.
    - Validates division by zero.
    - Computes `inputs_count` by checking presence/non-empty of 'num1' and 'num2' in the payload.
    - Attempts to save a `Calculation` record with expression like "{num1} {operation} {num2}" and inputs_count; commits or rolls back on error.
    - Returns JSON { result } on success or { error } with 400 on failure.

- calculate_scientific()
  - Route: `/api/calculate/scientific`
  - Payload: JSON { value, operation, power? }
    - operation: 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'ln' | 'exp' | 'power'
    - For 'power', include `power` in payload.
  - Behavior:
    - Converts `value` to float and computes the requested operation using Python's math module.
    - Performs basic validation (e.g., non-negative for sqrt/log depending on math constraints).
    - Sets inputs_count to 1 for unary ops and 2 for power when an exponent is provided.
    - Saves a `Calculation` and returns { result }.

- calculate_loan()
  - Route: `/api/calculate/loan`
  - Payload: JSON { principal, annual_rate, years }
  - Behavior:
    - Converts inputs to floats and validates them (principal>0, years>0, annual_rate>=0).
    - Computes monthly payment using formula M = P[r(1+r)^n] / [(1+r)^n - 1] (with r monthly rate and n months).
    - If monthly rate == 0, falls back to simple division principal/months.
    - Calculates total_payment and total_interest.
    - Counts inputs_count based on which of the three fields are provided.
    - Saves a `Calculation` record where result is the total payment (rounded) and returns JSON with monthly_payment, total_payment, total_interest, principal.

- api_save()
  - Route: `/api/save`
  - Payload: JSON { expression, result, type?, inputs_count? }
  - Behavior: Generic client-side save endpoint used by client JS. Persists a Calculation with provided data (type defaults to 'client'). Returns { status: 'ok' } or error JSON.

- api_delete()
  - Route: `/api/delete`
  - Payload: JSON { id }
  - Behavior: Validates and converts `id` to int, loads the Calculation, deletes it, commits, and returns { status: 'ok' } or error JSON.

All endpoints catch exceptions and return JSON with error messages; DB write sections roll back on exceptions.

4) client-side: app/static/js/script.js
--------------------------------------
This file contains helper functions used by the basic and scientific calculator templates. Functions are written in plain JavaScript (no framework) and attached to DOM events.

Functions (client-side):
- appendToDisplay(value)
  - Appends a character or string to the calculator `#display` input. If the display currently reads '0' (and value isn't '.'), it replaces it.
  - Used by numeric/operator buttons.
- clearDisplay()
  - Resets `#display` value to '0'.
- calculate() (basic calculator variant)
  - Reads `#display`, replaces '×' with '*', evaluates the expression using `eval()`.
  - Sets the display to the result, and attempts to POST to `/api/save` with expression, result, type='basic', inputs_count computed by counting numeric tokens.
  - On errors, shows 'Error' and resets display shortly after.
- Keyboard support: document keydown listener
  - Intercepts numeric/operator keys, Enter, Escape, Backspace and routes them to corresponding functions.
- sendSave(expression, result, type = 'client', inputs_count = null)
  - Generic helper that posts a JSON object to `/api/save`. If inputs_count is null it counts numeric tokens with a regex.
- (Scientific helpers)
  - angleMode (global 'Deg'/'Rad') and toggleAngleMode() to switch.
  - lastAns stores last calculation result.
  - insertConstant(name) inserts `pi` or `e` into the display (to fixed precision strings).
  - percent() converts the trailing number to percent.
  - applyUnary(op) applies unary ops (sin, cos, tan, sqrt, sqr, cube, cuberoot, log, exp10) to the current display value and calls sendSave with inputs_count=1.
  - powerPrompt() prompts for exponent, computes base^p, sets display and calls sendSave with inputs_count=2.
  - nthRootPrompt() prompts for root degree and computes nth root, then sendSave inputs_count=2.
  - calculate() (scientific) evaluates the expression (replacing × and ÷ and ^ -> **), uses Function to evaluate, sets display and calls sendSave with computed inputs_count.

Notes about client-side code
- The code uses `eval`/Function for evaluation. Evaluate only trusted inputs or move to server.
- inputs_count detection is a simple numeric token count: (expr.match(/(\d+\.?\d*)/g) || []).length. It works for most numeric inputs, but may not count `pi`/`e` constants; some actions explicitly pass inputs_count.

5) config.py
------------
- Exposes `Config` class with:
  - SECRET_KEY
  - SQLALCHEMY_DATABASE_URI (absolute path built from `basedir`)
  - SQLALCHEMY_TRACK_MODIFICATIONS = False

6) run.py
---------
- Imports `create_app` and instantiates the app, then runs it when executed as main.

Developer tips and extension ideas
- Replace `db.create_all()` with Flask-Migrate for safe schema changes.
- Move scientific calculation evaluation to server-side to avoid `eval`.
- Add authentication and CSRF to protect delete/save endpoints (Flask-Login + Flask-WTF or similar).
- Improve inputs_count precision by explicitly tracking input controls rather than parsing the expression string.
- Add unit tests for endpoints using Flask's test client and pytest.

How to add a new calculation type
1. Add any server-side calculation helper (if needed) or client UI button.
2. If server-side: add a POST endpoint under `/api/calculate/<name>` that accepts JSON, computes result, records Calculation with suitable calculation_type and inputs_count, and returns JSON.
3. If client-side: add UI controls and call `sendSave(expression, result, type, inputs_count)` so history is recorded.

Contact points in code (quick reference)
- App factory: `app/__init__.py:create_app`
- Model: `app/models.py:Calculation`
- Routes and APIs: `app/routes.py` (search for `@bp.route` decorators)
- Client helpers: `app/static/js/script.js` (appendToDisplay, clearDisplay, calculate, sendSave, applyUnary, powerPrompt, nthRootPrompt)

If you'd like, I can:
- Generate an API Postman collection or curl examples for each endpoint.
- Add unit tests that exercise `/api/calculate/*` and `/api/save` and `/api/delete`.
- Migrate client eval to server-side calculations and wire the templates to call the server endpoints instead of evaluating in-browser.

