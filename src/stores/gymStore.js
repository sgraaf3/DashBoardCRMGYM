

export const gymStore = {
    data: {
        rooms: [],
        checkins: [],
    },

    init() {
        
    },

    getRooms() {
        return this.data.rooms || [];
    },

    getCheckinsForMember(memberId) {
        return this.data.checkins.filter(c => c.memberId == memberId);
    },

    async addCheckin(memberId) {
        const newId = (this.data.checkins[this.data.checkins.length - 1]?.id || 400) + 1;
        const newCheckin = { id: newId, memberId: memberId, date: new Date().toISOString() };
        this.data.checkins.push(newCheckin);
        return newCheckin;
    },
};