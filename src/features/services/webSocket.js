/**
 * @file webSocket.js
 * @description Provides a module for managing WebSocket connections.
 * This module allows for connecting, sending messages, and handling
 * incoming messages and connection status.
 */

class WebSocketManager {
  /**
   * Constructs a new WebSocketManager instance.
   * @param {string} url - The WebSocket server URL to connect to.
   */
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map(); // Stores event listeners for different message types
    console.log(`WebSocketManager initialized for URL: ${this.url}`);
  }

  /**
   * Connects to the WebSocket server.
   * Sets up event listeners for open, message, close, and error events.
   */
  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn("WebSocket is already connected.");
      return;
    }

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.isConnected = true;
      console.log("WebSocket connected successfully.");
      // You might want to emit a global 'websocket-connected' event here
      // if you have an EventEmitter in your application.
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const message = JSON.parse(event.data);
        // Assuming messages are objects with a 'type' property
        if (message.type) {
          this.emit(message.type, message.payload);
        } else {
          // Handle messages without a specific type, or a default type
          this.emit('message', message);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message as JSON:", e, event.data);
        this.emit('raw-message', event.data); // Emit raw message if parsing fails
      }
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      console.warn(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);
      // Attempt to reconnect after a delay, or handle gracefully
      this.emit('disconnected', event);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit('error', error);
      // The 'onclose' event will usually follow an 'onerror' event.
    };
  }

  /**
   * Disconnects from the WebSocket server.
   */
  disconnect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
      console.log("WebSocket connection closed.");
    } else {
      console.warn("WebSocket is not connected or already closing/closed.");
    }
  }

  /**
   * Sends a message over the WebSocket connection.
   * The message is stringified if it's an object.
   * @param {any} message - The message to send. Can be a string or a serializable object.
   */
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const dataToSend = typeof message === 'object' ? JSON.stringify(message) : message;
      this.socket.send(dataToSend);
      console.log("WebSocket message sent:", dataToSend);
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
      // You might queue messages here for sending once connected
    }
  }

  /**
   * Adds an event listener for a specific WebSocket message type.
   * @param {string} eventType - The type of message to listen for (e.g., 'chatMessage', 'update', 'connected').
   * @param {function} handler - The callback function to execute when the event occurs.
   */
  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
    console.log(`Added handler for event type: ${eventType}`);
  }

  /**
   * Removes an event listener for a specific WebSocket message type.
   * @param {string} eventType - The type of message.
   * @param {function} handler - The handler function to remove.
   */
  off(eventType, handler) {
    if (this.messageHandlers.has(eventType)) {
      const handlers = this.messageHandlers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`Removed handler for event type: ${eventType}`);
      }
    }
  }

  /**
   * Emits an event to all registered handlers for that event type.
   * @param {string} eventType - The type of event to emit.
   * @param {any} [data] - Optional data to pass to the handlers.
   * @private
   */
  emit(eventType, data) {
    if (this.messageHandlers.has(eventType)) {
      this.messageHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in WebSocket event handler for '${eventType}':`, e);
        }
      });
    }
  }

  /**
   * Checks if the WebSocket is currently connected.
   * @returns {boolean} True if connected, false otherwise.
   */
  getIsConnected() {
    return this.isConnected;
  }
}

/**
 * Exports a singleton instance of the WebSocketManager.
 * This ensures that only one WebSocket connection is managed across the application.
 * You can get this instance by importing `webSocketManager` from this module.
 */
const webSocketManager = new WebSocketManager("ws://localhost:8080"); // Replace with your actual WebSocket server URL

export default initWebSockets;
