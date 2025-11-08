Loan Calculator — README
=========================

Overview
--------
This is a small Flask web application that provides several calculator UIs (basic, scientific, and a loan calculator) and persists calculation history to a SQLite database. The project is organized as a Flask app factory with templates and static assets under `app/`.

Key features
- Basic calculator (client-side evaluation)
- Scientific calculator (client-side evaluation with many functions)
- Loan payment calculator (server-side calculation)
- Persistent history (SQLite + Flask-SQLAlchemy)
- History page where you can delete entries

Repository layout (important files)
- `run.py` — small runner that creates the Flask app via `create_app()` and starts it
- `config.py` — configuration, including SQLALCHEMY_DATABASE_URI (uses absolute path)
- `app/__init__.py` — application factory
- `app/models.py` — SQLAlchemy `Calculation` model + db object
- `app/routes.py` — page routes and API endpoints
- `app/templates/` — Jinja2 templates including `base.html`, `index.html`, calculators and `history.html`
- `app/static/` — CSS and JS assets

Requirements
- Python 3.8+
- Packages listed in `requirements.txt` (Flask, Flask-SQLAlchemy). Install with pip.

Install & run (PowerShell)
1. Create a Python virtual environment (recommended):

```powershell
cd 'c:\Users\SATAN.BUNTIT\Desktop\Loan-calculator\flask_app'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Run the app:

```powershell
# Option A: direct
python .\run.py

# Option B: Flask CLI
$env:FLASK_APP='run.py'; $env:FLASK_ENV='development'; flask run
```

By default the app runs on http://127.0.0.1:5000

Pages / Usage
- Home: `/` — index page (links to calculators and history)
- Basic Calculator: `/basic-calculator` — standard numeric keypad. Uses client-side evaluation and sends results to the server history.
- Scientific Calculator: `/scientific-calculator` — many scientific functions, angle toggle (Deg/Rad). Uses client-side evaluation and posts results to server history.
- Loan Calculator: `/loan-calculator` — fill principal, annual rate, and years. This calculation is performed server-side via `/api/calculate/loan` and the saved history entry stores inputs count.
- History: `/history` — shows recent calculations (timestamp, inputs count, type, expression, result). Each row has a trash icon button to delete that entry.

APIs (server)
- POST `/api/calculate/basic`
  - Body: JSON { num1, num2, operation }
  - Returns: { result }
  - Saves a Calculation record with inputs_count (number of non-empty inputs)

- POST `/api/calculate/scientific`
  - Body: JSON { value, operation, power? }
  - Returns: { result }
  - Saves Calculation with inputs_count (1 or 2 for power)

- POST `/api/calculate/loan`
  - Body: JSON { principal, annual_rate, years }
  - Returns: { monthly_payment, total_payment, total_interest }
  - Saves Calculation with inputs_count (how many of the 3 inputs were provided)

- POST `/api/save`
  - Body: JSON { expression, result, type (optional), inputs_count (optional) }
  - Use: called by client-side calculators to persist evaluated results

- POST `/api/delete`
  - Body: JSON { id }
  - Use: deletes Calculation with the given id. Called from the history page delete button.

Database
- Location: a SQLite file `calculations.db` is placed in the app folder next to `config.py`. The path is constructed from the config file as an absolute path, so it should remain consistent regardless of working directory.
- ORM: Flask-SQLAlchemy. Tables are created automatically on app startup via `models.db.create_all()`.

Security & notes
- Client-side evaluation: The basic and scientific calculators evaluate expressions in the browser using `Function()`/`eval`-style methods. This is fine for a local and trusted environment but not safe if you expose the app to untrusted users. Consider moving evaluation to the server or sanitizing expressions before evaluating if you plan to publish.
- No authentication or CSRF: The app currently doesn't protect API endpoints; if exposed publicly, add authentication and CSRF protection.

Troubleshooting
- OperationalError on DB open/creation
  - We set the SQLite URI to an absolute path in `config.py` to avoid relative path confusion. If you still see OperationalError on startup, run `python run.py` from the project folder and copy the traceback; `app/__init__.py` will print the full stack trace.
  - If the DB file is corrupt, delete `calculations.db` to let the app recreate it (only if you don't need existing data):

```powershell
Remove-Item '.\calculations.db'
```

- If templates are not showing the active sidebar icon
  - The base template uses `request.path` to add the `active` class. Make sure you're visiting the exact paths (e.g., `/basic-calculator`).

Developer notes & next steps
- Add Flask-Migrate for schema migrations instead of `create_all()`.
- Add server-side calculation for scientific expressions to avoid client-side `eval`.
- Add authentication and CSRF, and optionally user-scoped history.
- Add tests for API endpoints.

Contact / Help
If you want me to:
- Run the app and capture the startup logs, I can do that and paste the tracebacks here.
- Replace client eval with server-side computation (I'll implement `POST /api/calculate/scientific` backing the client UI), say so and I'll implement it.

-- End of README
