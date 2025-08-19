import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
  }

  connect(url = 'ws://localhost:8084/ws') {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL: url,
        connectHeaders: {},
        debug: (str) => {
          console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log('Connected: ' + frame);
        this.connected = true;
        
        // Subscribe to inventory updates
        this.subscribe('/topic/inventory', this.handleInventoryUpdate.bind(this));
        
        // Subscribe to notifications
        this.subscribe('/topic/notifications', this.handleNotification.bind(this));
        
        resolve(frame);
      };

      this.client.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        this.connected = false;
        reject(frame);
      };

      this.client.onWebSocketClose = (event) => {
        console.log('WebSocket connection closed', event);
        this.connected = false;
      };

      this.client.onDisconnect = () => {
        console.log('STOMP connection disconnected');
        this.connected = false;
      };

      this.client.activate();
    });
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions.clear();
      this.messageHandlers.clear();
    }
  }

  subscribe(destination, handler) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        handler(data);
      } catch (error) {
        console.error('Error parsing message:', error);
        handler(message.body);
      }
    });

    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  publish(destination, body, headers = {}) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: destination,
      body: JSON.stringify(body),
      headers: headers
    });
  }

  // Message handlers
  handleInventoryUpdate(message) {
    console.log('Inventory update received:', message);
    
    // Dispatch custom event for inventory updates
    const event = new CustomEvent('inventoryUpdate', {
      detail: message
    });
    window.dispatchEvent(event);

    // Call registered handlers
    const handlers = this.messageHandlers.get('inventory') || [];
    handlers.forEach(handler => handler(message));
  }

  handleNotification(message) {
    console.log('Notification received:', message);
    
    // Dispatch custom event for notifications
    const event = new CustomEvent('newNotification', {
      detail: message
    });
    window.dispatchEvent(event);

    // Call registered handlers
    const handlers = this.messageHandlers.get('notifications') || [];
    handlers.forEach(handler => handler(message));
  }

  // Register message handlers
  onInventoryUpdate(handler) {
    this.addMessageHandler('inventory', handler);
  }

  onNotification(handler) {
    this.addMessageHandler('notifications', handler);
  }

  addMessageHandler(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  removeMessageHandler(type, handler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Utility methods
  isConnected() {
    return this.connected;
  }

  getConnectionState() {
    if (!this.client) return 'DISCONNECTED';
    return this.client.state;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;