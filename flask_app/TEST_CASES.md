Loan Calculator — Test Cases
============================

Purpose
-------
This document lists manual and automated test cases for the Loan Calculator app. It covers API endpoints, client-side UI behaviors, database expectations, edge cases, and suggested pytest examples for automation.

Prerequisites
-------------
- Python 3.8+
- Project dependencies installed in a virtualenv:

```powershell
cd 'c:\Users\SATAN.BUNTIT\Desktop\Loan-calculator\flask_app'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

- The app will create `calculations.db` on startup. For tests you may want to use a temporary SQLite DB or set `SQLALCHEMY_DATABASE_URI` to `sqlite:///:memory:` inside the test config.

How to run the app (manual verification)
---------------------------------------
```powershell
python .\run.py
# or using flask CLI
$env:FLASK_APP='run.py'; $env:FLASK_ENV='development'; flask run
```

Test categories
---------------
1. API tests (server-side)
2. UI / End-to-end tests (manual + automated via Selenium or Playwright)
3. Database tests
4. Edge cases & negative tests
5. Regression & concurrency tests

For each test case below: ID, Description, Steps, Expected Result, Notes.

API TESTS
---------
TC-API-001 — Basic calculate (add)
- Description: POST /api/calculate/basic add two numbers
- Request: POST /api/calculate/basic
  - JSON: { "num1": 5, "num2": 3, "operation": "add" }
- Steps:
  1. POST payload to endpoint
- Expected:
  - HTTP 200
  - Response JSON { "result": 8 }
  - A `Calculation` row is created with expression contains "5" and "3", result 8, calculation_type 'basic', inputs_count 2

TC-API-002 — Basic calculate (divide by zero)
- Description: Division by zero is rejected
- Request JSON: { "num1": 5, "num2": 0, "operation": "divide" }
- Expected:
  - HTTP 400
  - JSON contains error message 'Cannot divide by zero'
  - No new `Calculation` row created

TC-API-003 — Scientific calculate (sin)
- Description: Compute sine of 30 degrees
- Request: POST /api/calculate/scientific { "value": 30, "operation": "sin" }
- Expected:
  - HTTP 200
  - JSON { "result": ~0.5 } (use approximate match)
  - Calculation saved with calculation_type 'scientific' and inputs_count 1

TC-API-004 — Scientific calculate (sqrt negative)
- Request: { "value": -1, "operation": "sqrt" }
- Expected:
  - HTTP 400
  - JSON error message indicates invalid sqrt
  - No DB row

TC-API-005 — Scientific power
- Request: { "value": 2, "operation": "power", "power": 10 }
- Expected:
  - HTTP 200
  - result 1024
  - inputs_count 2 in DB

TC-API-006 — Loan calculation (zero interest)
- Request: { "principal": 1200, "annual_rate": 0, "years": 1 }
- Expected:
  - HTTP 200
  - monthly_payment 100
  - total_payment 1200
  - total_interest 0
  - DB row saved with calculation_type 'loan' and inputs_count 3

TC-API-007 — Loan calculation invalid inputs
- Request missing or invalid values (principal <= 0)
- Expected HTTP 400 with error message

TC-API-008 — Generic save endpoint
- POST /api/save with JSON { expression: '2+2', result: 4, type: 'basic', inputs_count: 2 }
- Expected 200 and DB row with matching fields

TC-API-009 — Delete endpoint (success)
- Precondition: ensure a Calculation row exists with id N
- POST /api/delete { id: N }
- Expected HTTP 200 { status: 'ok' } and row removed from DB

TC-API-010 — Delete endpoint (not found)
- POST /api/delete { id: 999999 }
- Expected HTTP 404 { error: 'not found' }

UI / END-TO-END TESTS (MANUAL)
------------------------------
TC-UI-001 — Basic calculator UI flow
- Steps:
  1. Open /basic-calculator
  2. Click '2', '+', '3', '='
- Expected:
  - Display shows 5
  - After compute, a history entry appears on /history (may require page refresh) with expression (or saved expression) and inputs_count 2

TC-UI-002 — Scientific unary op (sin)
- Steps:
  1. Open /scientific-calculator
  2. Enter 30, press 'sin' (ensure angle mode is Deg)
- Expected result ~0.5 and saved DB entry inputs_count 1

