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
            fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expression: display.value,
                    result: result
                })
            });

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