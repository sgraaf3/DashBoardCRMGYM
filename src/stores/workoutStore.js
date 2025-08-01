class WorkoutStore {
    constructor() {
        this.data = {
            workoutSchemas: [],
            workoutLogs: [],
            scheduledWorkouts: [],
            trainerRatings: [],
            lessonTemplates: [],
            scheduledLessons: [],
            weeklyNotes: [] // e.g., { memberId, year, week, note }
        };
    }

    // --- Workout Schemas ---
    getWorkoutSchemas = () => this.data.workoutSchemas || [];
    getWorkoutSchema = (id) => this.getWorkoutSchemas().find(s => s.id == id);
    saveWorkoutSchema = async (schemaData) => {
        if (schemaData.id) {
            const index = this.getWorkoutSchemas().findIndex(s => s.id == schemaData.id);
            if (index !== -1) {
                this.data.workoutSchemas[index] = { ...this.data.workoutSchemas[index], ...schemaData };
                return this.data.workoutSchemas[index];
            }
        }
        const newSchema = { ...schemaData, id: Date.now() };
        this.data.workoutSchemas.push(newSchema);
        return newSchema;
    };
    deleteWorkoutSchema = async (id) => {
        this.data.workoutSchemas = this.getWorkoutSchemas().filter(s => s.id != id);
    };

    // --- Workout Logs ---
    getWorkoutLogs = () => this.data.workoutLogs || [];
    getWorkoutLogsForUser = (userId) => this.getWorkoutLogs().filter(log => log.userId == userId);
    saveWorkoutLog = async (logData) => {
        const newLog = { ...logData, id: Date.now() };
        this.data.workoutLogs.push(newLog);
        return newLog;
    };
    updateWorkoutLog = async (id, updatedData) => {
        const index = this.getWorkoutLogs().findIndex(l => l.id == id);
        if (index !== -1) {
            this.data.workoutLogs[index] = { ...this.data.workoutLogs[index], ...updatedData };
            return this.data.workoutLogs[index];
        }
        return null;
    };
    deleteWorkoutLog = async (id) => {
        this.data.workoutLogs = this.getWorkoutLogs().filter(l => l.id != id);
    };

    // --- Scheduled Workouts ---
    getScheduledWorkouts = () => this.data.scheduledWorkouts || [];
    addScheduledWorkout = async (workoutData) => {
        const newWorkout = { ...workoutData, id: Date.now() + Math.random() };
        this.data.scheduledWorkouts.push(newWorkout);
        return newWorkout;
    };
    updateScheduledWorkout = async (id, updatedData) => {
        const index = this.getScheduledWorkouts().findIndex(w => w.id == id);
        if (index !== -1) {
            this.data.scheduledWorkouts[index] = { ...this.data.scheduledWorkouts[index], ...updatedData };
            return this.data.scheduledWorkouts[index];
        }
        return null;
    };
    deleteScheduledWorkout = async (id) => {
        this.data.scheduledWorkouts = this.getScheduledWorkouts().filter(w => w.id != id);
    };
    deleteScheduledWorkouts = async (ids) => {
        const idSet = new Set(ids);
        this.data.scheduledWorkouts = this.getScheduledWorkouts().filter(w => !idSet.has(w.id));
    };

    // --- Lesson Templates ---
    getLessonTemplates = () => this.data.lessonTemplates || [];
    getLessonTemplateById = (id) => this.getLessonTemplates().find(t => t.id == id);
    addLessonTemplate = async (templateData) => {
        const newTemplate = { ...templateData, id: Date.now() };
        this.data.lessonTemplates.push(newTemplate);
        return newTemplate;
    };
    updateLessonTemplate = async (id, updatedData) => {
        const index = this.getLessonTemplates().findIndex(t => t.id == id);
        if (index !== -1) {
            this.data.lessonTemplates[index] = { ...this.data.lessonTemplates[index], ...updatedData };
            return this.data.lessonTemplates[index];
        }
        return null;
    };
    deleteLessonTemplate = async (id) => {
        this.data.lessonTemplates = this.getLessonTemplates().filter(t => t.id != id);
    };

    // --- Weekly Notes ---
    getWeeklyNote = (memberId, year, week) => {
        const note = (this.data.weeklyNotes || []).find(n => n.memberId == memberId && n.year == year && n.week == week);
        return note ? note.note : '';
    };
    saveWeeklyNote = async (memberId, year, week, note) => {
        if (!this.data.weeklyNotes) this.data.weeklyNotes = [];
        const index = this.data.weeklyNotes.findIndex(n => n.memberId == memberId && n.year == year && n.week == week);
        if (index !== -1) {
            this.data.weeklyNotes[index].note = note;
        } else {
            this.data.weeklyNotes.push({ memberId, year, week, note });
        }
    };
}

export const workoutStore = new WorkoutStore();