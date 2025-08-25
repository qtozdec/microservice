import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(userId) {
    if (this.connected) {
      return Promise.resolve();
    }
    return Promise.resolve(); // Temporarily disable WebSocket connections

    return new Promise((resolve, reject) => {
      // Create STOMP client with SockJS
      this.client = new Client({
        webSocketFactory: () => {
          const token = localStorage.getItem('token');
          const wsUrl = token 
            ? `${window.location.origin}/ws?token=${encodeURIComponent(token)}`
            : `${window.location.origin}/ws`;
          return new SockJS(wsUrl);
        },
        connectHeaders: {
          userId: userId?.toString() || '',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        debug: () => {}, // Debug disabled
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Show connection toast
        toast.success('🔔 Real-time notifications connected', {
          duration: 3000,
          position: 'top-right',
        });

        // Subscribe to user-specific notifications
        if (userId) {
          this.subscribeToUserNotifications(userId);
        }

        // Subscribe to global notifications
        this.subscribeToGlobalNotifications();
        
        // Subscribe to inventory updates (backward compatibility)
        this.subscribe('/topic/inventory', this.handleInventoryUpdate.bind(this));

        // Send subscription message
        this.client.publish({
          destination: '/app/subscribe',
          body: JSON.stringify({ userId })
        });
        
        resolve(frame);
      };

      this.client.onStompError = (frame) => {
        console.error('WebSocket: STOMP Error', frame);
        this.connected = false;
        
        toast.error('🔌 Connection error occurred', {
          duration: 4000,
          position: 'top-right',
        });
        
        reject(frame);
      };

      this.client.onWebSocketError = (error) => {
        console.error('WebSocket: Error', error);
        this.connected = false;
      };

      this.client.onDisconnect = () => {
        this.connected = false;
        this.subscriptions.clear();
        
        // Only show disconnect toast if not intentionally disconnected
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          toast.error('🔌 Connection lost, attempting to reconnect...', {
            duration: 3000,
            position: 'top-right',
          });
        }
      };

      this.client.activate();
    });
  }

  disconnect() {
    if (this.client) {
      this.connected = false;
      this.subscriptions.clear();
      this.messageHandlers.clear();
      this.client.deactivate();
      
      toast('🔌 Disconnected from real-time notifications', {
        duration: 2000,
        position: 'top-right',
      });
    }
  }

  subscribeToUserNotifications(userId) {
    const destination = `/user/${userId}/queue/notifications`;
    
    if (this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      const notification = JSON.parse(message.body);
      this.handleNotification(notification);
    });

    this.subscriptions.set(destination, subscription);
  }

  subscribeToGlobalNotifications() {
    const destination = '/topic/notifications';
    
    if (this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      const notification = JSON.parse(message.body);
      this.handleNotification(notification);
    });

    this.subscriptions.set(destination, subscription);
  }

  subscribe(destination, handler) {
    if (!this.client || !this.connected) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        handler(data);
      } catch (error) {
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
    
    // Dispatch custom event for inventory updates
    const event = new CustomEvent('inventoryUpdate', {
      detail: message
    });
    window.dispatchEvent(event);

    // Call registered handlers
    const handlers = this.messageHandlers.get('inventory') || [];
    handlers.forEach(handler => handler(message));
  }

  handleNotification(notification) {
    
    // Play sound for important notifications
    if (notification.type === 'error' || notification.type === 'warning') {
      this.playNotificationSound();
    }

    // Show toast notification
    const toastOptions = {
      duration: 5000,
      position: 'top-right',
      style: {
        background: this.getToastColor(notification.type),
        color: 'white',
      },
    };

    const icon = this.getNotificationIcon(notification.type);
    const message = `${icon} ${notification.title}: ${notification.message}`;

    switch (notification.type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, { ...toastOptions, duration: 8000 });
        break;
      case 'warning':
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
      case 'info':
      default:
        toast(message, { ...toastOptions, icon: 'ℹ️' });
        break;
    }

    // Store notification for notification center
    this.storeNotification(notification);

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
    
    // Dispatch custom event for notifications (backward compatibility)
    const event = new CustomEvent('newNotification', {
      detail: notification
    });
    window.dispatchEvent(event);

    // Call registered handlers
    const handlers = this.messageHandlers.get('notifications') || [];
    handlers.forEach(handler => handler(notification));
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

  // Utility methods for notifications
  getNotificationIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  }

  getToastColor(type) {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  playNotificationSound() {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Sound failed silently
    }
  }

  storeNotification(notification) {
    try {
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const newNotification = {
        ...notification,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false
      };
      
      storedNotifications.unshift(newNotification);
      
      // Keep only last 50 notifications
      if (storedNotifications.length > 50) {
        storedNotifications.splice(50);
      }
      
      localStorage.setItem('notifications', JSON.stringify(storedNotifications));
      
      // Dispatch custom event for notification center
      window.dispatchEvent(new CustomEvent('notificationStored', { 
        detail: newNotification 
      }));
    } catch (error) {
      // Storage failed silently
    }
  }

  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.type,
        });
      } catch (error) {
        // Browser notification failed silently
      }
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('🔔 Browser notifications enabled', {
            duration: 3000,
            position: 'top-right',
          });
        }
      });
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