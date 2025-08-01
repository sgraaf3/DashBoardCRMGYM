

export const memberStore = {
    data: {
        members: [
            {
                id: 1,
                name: 'Alice Smith',
                email: 'alice.smith@example.com',
                joinDate: '2025-01-15', // ~6 months ago
                dob: '1992-03-10',
                gender: 'Female',
                phone: '+1-555-100-0001',
                address: '101 Pine St, Cityville',
                status: 'Active',
                subscription: { status: 'Active', renewalDate: '2026-01-15', plan: 'Premium' },
                biometrics: { heightCm: 165.2, weightKg: 60.5, bodyFatPercentage: 22.1, muscleMassPercentage: 35.8, restingHeartRate: 68, bloodPressure: '110/70', vo2Max: 38.5 },
            },
            {
                id: 2,
                name: 'Bob Johnson',
                email: 'bob.johnson@example.com',
                joinDate: '2025-04-10', // ~3 months ago
                dob: '1988-11-25',
                gender: 'Male',
                phone: '+1-555-100-0002',
                address: '202 Oak Ave, Townsville',
                status: 'Active',
                subscription: { status: 'Active', renewalDate: '2025-10-10', plan: 'Standard' },
                biometrics: { heightCm: 180.1, weightKg: 85.3, bodyFatPercentage: 18.5, muscleMassPercentage: 42.3, restingHeartRate: 58, bloodPressure: '130/85', vo2Max: 48.2 },
            },
            {
                id: 3,
                name: 'Charlie Brown',
                email: 'charlie.brown@example.com',
                joinDate: '2024-12-01', // ~7 months ago
                dob: '1995-07-01',
                gender: 'Male',
                phone: '+1-555-100-0003',
                address: '303 Elm Rd, Villageton',
                status: 'Active',
                subscription: { status: 'Active', renewalDate: '2025-12-01', plan: 'Premium' },
                biometrics: { heightCm: 170.0, weightKg: 72.0, bodyFatPercentage: 16.0, muscleMassPercentage: 41.0, restingHeartRate: 62, bloodPressure: '125/75', vo2Max: 42.0 },
            },
            {
                id: 4,
                name: 'Diana Prince',
                email: 'diana.prince@example.com',
                joinDate: '2025-05-20', // ~2 months ago
                dob: '1998-01-01',
                gender: 'Female',
                phone: '+1-555-100-0004',
                address: '404 Maple Ln, Hamletburg',
                status: 'Active',
                subscription: { status: 'Active', renewalDate: '2025-11-20', plan: 'Basic' },
                biometrics: { heightCm: 170.0, weightKg: 65.0, bodyFatPercentage: 20.0, muscleMassPercentage: 38.0, restingHeartRate: 70, bloodPressure: '115/70', vo2Max: 35.0 },
            },
            {
                id: 5,
                name: 'Eve Adams',
                email: 'eve.adams@example.com',
                joinDate: '2024-10-01', // ~9 months ago
                dob: '1985-09-15',
                gender: 'Female',
                phone: '+1-555-100-0005',
                address: '505 Birch Blvd, Countryside',
                status: 'Active',
                subscription: { status: 'Active', renewalDate: '2025-10-01', plan: 'Premium' },
                biometrics: { heightCm: 160.0, weightKg: 58.0, bodyFatPercentage: 25.0, muscleMassPercentage: 33.0, restingHeartRate: 75, bloodPressure: '128/82', vo2Max: 32.0 },
            },
        ],
    },

    init(subscriptions) {
        console.log("memberStore.init - this.data.members after population:", this.data.members);
    },

    getMembers() {
        return this.data.members || [];
    },

    getMemberById(id) {
        return this.data.members.find(m => m.id == id);
    },

    async addMember(memberData) {
        const newId = (this.data.members[this.data.members.length - 1]?.id || 100) + 1;
        const newMember = { ...memberData, id: newId, joinDate: new Date().toISOString().split('T')[0],
            subscription: {
                status: 'Active',
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                plan: 'Monthly'
            } };
        this.data.members.push(newMember);
        return newMember;
    },

    async updateMember(id, updatedData) {
        const memberIndex = this.data.members.findIndex(m => m.id == id);
        if (memberIndex === -1) return null;
        this.data.members[memberIndex] = { ...this.data.members[memberIndex], ...updatedData };
        return this.data.members[memberIndex];
    },

    async updateMemberSubscription(memberId, subscriptionData) {
        const memberIndex = this.data.members.findIndex(m => m.id == memberId);
        if (memberIndex === -1) return null;

        const currentMember = this.data.members[memberIndex];
        
        const updatedSubscription = {
            ...currentMember.subscription,
            ...subscriptionData
        };

        currentMember.subscription = updatedSubscription;
        
        return currentMember;
    },

    async deleteMember(id) {
        this.data.members = this.data.members.filter(m => m.id != id);
    },
};