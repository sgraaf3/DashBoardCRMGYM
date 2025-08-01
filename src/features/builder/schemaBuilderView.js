import { debounce } from '../../core/utils.js';

export default class SchemaBuilderView {
    constructor(app) {
        this.app = app;
        this.schema = null;
        this.blocks = [];
        this.onSave = null;
        this.container = null;
    }

    render(container, schema, onSave) {
        this.container = container;
        this.schema = schema || { id: `schema_${Date.now()}`, name: '', blocks: [] };
        this.blocks = JSON.parse(JSON.stringify(this.schema.blocks || [])); // Deep copy
        this.onSave = onSave;

        const t = this.app.localizationService.t.bind(this.app.localizationService);

        this.container.innerHTML = `
            <form id="schema-builder-form" class="modal-form" novalidate>
                <div class="form-group">
                    <label for="schema-name">${t('gym.schemaName', 'Schema Name')}</label>
                    <input type="text" id="schema-name" name="name" class="form-control" value="${this.schema.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="schema-use-hrm">${t('gym.useHrm', 'Use Heart Rate Monitor')}</label>
                    <input type="checkbox" id="schema-use-hrm" name="useHrm" ${this.schema.useHrm ? 'checked' : ''}>
                </div>

                <div id="schema-blocks-container" class="schema-blocks-container"></div>

                <div class="add-block-controls">
                    <h4>${t('gym.addBlock', 'Add Block')}</h4>
                    <div class="button-group">
                        <button type="button" class="btn" data-block-type="strength">${t('gym.strength', 'Strength')}</button>
                        <button type="button" class="btn" data-block-type="cardio">${t('gym.cardio', 'Cardio')}</button>
                        <button type="button" class="btn" data-block-type="breath">${t('gym.breath', 'Breath')}</button>
                        <button type="button" class="btn" data-block-type="rest">${t('gym.rest', 'Rest')}</button>
                        <button type="button" class="btn" data-block-type="questionnaire">${t('gym.questionnaire', 'Questionnaire')}</button>
                    </div>
                </div>
            </form>
        `;

        this.renderAllBlocks();
        this.addEventListeners();
    }

    renderAllBlocks() {
        const container = this.container.querySelector('#schema-blocks-container');
        container.innerHTML = this.blocks.map((block, index) => this._renderBlock(block, index)).join('');
    }

    _renderBlock(block, index) {
        const t = this.app.localizationService.t.bind(this.app.localizationService);
        let content;

        switch (block.type) {
            case 'strength':
                content = `
                    <div class="form-group">
                        <label>${t('gym.exerciseName', 'Exercise Name')}</label>
                        <input type="text" class="form-control" data-index="${index}" data-field="exercise" value="${block.exercise || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>${t('gym.sets', 'Sets')}</label><input type="number" class="form-control" data-index="${index}" data-field="sets" value="${block.sets || '3'}" min="1"></div>
                        <div class="form-group"><label>${t('gym.reps', 'Reps')}</label><input type="text" class="form-control" data-index="${index}" data-field="reps" value="${block.reps || '8-12'}"></div>
                        <div class="form-group"><label>${t('gym.restSeconds', 'Rest (s)')}</label><input type="number" class="form-control" data-index="${index}" data-field="rest" value="${block.rest || '60'}" min="0"></div>
                    </div>
                `;
                break;
            case 'cardio':
                content = `
                    <div class="form-group">
                        <label>${t('gym.activity', 'Activity')}</label>
                        <input type="text" class="form-control" data-index="${index}" data-field="activity" value="${block.activity || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>${t('gym.durationMinutes', 'Duration (min)')}</label><input type="number" class="form-control" data-index="${index}" data-field="duration" value="${block.duration || '20'}" min="1"></div>
                        <div class="form-group"><label>${t('gym.intensity', 'Intensity')}</label><input type="text" class="form-control" data-index="${index}" data-field="intensity" value="${block.intensity || 'Zone 2'}"></div>
                    </div>
                `;
                break;
            case 'breath':
                content = `
                    <div class="form-group">
                        <label>${t('gym.breathTechnique', 'Technique')}</label>
                        <select class="form-control" data-index="${index}" data-field="technique">
                            <option value="box" ${block.technique === 'box' ? 'selected' : ''}>${t('gym.breathTechniques.box', 'Box Breathing (4-4-4-4)')}</option>
                            <option value="4-7-8" ${block.technique === '4-7-8' ? 'selected' : ''}>${t('gym.breathTechniques.478', '4-7-8 Breathing')}</option>
                            <option value="physiologicSigh" ${block.technique === 'physiologicSigh' ? 'selected' : ''}>${t('gym.breathTechniques.physiologicSigh', 'Physiologic Sigh')}</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>${t('gym.durationSeconds', 'Duration (s)')}</label><input type="number" class="form-control" data-index="${index}" data-field="duration" value="${block.duration || '180'}" min="10"></div>
                    </div>
                `;
                break;
            case 'questionnaire':
                const questionnaires = this.app.dataStore.getQuestionnaires() || [];
                content = `
                    <div class="form-group">
                        <label>${t('gym.selectQuestionnaire', 'Select Questionnaire')}</label>
                        <select class="form-control" data-index="${index}" data-field="questionnaireId">
                            ${questionnaires.map(q => `<option value="${q.id}" ${block.questionnaireId === q.id ? 'selected' : ''}>${q.name}</option>`).join('')}
                        </select>
                         <p class="note">${t('gym.questionnaireNote', 'Select a pre-defined questionnaire to include in the workout.')}</p>
                    </div>
                `;
                break;
            case 'rest':
                content = `
                    <div class="form-group">
                        <label>${t('gym.restDurationSeconds', 'Rest Duration (s)')}</label>
                        <input type="number" class="form-control" data-index="${index}" data-field="duration" value="${block.duration || '120'}" min="10" required>
                    </div>
                `;
                break;
        }

        return `
            <div class="schema-block" data-index="${index}" draggable="true">
                <div class="schema-block-header" title="${t('common.dragToReorder', 'Drag to reorder')}">
                    <span class="drag-handle" aria-label="${t('common.dragToReorder', 'Drag to reorder')}">⠿</span>
                    <strong>${t('gym.blockType.' + block.type, block.type.charAt(0).toUpperCase() + block.type.slice(1))} #${index + 1}</strong>
                    <button type="button" class="btn-icon delete-block-btn" title="${t('common.delete', 'Delete')}" aria-label="${t('common.delete', 'Delete')}">🗑️</button>
                </div>
                <div class="schema-block-content">${content}</div>
            </div>
        `;
    }

