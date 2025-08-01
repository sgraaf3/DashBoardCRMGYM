import { ref } from 'vue';

export default {
    template: `
        <div class="training-schedule-widget">
            <h2>Training Schedule</h2>

            <section id="cardio">
                <h3>Cardio</h3>
                <p>Schedule your cardio workouts here.</p>
                <ul>
                    </ul>
            </section>

            <section id="strength">
                <h3>Strength</h3>
                <p>Plan your strength training sessions.</p>
                <ul>
                                        </ul>
            </section>

            <section id="flexibility">
                <h3>Flexibility</h3>
                <p>Don't forget to schedule your flexibility exercises.</p>
                <ul>
                                        </ul>
            </section>

            <section id="coordination">
                <h3>Coordination</h3>
                <p>Work on your Coordination exercises here.</p>
                <ul>
                </ul>
            </section>
        </div>
    `,
    setup() {
        // You can add Vue.js logic here if needed.
        return {};
    }
};