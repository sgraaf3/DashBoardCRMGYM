class BmiCalculator {
    render(container) {
        container.innerHTML = `
            <div class="tool-card">
                <h3>BMI Calculator</h3>
                <form id="bmi-form">
                    <div class="form-group"><label for="height">Height (cm)</label><input type="number" id="height" required></div>
                    <div class="form-group"><label for="weight">Weight (kg)</label><input type="number" id="weight" required></div>
                    <button type="submit" class="btn btn-primary">Calculate</button>
                </form>
                <div id="bmi-result" class="tool-result"></div>
            </div>
        `;
        this.attachEventListeners(container);
    }
    attachEventListeners(container) {
        container.querySelector('#bmi-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const height = parseFloat(container.querySelector('#height').value);
            const weight = parseFloat(container.querySelector('#weight').value);
            const resultDiv = container.querySelector('#bmi-result');
            if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
                resultDiv.innerHTML = `<p class="error">Please enter valid height and weight.</p>`;
                return;
            }
            const bmi = weight / ((height / 100) ** 2);
            resultDiv.innerHTML = `<p>Your BMI is <strong>${bmi.toFixed(2)}</strong>.</p>`;
        });
    }
}

export default BmiCalculator;