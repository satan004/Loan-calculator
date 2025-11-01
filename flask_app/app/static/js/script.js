function appendToDisplay(value) {
    const display = document.getElementById('display');
    if (display.value === '0' && value !== '.') {
        display.value = value;
    } else {
        display.value += value;
    }
}

function clearDisplay() {
    document.getElementById('display').value = '0';
}

function calculate() {
    const display = document.getElementById('display');
    try {
        // Replace × with * for calculation
        const expression = display.value.replace(/×/g, '*');
        const result = eval(expression);
        display.value = result;

        // Send calculation to server for history (optional)
        try {
            const exprStr = String(expression);
            const nums = (exprStr.match(/(\d+\.?\d*)/g) || []).length;
            fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expression: expression, result: result, type: 'basic', inputs_count: nums })
            });
        } catch (e) {
            // ignore save errors
        }

    } catch (error) {
        display.value = 'Error';
        setTimeout(clearDisplay, 1000);
    }
}

// Add keyboard support
document.addEventListener('keydown', function (event) {
    const key = event.key;

    if (/[0-9+\-*/.()]/.test(key)) {
        event.preventDefault();
        appendToDisplay(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    } else if (key === 'Escape') {
        event.preventDefault();
        clearDisplay();
    } else if (key === 'Backspace') {
        event.preventDefault();
        const display = document.getElementById('display');
        if (display.value.length > 1) {
            display.value = display.value.slice(0, -1);
        } else {
            display.value = '0';
        }
    }
});

// helper for other pages to save client-side results
function sendSave(expression, result, type = 'client', inputs_count = null) {
    try {
        if (inputs_count === null) {
            inputs_count = (String(expression).match(/(\d+\.?\d*)/g) || []).length;
        }
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression: expression, result: result, type: type, inputs_count: inputs_count })
        });
    } catch (e) {
        // ignore
    }
}
// Scientific calculator client-side logic
let angleMode = 'Deg'; // or 'Rad'
let lastAns = 0;

function toggleAngleMode() {
    angleMode = angleMode === 'Deg' ? 'Rad' : 'Deg';
    document.getElementById('angleToggle').textContent = angleMode;
}

function appendToDisplay(value) {
    const d = document.getElementById('display');
    if (d.value === '0' && value !== '.') d.value = value;
    else d.value += value;
}

function clearDisplay() {
    document.getElementById('display').value = '0';
}

function backspace() {
    const d = document.getElementById('display');
    if (d.value.length <= 1) d.value = '0';
    else d.value = d.value.slice(0, -1);
}

function toggleAns() {
    appendToDisplay(lastAns.toString());
}

function insertConstant(name) {
    if (name === 'pi') appendToDisplay(Math.PI.toFixed(8));
    if (name === 'e') appendToDisplay(Math.E.toFixed(8));
}

function percent() {
    // Convert last number to percent
    const d = document.getElementById('display');
    d.value = d.value.replace(/(\d+\.?\d*)$/, (m) => (parseFloat(m) / 100).toString());
}

function applyUnary(op) {
    const d = document.getElementById('display');
    let x = parseFloat(d.value);
    try {
        let res = x;
        if (op === 'sin') res = angleMode === 'Deg' ? Math.sin(x * Math.PI / 180) : Math.sin(x);
        else if (op === 'cos') res = angleMode === 'Deg' ? Math.cos(x * Math.PI / 180) : Math.cos(x);
        else if (op === 'tan') res = angleMode === 'Deg' ? Math.tan(x * Math.PI / 180) : Math.tan(x);
        else if (op === 'sqrt') res = Math.sqrt(x);
        else if (op === 'sqr') res = x * x;
        else if (op === 'cube') res = Math.pow(x, 3);
        else if (op === 'cuberoot') res = Math.cbrt(x);
        else if (op === 'log') res = Math.log10(x);
        else if (op === 'exp10') res = Math.pow(10, x);
        else res = x;
        if (isNaN(res) || !isFinite(res)) throw new Error('Invalid result');
        d.value = String(res);
        lastAns = res;
        // save to server history (single input)
        sendSave(`${op}(${x})`, res, 'scientific', 1);
    } catch (e) {
        d.value = 'Error';
        setTimeout(() => d.value = '0', 1200);
    }
}

function powerPrompt() {
    const d = document.getElementById('display');
    const base = parseFloat(d.value);
    const p = prompt('Enter power (exponent):', '2');
    if (p === null) return;
    const res = Math.pow(base, parseFloat(p));
    d.value = String(res);
    lastAns = res;
    sendSave(`${base}^${p}`, res, 'scientific', 2);
}

function nthRootPrompt() {
    const d = document.getElementById('display');
    const val = parseFloat(d.value);
    const n = prompt('Enter root degree (n):', '2');
    if (n === null) return;
    const res = Math.pow(val, 1 / parseFloat(n));
    d.value = String(res);
    lastAns = res;
    sendSave(`root(${n},${val})`, res, 'scientific', 2);
}

function calculate() {
    const d = document.getElementById('display');
    let expr = d.value.replace(/×/g, '*').replace(/÷/g, '/');
    // allow ^ as exponent by replacing ^ with **
    expr = expr.replace(/\^/g, '**');
    try {
        // evaluate using Function
        const result = Function('return (' + expr + ')')();
        d.value = String(result);
        lastAns = result;
        // compute inputs count from numeric tokens in expression
        const nums = (expr.match(/(\d+\.?\d*)/g) || []).length;
        sendSave(expr, result, 'scientific', nums);
    } catch (e) {
        d.value = 'Error';
        setTimeout(() => d.value = '0', 1200);
    }
}

function sendSave(expression, result, type = 'scientific', inputs_count = null) {
    try {
        if (inputs_count === null) {
            inputs_count = (String(expression).match(/(\d+\.?\d*)/g) || []).length;
        }
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression: expression, result: result, type: type, inputs_count: inputs_count })
        });
    } catch (e) {
        // ignore save errors
    }
}

// keyboard support (basic)
document.addEventListener('keydown', (ev) => {
    const key = ev.key;
    if (/^[0-9]$/.test(key) || ['+', '-', '*', '/', '.', '(', ')', '%'].includes(key)) {
        ev.preventDefault(); appendToDisplay(key);
    } else if (key === 'Enter') { ev.preventDefault(); calculate(); }
    else if (key === 'Backspace') { ev.preventDefault(); backspace(); }
    else if (key === 'Escape') { ev.preventDefault(); clearDisplay(); }
});