TC-UI-003 — Scientific power prompt
- Steps: enter 4, press x^n, input 3 -> result 64, saved with inputs_count 2

TC-UI-004 — Loan calculator form
- Steps: open /loan-calculator, enter principal/rate/years, submit
- Expected: show monthly payment and saved entry on DB with inputs_count reflecting filled fields

TC-UI-005 — History page delete
- Steps: open /history, click trash on a row and confirm
- Expected: row removed from the table and DB; API returns status ok

DATABASE TESTS
--------------
TC-DB-001 — DB creation on startup
- Steps: remove existing calculations.db then start app
- Expected: application should create new calculations.db and tables (no silent errors). If errors occur, the traceback will be printed.

TC-DB-002 — Calculation row fields
- After a successful calculation save, validate in DB:
  - id is int
  - expression matches expected
  - result numeric (Float)
  - calculation_type string
  - inputs_count matches expected count
  - timestamp is present and recent

TC-DB-003 — Delete removes DB row
- After calling /api/delete, query DB to ensure the row no longer exists

EDGE / NEGATIVE TESTS
---------------------
TC-EDGE-001 — Malformed JSON in API
- Send invalid JSON to /api/save
- Expected: HTTP 400 and proper error message (no crash)

TC-EDGE-002 — Large numbers
- Use large floats on scientific and basic endpoints; ensure correct handling and no overflow exceptions; server should return large numeric responses or meaningful errors

TC-EDGE-003 — Missing fields
- Call endpoints with missing fields and ensure safe defaults or 400 with helpful message

TC-EDGE-004 — SQL injection attempt in expression
- POST to /api/save with expression containing SQL or shell characters
- Expected: server stores expression as text only and DB is not corrupted (no SQL execution beyond ORM)

PERFORMANCE / CONCURRENCY (basic)
---------------------------------
TC-PERF-001 — Burst saves
- Rapidly POST many /api/save requests (e.g., 50) and confirm DB handles them and entries count increases accordingly. Watch for locks on SQLite with concurrent writes.

AUTOMATION: example pytest patterns
----------------------------------
Below are suggested pytest test templates. Put tests under `tests/` and run `pytest` after installing pytest.

Example: basic_api_test.py

```python
import json
import pytest
from app import create_app
from app import models

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    # Use in-memory DB for tests (optional)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        models.db.create_all()
        yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_basic_add(client):
    payload = { 'num1': 2, 'num2': 3, 'operation': 'add' }
    r = client.post('/api/calculate/basic', json=payload)
    assert r.status_code == 200
    data = r.get_json()
    assert data['result'] == 5

    # check DB
    from app.models import Calculation
    rows = models.Calculation.query.all()
    assert len(rows) == 1
    assert rows[0].calculation_type == 'basic'
```

Example: delete test

```python
def test_delete(client, app):
    # insert a row
    with app.app_context():
        c = models.Calculation(expression='1+1', result=2, calculation_type='test', inputs_count=2)
        models.db.session.add(c); models.db.session.commit()
        rid = c.id
    res = client.post('/api/delete', json={'id': rid})
    assert res.status_code == 200
    assert res.get_json()['status'] == 'ok'
    with app.app_context():
        assert models.Calculation.query.get(rid) is None
```

Notes about running automated tests
- Use `app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///:memory:'` or a temporary DB file to isolate tests.
- Avoid running tests against production DB.
- Use Flask test client for API-level tests. For full browser automation use Playwright, Selenium or similar.

Acceptance criteria
-------------------
- All positive API tests return expected HTTP status and payload.
- Negative tests return appropriate error codes without crashing the server.
- DB rows are created and removed as expected.
- UI flows (manual or automated) produce correct calculations and persist to DB.

Reporting and CI
----------------
- Add a GitHub Action that installs dependencies and runs pytest. On failure, action should expose the pytest output.

Next steps I can implement for you
---------------------------------
- Generate automated pytest files for the test cases above (I can create `tests/test_api.py` and other helpers).
- Add a GitHub Actions CI workflow that runs tests on push.
- Create basic Playwright tests for UI flows.

If you want automated tests created, tell me whether to use in-memory SQLite for test DB or create a temporary file in the workspace. I can then scaffold the `tests/` folder and a CI config.