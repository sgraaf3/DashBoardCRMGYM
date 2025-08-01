import { debounce } from './utils.js';
import { userStore } from '../stores/userStore.js';
import { memberStore } from '../stores/memberStore.js';
import { employeeStore } from '../stores/employeeStore.js';
import { workoutStore } from '../stores/workoutStore.js';
import { financialStore } from '../stores/financialStore.js';
import { gymStore } from '../stores/gymStore.js';
import { messagingStore } from '../stores/messagingStore.js';

class DataStore {
    constructor() {
        this.emitter = {
            listeners: {},
            on(event, callback) {
                if (!this.listeners[event]) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(callback);
            },
            off(event, callback) {
                if (this.listeners[event]) {
                    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
                }
            },
            emit(event, data) {
                if (this.listeners[event]) {
                    this.listeners[event].forEach(callback => callback(data));
                }
            }
        };
        this._debouncedSavers = {};
    }

    _scheduleSave(storeKey, data) {
        if (!this._debouncedSavers[storeKey]) {
            this._debouncedSavers[storeKey] = debounce((d) => this._saveStoreData(storeKey, d), 500);
        }
        this._debouncedSavers[storeKey](data);
    }

    /**
     * Loads data for a specific store from its dedicated localStorage key.
     * @param {string} key - The localStorage key (e.g., 'userStore').
     * @param {object} defaultData - The default object structure if nothing is found.
     * @returns {object} The parsed data or the default data.
     */
    _loadStoreData(key, defaultData) {
        try {
            const savedData = localStorage.getItem(key);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error(`Failed to load or parse data for store '${key}':`, error);
        }
        return defaultData;
    }

