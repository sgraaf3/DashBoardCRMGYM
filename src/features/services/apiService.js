// --- MOCK API SERVICE ---
// This simulates fetching data from a backend. In a real app, this would use `fetch`.

let membersData = [];
let savedPlans = {};
let initialMembersData = [
    { id: 'm1', name: 'John Doe', email: 'john.doe@example.com', status: 'Active', joinDate: '2023-01-15' },
    { id: 'm2', name: 'Jane Smith', email: 'jane.smith@example.com', status: 'Active', joinDate: '2023-03-22' },
    { id: 'm3', name: 'Mike Johnson', email: 'mike.j@example.com', status: 'Inactive', joinDate: '2022-11-01' },
    { id: 'm4', name: 'Sarah Connor', email: 'sarah.c@skynet.com', status: 'Active', joinDate: '2023-04-10' },
    { id: 'm5', name: 'Kyle Reese', email: 'k.reese@tech-com.net', status: 'Active', joinDate: '2023-02-05' },
    { id: 'm6', name: 'Peter Venkman', email: 'p.venkman@ghostbusters.org', status: 'Inactive', joinDate: '2021-10-31' },
];

export const apiService = {
    getMembers: async () => {
        console.log("API: Fetching members...");
        if (membersData.length === 0) membersData = [...initialMembersData]; // Populate on first call
        return new Promise(resolve => setTimeout(() => resolve([...membersData]), 500));
    },
    addMember: async (member) => {
        console.log("API: Adding member...", member);
        member.id = `m${new Date().getTime()}`; // Generate a unique ID
        member.joinDate = new Date().toISOString().slice(0, 10);
        membersData.unshift(member);
        return new Promise(resolve => setTimeout(() => resolve(member), 500));
    },
    updateMember: async (id, memberUpdate) => {
        console.log(`API: Updating member with id ${id}...`, memberUpdate);
        const memberIndex = membersData.findIndex(m => m.id === id);
        if (memberIndex === -1) throw new Error("Member not found");
        membersData[memberIndex] = { ...membersData[memberIndex], ...memberUpdate };
        return new Promise(resolve => setTimeout(() => resolve(membersData[memberIndex]), 500));
    },
    deleteMember: async (id) => {
        console.log(`API: Deleting member with id ${id}...`);
        const memberIndex = membersData.findIndex(m => m.id === id);
        if (memberIndex > -1) {
            const member = membersData.splice(memberIndex, 1);
            return new Promise(resolve => setTimeout(() => resolve(member[0]), 500));
        }
        throw new Error("Member not found for deletion");
    },
    getWorkoutPlans: async () => {
        console.log("API: Fetching workout plans...");
        return new Promise(resolve => setTimeout(() => resolve(savedPlans), 500));
    },
    saveWorkoutPlan: async (planName, planData) => {
        console.log(`API: Saving plan ${planName}...`);
        savedPlans[planName] = planData;
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 500));
    },
    deleteWorkoutPlan: async (planName) => {
        console.log(`API: Deleting plan ${planName}...`);
        delete savedPlans[planName];
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 500));
    }
};