    addEventListeners() {
        const form = this.container.querySelector('#schema-builder-form');
        const blocksContainer = this.container.querySelector('#schema-blocks-container');

        // --- Form Submission ---
        // The modal's save button will trigger this, not a submit button inside the form.
        this.app.uiManager.setModalSaveCallback(async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            this.schema.name = this.container.querySelector('#schema-name').value;
            this.schema.useHrm = this.container.querySelector('#schema-use-hrm').checked;
            this.schema.blocks = this.blocks;
            await this.app.dataStore.saveWorkoutSchema(this.schema);
            this.app.uiManager.showNotification(this.app.localizationService.t('gym.schemaSaved', 'Schema saved successfully!'), 'success');
            if (this.onSave) {
                this.onSave(this.schema);
            }
            this.app.uiManager.closeModal();
        });

        // --- Block Controls ---
        this.container.querySelector('.add-block-controls').addEventListener('click', e => {
            if (e.target.dataset.blockType) {
                this.addBlock(e.target.dataset.blockType);
            }
        });

        blocksContainer.addEventListener('click', e => {
            if (e.target.classList.contains('delete-block-btn')) {
                const index = parseInt(e.target.closest('.schema-block').dataset.index, 10);
                this.blocks.splice(index, 1);
                this.renderAllBlocks();
            }
        });

        // --- Drag and Drop Logic ---
        let draggedItem = null;

        blocksContainer.addEventListener('dragstart', e => {
            if (e.target.classList.contains('schema-block')) {
                draggedItem = e.target;
                setTimeout(() => draggedItem.classList.add('dragging'), 0);
            }
        });

        blocksContainer.addEventListener('dragend', e => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                // Re-order the internal array based on the new DOM order
                const newOrderedBlocks = [];
                const blockElements = this.container.querySelectorAll('.schema-block');
                blockElements.forEach(el => {
                    const originalIndex = parseInt(el.dataset.index, 10);
                    newOrderedBlocks.push(this.blocks[originalIndex]);
                });
                this.blocks = newOrderedBlocks;
                this.renderAllBlocks(); // Re-render to update indices
                this.app.uiManager.showNotification('Block order updated.', 'info');
            }
            draggedItem = null;
        });

        // --- Data Binding for Block Inputs ---
        const debouncedUpdate = debounce((index, field, value) => {
            if (this.blocks[index]) {
                this.blocks[index][field] = value;
            }
        }, 300);

        blocksContainer.addEventListener('input', e => {
            const target = e.target;
            const { index, field } = target.dataset;
            if (index !== undefined && field) {
                const value = target.type === 'checkbox' ? target.checked : target.value;
                debouncedUpdate(parseInt(index, 10), field, value);
            }
        });
    }

    addBlock(type) {
        const newBlock = { type };
        switch (type) {
            case 'strength':
                Object.assign(newBlock, { exercise: '', sets: 3, reps: '8-12', rest: 60 });
                break;
            case 'cardio':
                Object.assign(newBlock, { activity: '', duration: 20, intensity: 'Zone 2' });
                break;
            case 'breath':
                Object.assign(newBlock, { technique: 'box', duration: 180 });
                break;
            case 'questionnaire':
                Object.assign(newBlock, { questionnaireId: '' });
                break;
            case 'rest':
                Object.assign(newBlock, { duration: 120 });
                break;
        }
        this.blocks.push(newBlock);
        this.renderAllBlocks();
    }
}