    /**
     * Saves the data of a specific store to its dedicated localStorage key.
     * @param {string} key - The localStorage key (e.g., 'userStore').
     * @param {object} data - The data object to save.
     */
    _saveStoreData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save data for store '${key}':`, error);
        }
    }

    async init() {
        // Load each store's data from its own localStorage key.
        userStore.data = this._loadStoreData('userStore', { users: [], userConfigs: [] });
        employeeStore.data = this._loadStoreData('employeeStore', { employees: [] });
        memberStore.data = this._loadStoreData('memberStore', { members: [] });
        financialStore.data = this._loadStoreData('financialStore', { products: [], subscriptions: [], invoices: [], expenses: [], expenseCategories: [], invoiceTemplates: [] });
        workoutStore.data = this._loadStoreData('workoutStore', { workoutSchemas: [], workoutLogs: [], scheduledWorkouts: [], trainerRatings: [], lessonTemplates: [], scheduledLessons: [], weeklyNotes: [], questionnaires: [] });
        gymStore.data = this._loadStoreData('gymStore', { checkins: [], rooms: [] });
        messagingStore.data = this._loadStoreData('messagingStore', { messages: [] });

        // --- Data Migration for Members ---
        // Add contract dates to members who don't have them. This ensures backward compatibility.
        let membersModified = false;
        if (memberStore.data.members && memberStore.data.members.length > 0) {
            memberStore.data.members.forEach(member => {
                if (member.joinDate && (!member.contractEntryDate || !member.contractEndDate)) {
                    if (!member.contractEntryDate) {
                        member.contractEntryDate = member.joinDate;
                    }
                    if (!member.contractEndDate) {
                        const entryDate = new Date(member.joinDate);
                        const endDate = new Date(entryDate);
                        endDate.setFullYear(endDate.getFullYear() + 1);
                        member.contractEndDate = endDate.toISOString().split('T')[0];
                    }
                    membersModified = true;
                }
            });
        }
        if (membersModified) {
            console.log("MIGRATION: Added contract dates to existing members.");
            this._scheduleSave('memberStore', memberStore.data);
        }

        // --- Data Migration for Invoices ---
        // Backfills missing historical invoices for active members to ensure data integrity.
        let invoicesModified = false;
        const allMembers = memberStore.data.members || [];
        const allInvoices = financialStore.data.invoices || [];

        allMembers.forEach(member => {
            if (member.subscription?.status === 'Active' && member.joinDate) {
                const planDetails = {
                    'Premium Monthly': { price: 99.99, description: 'Premium Monthly Subscription' },
                    'Basic Monthly': { price: 49.99, description: 'Basic Monthly Subscription' }
                }[member.subscription.plan];

                if (!planDetails) return; // Skip if plan is unknown or not in our list

                let loopDate = new Date(member.joinDate);
                const today = new Date();
                const billingDay = new Date(member.joinDate).getDate(); // Use join day as billing day

                while (loopDate < today) {
                    const year = loopDate.getFullYear();
                    const month = loopDate.getMonth();

                    const invoiceExists = allInvoices.some(inv =>
                        inv.memberId === member.id &&
                        new Date(inv.date).getFullYear() === year &&
                        new Date(inv.date).getMonth() === month
                    );

                    if (!invoiceExists) {
                        const newInvoiceId = (allInvoices.reduce((max, i) => Math.max(max, i.id), 0)) + 1;
                        const invoiceDate = new Date(year, month, billingDay);
                        allInvoices.push({ id: newInvoiceId, memberId: member.id, amount: planDetails.price, date: invoiceDate.toISOString().split('T')[0], status: 'Paid', items: [{ description: planDetails.description, quantity: 1, price: planDetails.price }] });
                        invoicesModified = true;
                    }
                    loopDate.setMonth(loopDate.getMonth() + 1);
                }
            }
        });
        if (invoicesModified) {
            console.log("MIGRATION: Backfilled missing historical invoices.");
            this._scheduleSave('financialStore', financialStore.data);
        }

        // Bootstrap application with a default admin if no users exist.
        // This allows for first-time login and manual data entry.
        if (this.getUsers().length === 0) {
            console.warn("BOOTSTRAP: No users found. Creating default users for initial setup.");
            await this.bootstrapFullDataSet();
        }

        await this.generateScheduledLessons();
    }

    /**
     * Populates the entire application with a realistic, rich dataset for testing and demonstration.
     * This function is only called once when the database is empty.
     */
    async bootstrapFullDataSet() {
        console.log("BOOTSTRAP: Generating a full, realistic dataset...");

        // --- 1. Create System Users (Admin, Coaches) ---
        const createSystemUser = async (name, role, email, username, password) => {
            const employee = await this.addEmployee({ name, role, email, phone: '555-0101', hireDate: '2023-01-15', status: 'Active' });
            await this.addUser({ username, password, role, linkedEmployeeId: employee.id });
            console.log(`BOOTSTRAP: Created ${role} user '${username}'.`);
        };
        await createSystemUser('Admin User', 'Admin', 'admin@cute.hub', 'admin', 'password');
        await createSystemUser('John Coach', 'Coach', 'john.c@cute.hub', 'john.c@cute.hub', 'password');
        await createSystemUser('Sarah Coach', 'Coach', 'sarah.c@cute.hub', 'sarah.c@cute.hub', 'password');

        // --- 2. Create Workout Schemas & Lesson Templates ---
        const schemas = [
            { name: 'Full Body Strength A', mainSection: 'Strength', exercises: [{ name: 'Squats', sets: 3, reps: '8-12' }, { name: 'Bench Press', sets: 3, reps: '8-12' }, { name: 'Rows', sets: 3, reps: '8-12' }] },
            { name: 'Full Body Strength B', mainSection: 'Strength', exercises: [{ name: 'Deadlifts', sets: 3, reps: '5-8' }, { name: 'Overhead Press', sets: 3, reps: '8-12' }, { name: 'Pull-ups', sets: 3, reps: 'AMRAP' }] },
            { name: 'HIIT Cardio', mainSection: 'Cardio', exercises: [{ name: 'Assault Bike Sprints', sets: 8, reps: '20s on, 40s off' }] },
            { name: 'Endurance Run', mainSection: 'Cardio', exercises: [{ name: 'Treadmill Run', sets: 1, reps: '30 minutes' }] }
        ];
        for (const s of schemas) { await this.saveWorkoutSchema(s); }

        const lessonTemplates = [
            { name: 'Morning Yoga Flow', mainSection: 'Flexibility', dayOfWeek: 2, time: '07:00', maxCapacity: 15 },
            { name: 'Power Spin Class', mainSection: 'Cardio', dayOfWeek: 3, time: '18:00', maxCapacity: 20 },
            { name: 'Intro to Boxing', mainSection: 'Conditioning', dayOfWeek: 5, time: '19:00', maxCapacity: 12 }
        ];
        for (const lt of lessonTemplates) { await this.addLessonTemplate(lt); }

        // --- 3. Create Members and their associated data ---
        const memberNames = ['Alice Johnson', 'Bob Williams', 'Charlie Brown', 'Diana Miller', 'Ethan Davis', 'Fiona Garcia', 'George Rodriguez', 'Hannah Wilson', 'Ian Martinez', 'Jane Anderson'];
        const allSchemas = this.getWorkoutSchemas();

        for (const name of memberNames) {
            const username = `${name.split(' ')[0].toLowerCase()}@cute.hub`;
            const joinDateStr = '2023-05-20';
            const contractEndDate = new Date(joinDateStr);
            contractEndDate.setFullYear(contractEndDate.getFullYear() + 1);

            const member = await this.addMember({
                name, email: username,
                status: 'Active',
                joinDate: joinDateStr,
                contractEntryDate: joinDateStr,
                contractEndDate: contractEndDate.toISOString().split('T')[0]
            });
            await this.addUser({ username, password: 'password', role: 'Member', linkedMemberId: member.id });

            // --- 4. Generate Historical Data for each member ---
            const today = new Date();
            // Go back 8 weeks
            for (let i = 56; i > 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

                // Schedule a workout on Mon, Wed, Fri for this member
                if ([1, 3, 5].includes(dayOfWeek)) {
                    // Alternate between schema A and B
                    const schemaToAssign = (Math.floor(i / 7) % 2 === 0) ? allSchemas[0] : allSchemas[1];
                    const dateStr = date.toISOString().split('T')[0];

                    const scheduledWorkout = await this.addScheduledWorkout({
                        memberId: member.id,
                        schemaId: schemaToAssign.id,
                        date: dateStr
                    });

                    // For past dates, create a "completed" workout log
                    if (date < today) {
                        const logSets = schemaToAssign.exercises.map(ex => {
                            const sets = [];
                            for (let s = 0; s < ex.sets; s++) {
                                sets.push({
                                    setNumber: s + 1,
                                    weight: Math.floor(50 + (Math.random() * 50)), // Random weight
                                    reps: Math.floor(8 + (Math.random() * 4)), // Random reps
                                    notes: ''
                                });
                            }
                            return { exerciseName: ex.name, sets };
                        });

                        await this.saveWorkoutLog({
                            userId: member.id,
                            schemaId: schemaToAssign.id,
                            date: dateStr,
                            duration: Math.floor(45 + Math.random() * 30), // 45-75 mins
                            notes: `Completed on ${date.toLocaleDateString()}`,
                            sets: logSets,
                            hrvData: null, // Can be filled later
                            rating: { coach: Math.floor(3 + Math.random() * 3), gym: Math.floor(3 + Math.random() * 3) }
                        });
                    }
                }
            }

            // --- 5. Financial Data ---
            await this.updateMemberSubscription(member.id, { plan: 'Premium Monthly', status: 'Active', renewalDate: '2024-07-28' });
            await this.addInvoice({ memberId: member.id, amount: 99.99, date: '2024-06-28', status: 'Paid', items: [{ description: 'Premium Monthly', quantity: 1, price: 99.99 }] });
            await this.addInvoice({ memberId: member.id, amount: 99.99, date: '2024-05-28', status: 'Paid', items: [{ description: 'Premium Monthly', quantity: 1, price: 99.99 }] });
        }
        // --- 6. Expense Categories & Expenses ---
        const rentCategory = await this.addExpenseCategory({ name: 'Rent' });
        const utilitiesCategory = await this.addExpenseCategory({ name: 'Utilities' });
        const equipmentCategory = await this.addExpenseCategory({ name: 'Equipment' });
        const marketingCategory = await this.addExpenseCategory({ name: 'Marketing' });

        await this.addExpense({ date: '2024-06-01', description: 'Monthly Rent', amount: 2500.00, categoryId: rentCategory.id });
        await this.addExpense({ date: '2024-06-05', description: 'Electricity Bill', amount: 350.75, categoryId: utilitiesCategory.id });
        await this.addExpense({ date: '2024-06-15', description: 'New Dumbbell Set', amount: 899.99, categoryId: equipmentCategory.id });
        await this.addExpense({ date: '2024-05-01', description: 'Monthly Rent', amount: 2500.00, categoryId: rentCategory.id });
        await this.addExpense({ date: '2024-05-05', description: 'Water Bill', amount: 120.50, categoryId: utilitiesCategory.id });
        await this.addExpense({ date: '2024-05-20', description: 'Social Media Campaign', amount: 450.00, categoryId: marketingCategory.id });

        // --- 7. Questionnaires ---
        const questionnaires = [
            { id: 'q1', name: 'RPE (Rate of Perceived Exertion)', questions: [{ text: 'How hard was that session? (1-10)', type: 'scale' }] },
            { id: 'q2', name: 'Post-Workout Feeling', questions: [{ text: 'How do you feel?', type: 'text' }, { text: 'Any pain?', type: 'yes_no' }] }
        ];
        workoutStore.data.questionnaires = questionnaires;


        // --- 8. Financial Templates ---
        await this.saveInvoiceTemplate({
            id: 'default',
            companyName: 'C.U.T.E. Fitness Hub',
            companyAddress: '123 Wellness Way, Gymtown, 12345',
            companyLogo: '', // Base64 or URL
            footerText: 'Thank you for your business! Please contact us with any questions.',
            paymentTerms: 'Payment due within 14 days.'
        });

        console.log("BOOTSTRAP: Full dataset generation complete.");
    }

    // Delegate methods to individual stores
    getUsers = () => userStore.getUsers();
    getUserById = (id) => userStore.getUserById(id);
    getUserConfig = (userId) => userStore.getUserConfig(userId); // Read operation, no save needed
    saveUserConfig = (userId, config) => userStore.saveUserConfig(userId, config).then(() => this._scheduleSave('userStore', userStore.data));
    addUser = (userData) => userStore.addUser(userData).then(res => (this._scheduleSave('userStore', userStore.data), res));
    updateUser = (id, updatedData) => userStore.updateUser(id, updatedData).then(res => (this._scheduleSave('userStore', userStore.data), res));
    deleteUser = (id) => userStore.deleteUser(id).then(() => this._scheduleSave('userStore', userStore.data));

    getMembers = () => memberStore.getMembers();
    getMemberById = (id) => memberStore.getMemberById(id);
    async addMember(memberData) {
        const newMember = await memberStore.addMember(memberData);
        // Automatically create a linked user account
        await this.addUser({
            username: newMember.email,
            password: 'password', // Default password
            role: 'Member',
            linkedMemberId: newMember.id
        });
        this._scheduleSave('memberStore', memberStore.data);
        return newMember;
    }
    updateMember = (id, updatedData) => memberStore.updateMember(id, updatedData).then(res => (this._scheduleSave('memberStore', memberStore.data), res));
    updateMemberSubscription = (memberId, subscriptionData) => memberStore.updateMemberSubscription(memberId, subscriptionData).then(res => (this._scheduleSave('memberStore', memberStore.data), this.emitter.emit('subscriptionUpdated', { memberId }), res));
    deleteMember = (id) => memberStore.deleteMember(id).then(() => this._scheduleSave('memberStore', memberStore.data));

    getEmployees = () => employeeStore.getEmployees();
    getEmployeeById = (id) => employeeStore.getEmployeeById(id);
    async addEmployee(employeeData) {
        const newEmployee = await employeeStore.addEmployee(employeeData);
        // Automatically create a linked user account
        await this.addUser({
            username: employeeData.email, // Employee form must provide an email
            password: 'password', // Default password
            role: newEmployee.role,
            linkedEmployeeId: newEmployee.id
        });
        this._scheduleSave('employeeStore', employeeStore.data);
        return newEmployee;
    }
    updateEmployee = (id, updatedData) => employeeStore.updateEmployee(id, updatedData).then(res => (this._scheduleSave('employeeStore', employeeStore.data), res));
    deleteEmployee = (id) => employeeStore.deleteEmployee(id).then(() => this._scheduleSave('employeeStore', employeeStore.data));

    getWorkoutSchemas = () => workoutStore.getWorkoutSchemas();
    getWorkoutSchema = (id) => workoutStore.getWorkoutSchema(id);
    saveWorkoutSchema = (schemaData) => workoutStore.saveWorkoutSchema(schemaData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    deleteWorkoutSchema = (id) => workoutStore.deleteWorkoutSchema(id).then(() => this._scheduleSave('workoutStore', workoutStore.data));
    getWorkoutLogById = (id) => (this.getWorkoutLogs() || []).find(log => log.id === id);
    getWorkoutLogs = () => workoutStore.getWorkoutLogs();
    getWorkoutLogsForUser = (userId) => workoutStore.getWorkoutLogsForUser(userId);
    saveWorkoutLog = (logData) => workoutStore.saveWorkoutLog(logData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    updateWorkoutLog = (id, updatedData) => workoutStore.updateWorkoutLog(id, updatedData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    deleteWorkoutLog = (id) => workoutStore.deleteWorkoutLog(id).then(() => this._scheduleSave('workoutStore', workoutStore.data));
    getScheduledWorkouts = () => workoutStore.getScheduledWorkouts();
    addScheduledWorkout = (workoutData) => workoutStore.addScheduledWorkout(workoutData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    updateScheduledWorkout = (id, updatedData) => workoutStore.updateScheduledWorkout(id, updatedData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    deleteScheduledWorkout = (id) => workoutStore.deleteScheduledWorkout(id).then(() => this._scheduleSave('workoutStore', workoutStore.data));
    deleteScheduledWorkouts = (ids) => workoutStore.deleteScheduledWorkouts(ids).then(() => this._scheduleSave('workoutStore', workoutStore.data));
    getWeeklyNote = (memberId, year, week) => workoutStore.getWeeklyNote(memberId, year, week);
    saveWeeklyNote = (memberId, year, week, note) => workoutStore.saveWeeklyNote(memberId, year, week, note).then(() => this._scheduleSave('workoutStore', workoutStore.data));

    getLessonTemplates = () => workoutStore.getLessonTemplates();
    getLessonTemplateById = (id) => workoutStore.getLessonTemplateById(id);
    addLessonTemplate = (templateData) => workoutStore.addLessonTemplate(templateData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    updateLessonTemplate = (id, updatedData) => workoutStore.updateLessonTemplate(id, updatedData).then(res => (this._scheduleSave('workoutStore', workoutStore.data), res));
    deleteLessonTemplate = (id) => workoutStore.deleteLessonTemplate(id).then(() => this._scheduleSave('workoutStore', workoutStore.data));
    getScheduledLessons = () => workoutStore.data.scheduledLessons || [];

    /**
     * Generates scheduled lessons from templates for a given lookahead period.
     * This function is idempotent and will not create duplicate lessons.
     * @param {number} lookaheadWeeks - The number of weeks to generate lessons for.
     */
    generateScheduledLessons = async (lookaheadWeeks = 4) => {
        const templates = this.getLessonTemplates();
        if (!templates || templates.length === 0) {
            return; // No templates to schedule.
        }

        const scheduledLessons = this.getScheduledLessons();
        const existingLessons = new Set(
            scheduledLessons.map(l => `${l.templateId}-${l.date}`)
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let newLessonsAdded = 0;

        for (let i = 0; i < lookaheadWeeks * 7; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const dateString = currentDate.toISOString().split('T')[0];

            const templatesForDay = templates.filter(t => t.dayOfWeek == dayOfWeek);

            for (const template of templatesForDay) {
                // Find the current maximum ID to ensure the new ID is unique
                const maxId = Math.max(0, ...workoutStore.data.scheduledLessons.map(l => l.id || 0));

                const lessonKey = `${template.id}-${dateString}`;
                if (!existingLessons.has(lessonKey)) {
                    const newLesson = {
                        id: maxId + 1 + newLessonsAdded, // Robust unique ID
                        templateId: template.id,
                        date: dateString,
                        time: template.time,
                        attendees: []
                    };
                    workoutStore.data.scheduledLessons.push(newLesson);
                    newLessonsAdded++;
                }
            }
        }

        if (newLessonsAdded > 0) {
            console.log(`Generated ${newLessonsAdded} new scheduled lessons.`);
            await this._scheduleSave('workoutStore', workoutStore.data);
        }
    }

    getScheduledLessonById = (id) => (this.getScheduledLessons() || []).find(l => l.id == id);
    addAttendeeToLesson = async (lessonId, memberId) => {
        const lesson = this.getScheduledLessonById(lessonId);
        if (lesson && !lesson.attendees.includes(memberId)) {
            lesson.attendees.push(memberId);
            await this._scheduleSave('workoutStore', workoutStore.data);
            this.emitter.emit('calendarUpdated'); // Notify listeners that calendar data changed
        }
        return lesson;
    }
    removeAttendeeFromLesson = async (lessonId, memberId) => {
        const lesson = this.getScheduledLessonById(lessonId);
        if (lesson) {
            const index = lesson.attendees.indexOf(memberId);
            if (index > -1) {
                lesson.attendees.splice(index, 1);
                await this._scheduleSave('workoutStore', workoutStore.data);
                this.emitter.emit('calendarUpdated');
            }
        }
        return lesson;
    }

    getProducts = () => financialStore.getProducts();
    addProduct = (productData) => financialStore.addProduct(productData).then(res => (this._scheduleSave('financialStore', financialStore.data), res));
    updateProduct = (id, updatedData) => financialStore.updateProduct(id, updatedData).then(res => (this._scheduleSave('financialStore', financialStore.data), res));
    deleteProduct = (id) => financialStore.deleteProduct(id).then(() => this._scheduleSave('financialStore', financialStore.data));
    getSubscriptions = () => financialStore.getSubscriptions();
    addSubscription = (subscriptionData) => financialStore.addSubscription(subscriptionData).then(res => (this._scheduleSave('financialStore', financialStore.data), res));
    updateSubscription = (id, updatedData) => financialStore.updateSubscription(id, updatedData).then(res => (this._scheduleSave('financialStore', financialStore.data), res));
    deleteSubscription = (id) => financialStore.deleteSubscription(id).then(() => this._scheduleSave('financialStore', financialStore.data));
    getInvoices = () => financialStore.getInvoices();
    addInvoice = (invoiceData) => financialStore.addInvoice(invoiceData).then(res => (this._scheduleSave('financialStore', financialStore.data), res));
    updateInvoice = (id, updatedData) => financialStore.updateInvoice(id, updatedData).then(res => (this._scheduleSave('financialStore', financialStore.data), res));
    getExpenses = () => financialStore.data.expenses || [];
    getExpenseCategories = () => financialStore.data.expenseCategories || [];
    addExpense = (expenseData) => financialStore.addExpense(expenseData).then(res => (this._scheduleSave('financialStore', financialStore.data), this.emitter.emit('financialsChanged'), res));
    /**
     * Adds a new expense category.
     * NOTE: This logic would typically live in `financialStore.js`. It's implemented here
     * directly to resolve a dependency issue since the store file was not provided.
     * @param {object} categoryData - The data for the new category (e.g., { name: 'Utilities' }).
     * @returns {Promise<object>} The newly created category object with an ID.
     */
    addExpenseCategory = (categoryData) => {
        if (!financialStore.data.expenseCategories) financialStore.data.expenseCategories = [];
        const newId = (financialStore.data.expenseCategories.reduce((max, c) => Math.max(max, c.id), 0)) + 1;
        const newCategory = { ...categoryData, id: newId };
        financialStore.data.expenseCategories.push(newCategory);
        this._scheduleSave('financialStore', financialStore.data); // Persist the change
        return Promise.resolve(newCategory);
    }
    updateExpense = (id, updatedData) => financialStore.updateExpense(id, updatedData).then(res => (this._scheduleSave('financialStore', financialStore.data), this.emitter.emit('financialsChanged'), res));
    deleteExpense = (id) => financialStore.deleteExpense(id).then(() => (this._scheduleSave('financialStore', financialStore.data), this.emitter.emit('financialsChanged')));
    /**
     * Retrieves the invoice template. Currently supports one default template.
     * @param {string} [id='default'] - The ID of the template to retrieve.
     * @returns {object|null} The template data.
     */
    getInvoiceTemplate = (id = 'default') => {
        return financialStore.data.invoiceTemplates?.find(t => t.id === id) || null;
    }

    saveInvoiceTemplate = async (templateData) => {
        if (!financialStore.data.invoiceTemplates) {
            financialStore.data.invoiceTemplates = [];
        }
        const index = financialStore.data.invoiceTemplates.findIndex(t => t.id === templateData.id);
        if (index > -1) { financialStore.data.invoiceTemplates[index] = templateData; } else { financialStore.data.invoiceTemplates.push(templateData); }
        await this._scheduleSave('financialStore', financialStore.data);
        return templateData;
    }

    getRooms = () => gymStore.getRooms();
    getRoomById = (id) => gymStore.getRoomById(id);
    addRoom = (roomData) => gymStore.addRoom(roomData).then(res => (this._scheduleSave('gymStore', gymStore.data), res));
    updateRoom = (id, updatedData) => gymStore.updateRoom(id, updatedData).then(res => (this._scheduleSave('gymStore', gymStore.data), res));
    deleteRoom = (id) => gymStore.deleteRoom(id).then(() => this._scheduleSave('gymStore', gymStore.data));
    getCheckinsForMember = (memberId) => gymStore.getCheckinsForMember(memberId);
    addCheckin = (memberId) => gymStore.addCheckin(memberId).then(res => (this._scheduleSave('gymStore', gymStore.data), res));

    getMessagesForConversation = (userId1, userId2) => messagingStore.getMessagesForConversation(userId1, userId2);
    addMessage = (messageData) => messagingStore.addMessage(messageData).then(res => (this._scheduleSave('messagingStore', messagingStore.data), this.emitter.emit('newMessage', res), res));

    getFinancialSummary() {
        const invoices = this.getInvoices();
        const totalRevenue = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const expenses = this.getExpenses();
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const netProfit = totalRevenue - totalExpenses;
        return { totalRevenue: +totalRevenue.toFixed(2), totalExpenses: +totalExpenses.toFixed(2), netProfit: +netProfit.toFixed(2) };
    }

    getActiveMembersCount() {
        return this.getMembers().filter(m => m.status === 'Active').length;
    }

    getDetailedGymOccupancy() {
        const rooms = this.getRooms() || [];
        if (rooms.length === 0) {
            return { percentage: 0, roomDetails: [] };
        }
        const potentialOccupants = this.getMembers().filter(m => m.status === 'Active');
        let assignedOccupantsCount = 0;

        const roomDetails = rooms.map(room => ({
            ...room,
            occupants: [],
            status: 'Empty'
        }));

        potentialOccupants.forEach(member => {
            if (Math.random() > 0.7) { 
                const availableRooms = roomDetails.filter(r => r.occupants.length < r.capacity);
                if (availableRooms.length > 0) {
                    const roomIndex = Math.floor(Math.random() * availableRooms.length);
                    const targetRoom = availableRooms[roomIndex];
                    
                    const originalRoom = roomDetails.find(r => r.id === targetRoom.id);
                    if (originalRoom) {
                        originalRoom.occupants.push(member);
                        originalRoom.status = 'Busy';
                        assignedOccupantsCount++;
                    }
                }
            }
        });

        const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
        const percentage = totalCapacity > 0 ? Math.round((assignedOccupantsCount / totalCapacity) * 100) : 0;

        return {
            percentage: Math.min(100, percentage),
            roomDetails
        };
    }

    getAverageTrainerRating() {
        const ratings = workoutStore.data.trainerRatings || [];
        if (ratings.length === 0) return 'N/A';
        const total = ratings.reduce((sum, r) => sum + r.rating, 0);
        return (total / ratings.length).toFixed(1);
    }

    getTrainerRatingDetails() {
        const trainers = this.getEmployees().filter(e => e.role === 'Trainer');
        const ratings = workoutStore.data.trainerRatings || [];

        return trainers.map(trainer => {
            const trainerRatings = ratings.filter(r => r.trainerId === trainer.id);
            const ratingCount = trainerRatings.length;
            const averageRating = ratingCount > 0
                ? (trainerRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(1)
                : 'N/A';
            
            return {
                id: trainer.id,
                name: trainer.name,
                averageRating,
                ratingCount
            };
        }).sort((a, b) => (b.averageRating === 'N/A' ? -1 : a.averageRating === 'N/A' ? 1 : b.averageRating - a.averageRating));
    }

    getRatingsForTrainer(trainerId) {
        return (workoutStore.data.trainerRatings || []).filter(r => r.trainerId == trainerId);
    }
}

export default new DataStore();