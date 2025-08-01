// src/features/testing/flexibility/hipFlexorTest.js
import LocalizationService from '../../services/localizationServices.js';

class HipFlexorTest {
    constructor(goBackCallback) {
        this.container = document.createElement('div');
        this.container.className = 'test-container hip-flexor-test';
        this.goBack = goBackCallback;
    }

    render(mainContentEl) {
        this.container.innerHTML = `
            <div class="test-header">
                <h3>${LocalizationService.t('hipFlexor.title')}</h3>
                <button class="button-secondary" id="back-to-hub-btn">${LocalizationService.t('common.back')}</button>
            </div>
            <h4>${LocalizationService.t('hipFlexor.protocolTitle')}</h4>
            <ol class="protocol-list">
                <li>${LocalizationService.t('hipFlexor.step1')}</li>
                <li>${LocalizationService.t('hipFlexor.step2')}</li>
                <li>${LocalizationService.t('hipFlexor.step3')}</li>
                <li>${LocalizationService.t('hipFlexor.step4')}</li>
            </ol>
            <h4>${LocalizationService.t('hipFlexor.scoringTitle')}</h4>
            <div id="hip-flexor-result" class="test-result">
                <button class="button-primary" data-result="pass">${LocalizationService.t('hipFlexor.pass')}</button>
                <button class="button-secondary" data-result="fail">${LocalizationService.t('hipFlexor.fail')}</button>
            </div>
            <div id="result-log" class="result-log"></div>
        `;
        mainContentEl.appendChild(this.container);
        this.addEventListeners();
    }

    addEventListeners() {
        this.container.querySelector('#back-to-hub-btn').addEventListener('click', () => this.goBack());
        this.container.querySelector('#hip-flexor-result').addEventListener('click', this.handleResultClick.bind(this));
    }

    handleResultClick(event) {
        const result = event.target.dataset.result;
        if (!result) return;

        const resultLogEl = this.container.querySelector('#result-log');
        const resultText = result === 'pass' ? LocalizationService.t('hipFlexor.resultPass') : LocalizationService.t('hipFlexor.resultFail');
        
        resultLogEl.innerHTML = `<p><strong>${LocalizationService.t('hipFlexor.logPrefix')}</strong> ${resultText}</p>`;
        // In a real scenario, this result would be saved.
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

export default HipFlexorTest;