
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


| **Timestamp** | **Input** | **Type** | **Actual Output** | **Result** |
|------------------|-----------------|------------|----------------------|-------------------|------------------------|
| TC01 | a = 2, b = 3 | 5 | 5 | ✅ Pass |
| TC02 | a = -1, b = 4 | 3 | 3 | ✅ Pass |
| TC03 | a = 0, b = 0 | 0 | 0 | ✅ Pass |