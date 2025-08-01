

/**
 * @class messagingView
 * @description View for internal messaging between users.
 */
class messagingView {
    constructor(dataStore, app) {
        this.dataStore = dataStore;
        this.app = app;
        this.selectedUserId = null;
    }

    /**
     * Renders the messaging view.
     * @param {HTMLElement} parentElement - The element to render the view into.
     */
    render(parentElement) {
        const currentUser = this.app.getCurrentUser();
        if (!currentUser) {
            parentElement.innerHTML = `<p>Please log in to use messaging.</p>`;
            return;
        }

        // For now, we list all other users as potential conversations.
        const otherUsers = this.dataStore.getUsers().filter(user => user.id !== currentUser.id);

        parentElement.innerHTML = `
            <div class="messaging-container">
                <h2>Messaging</h2>
                <div class="messaging-layout">
                    <div class="conversation-list">
                        ${otherUsers.map(user => this.renderConversationItem(user, this.selectedUserId)).join('')}
                    </div>
                    <div class="chat-window" id="chat-window">
                        <!-- Chat content will be rendered here -->
                    </div>
                </div>
            </div>
        `;

        if (this.selectedUserId) {
            this.renderChatWindow(this.selectedUserId);
        } else {
            document.getElementById('chat-window').innerHTML = '<p>Select a conversation to start chatting.</p>';
        }

        this.addEventListeners();
    }

    renderConversationItem(user, selectedUserId) {
        const isActive = user.id == selectedUserId ? 'active' : '';
        return `
            <div class="conversation-list-item ${isActive}" data-user-id="${user.id}">
                <i class="fas fa-user-circle"></i>
                <span>${user.name}</span>
            </div>
        `;
    }

    addEventListeners() {
        const conversationItems = document.querySelectorAll('.conversation-list-item');
        conversationItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleConversationClick(e.currentTarget);
            });
        });

        const chatForm = document.getElementById('chat-input-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSendMessage();
            });
        }
    }

    handleConversationClick(element) {
        this.selectedUserId = element.dataset.userId;
        // Re-render the whole view to update the active state and chat window
        this.render(document.getElementById('main-content'));
    }

    renderChatWindow(selectedUserId) {
        const chatWindow = document.getElementById('chat-window');
        const currentUser = this.app.getCurrentUser();
        const messages = this.dataStore.getMessagesForConversation(currentUser.id, selectedUserId);

        const messageBubbles = messages.map(msg => {
            const isSent = msg.fromUserId == currentUser.id;
            const bubbleClass = isSent ? 'sent' : 'received';
            const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="message-bubble ${bubbleClass}">
                    <div>${msg.content}</div>
                    <div class="message-timestamp">${formattedTime}</div>
                </div>
            `;
        }).join('');

        chatWindow.innerHTML = `
            <div class="chat-messages" id="chat-messages">
                ${messageBubbles}
            </div>
            <form class="chat-input-form" id="chat-input-form">
                <input type="text" id="message-input" class="form-input" placeholder="Type a message..." autocomplete="off">
                <button type="submit" class="button-primary"><i class="fas fa-paper-plane"></i></button>
            </form>
        `;

        // Scroll to the bottom of the messages
        const chatMessagesContainer = document.getElementById('chat-messages');
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    handleSendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        if (!content || !this.selectedUserId) return;

        const currentUser = this.app.getCurrentUser();
        const messageData = {
            fromUserId: currentUser.id,
            toUserId: parseInt(this.selectedUserId),
            content: content
        };

        this.dataStore.addMessage(messageData);
        input.value = '';
        this.renderChatWindow(this.selectedUserId); // Re-render chat
        input.focus();
    }
}

export default messagingView;