

export const financialStore = {
    data: {
        products: [],
        subscriptions: [],
        invoices: [],
        expenses: [],
        expenseCategories: [],
    },

    init(members) {
        console.log("financialStore.init - received members:", members);
        
    },

    getProducts() {
        return this.data.products || [];
    },

    async addProduct(productData) {
        const newId = (this.data.products[this.data.products.length - 1]?.id || 1) + 1;
        const newProduct = { ...productData, id: newId };
        this.data.products.push(newProduct);
        return newProduct;
    },

    async updateProduct(id, updatedData) {
        const productIndex = this.data.products.findIndex(p => p.id == id);
        if (productIndex === -1) return null;
        this.data.products[productIndex] = { ...this.data.products[productIndex], ...updatedData };
        return this.data.products[productIndex];
    },

    async deleteProduct(id) {
        this.data.products = this.data.products.filter(p => p.id != id);
    },

    getSubscriptions() {
        return this.data.subscriptions || [];
    },

    async addSubscription(subscriptionData) {
        const newId = (this.data.subscriptions[this.data.subscriptions.length - 1]?.id || 1) + 1;
        const newSubscription = { ...subscriptionData, id: newId };
        this.data.subscriptions.push(newSubscription);
        return newSubscription;
    },

    async updateSubscription(id, updatedData) {
        const subIndex = this.data.subscriptions.findIndex(s => s.id == id);
        if (subIndex === -1) return null;
        this.data.subscriptions[subIndex] = { ...this.data.subscriptions[subIndex], ...updatedData };
        return this.data.subscriptions[subIndex];
    },

    async deleteSubscription(id) {
        this.data.subscriptions = this.data.subscriptions.filter(s => s.id != id);
    },

    getInvoices() {
        return this.data.invoices || [];
    },

    async addInvoice(invoiceData) {
        const newId = (this.data.invoices[this.data.invoices.length - 1]?.id || 1000) + 1;
        const newInvoice = { ...invoiceData, id: newId, createdDate: new Date().toISOString().split('T')[0] };
        this.data.invoices.push(newInvoice);
        return newInvoice;
    },

    async updateInvoice(id, updatedData) {
        const invoiceIndex = this.data.invoices.findIndex(inv => inv.id == id);
        if (invoiceIndex === -1) return null;
        this.data.invoices[invoiceIndex] = { ...this.data.invoices[invoiceIndex], ...updatedData };
        return this.data.invoices[invoiceIndex];
    },

    getExpenses() {
        return this.data.expenses || [];
    },

    getExpenseCategories() {
        return this.data.expenseCategories || [];
    },

    async addExpense(expenseData) {
        const newId = (this.data.expenses[this.data.expenses.length - 1]?.id || 2000) + 1;
        const newExpense = { ...expenseData, id: newId };
        this.data.expenses.push(newExpense);
        return newExpense;
    },

    async updateExpense(id, updatedData) {
        const expenseIndex = this.data.expenses.findIndex(e => e.id == id);
        if (expenseIndex === -1) return null;
        this.data.expenses[expenseIndex] = { ...this.data.expenses[expenseIndex], ...updatedData };
        return this.data.expenses[expenseIndex];
    },

    async deleteExpense(id) {
        this.data.expenses = this.data.expenses.filter(e => e.id != id);
    },
};