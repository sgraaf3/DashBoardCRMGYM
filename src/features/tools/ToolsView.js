import WorkoutTimer from './workoutTimer.js';
import BmiCalculator from './bmiCalculator.js';
import ReactionTimeGame from './reactionTimeGame.js';

class ToolsView {
    constructor(app) {
        this.app = app;
        this.tools = {
            timer: new WorkoutTimer(),
            bmi: new BmiCalculator(),
            reaction: new ReactionTimeGame()
        };
    }

    render(container) {
        container.innerHTML = `
            <div class="view-header"><h1>Tools</h1></div>
            <div class="tools-grid">
                <div id="tool-timer"></div>
                <div id="tool-bmi"></div>
                <div id="tool-reaction"></div>
            </div>
        `;
        this.tools.timer.render(container.querySelector('#tool-timer'));
        this.tools.bmi.render(container.querySelector('#tool-bmi'));
        this.tools.reaction.render(container.querySelector('#tool-reaction'));
    }
}

export default ToolsView;