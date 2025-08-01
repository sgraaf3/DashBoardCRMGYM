

export const employeeStore = {
    data: {
        employees: [],
    },

    init() {
        
    },

    getEmployees() {
        return this.data.employees || [];
    },

    getEmployeeById(id) {
        return this.data.employees.find(e => e.id == id);
    },

    async addEmployee(employeeData) {
        const newId = (this.data.employees[this.data.employees.length - 1]?.id || 300) + 1;
        const newEmployee = { ...employeeData, id: newId };
        this.data.employees.push(newEmployee);
        return newEmployee;
    },

    async updateEmployee(id, updatedData) {
        const employeeIndex = this.data.employees.findIndex(e => e.id == id);
        if (employeeIndex === -1) return null;
        this.data.employees[employeeIndex] = { ...this.data.employees[employeeIndex], ...updatedData };
        return this.data.employees[employeeIndex];
    },

    async deleteEmployee(id) {
        this.data.employees = this.data.employees.filter(e => e.id != id);
    },
};