export const messagingStore = {
    data: {
        messages: [],
    },

    init() {
        this.data.messages = [];
    },

    getMessagesForConversation(userId1, userId2) {
        return (this.data.messages || [])
            .filter(m =>
                (m.fromUserId == userId1 && m.toUserId == userId2) ||
                (m.fromUserId == userId2 && m.toUserId == userId1)
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },

    async addMessage(messageData) {
        const newId = (this.data.messages[this.data.messages.length - 1]?.id || 500) + 1;
        const newMessage = { ...messageData, id: newId, timestamp: new Date().toISOString() };
        this.data.messages.push(newMessage);
        return newMessage;
    },
};