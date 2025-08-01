/**
 * @class Emitter
 * @description A simple event emitter for handling custom events.
 */
class Emitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) {
            return;
        }
        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
}

/**
 * @class BluetoothService
 * @description A persistent, singleton service to manage the application's primary Bluetooth device connection.
 *              It handles connection state and notifies the application of changes.
 */
class BluetoothService {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristics = {}; // To store various characteristics like HR, etc.
        this.connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
        this.emitter = new Emitter();
        this.boundHrHandler = this._handleHeartRateMeasurement.bind(this);
    }

    /**
     * Subscribes a listener to a specific event.
     * @param {string} event - The event name (e.g., 'connectionStateChange', 'heartRateUpdate').
     * @param {Function} listener - The callback function.
     */
    on(event, listener) {
        this.emitter.on(event, listener);
    }

    /**
     * Unsubscribes a listener from a specific event.
     * @param {string} event - The event name.
     * @param {Function} listener - The callback function to remove.
     */
    off(event, listener) {
        this.emitter.off(event, listener);
    }

    /**
     * Updates the internal connection state and notifies listeners.
     * @param {string} newState - The new connection state.
     * @private
     */
    _setState(newState) {
        if (this.connectionState !== newState) {
            this.connectionState = newState;
            console.log(`Bluetooth state changed to: ${newState}`);
            this.emitter.emit('connectionStateChange', { state: newState, deviceName: this.device?.name || null });
        }
    }

    /**
     * Returns the current connection state.
     * @returns {string} The current state.
     */
    getState() {
        return this.connectionState;
    }

    /**
     * Returns the currently connected device.
     * @returns {BluetoothDevice|null}
     */
    getDevice() {
        return this.device;
    }

    /**
     * Scans for a device and attempts to connect. This will be the primary entry point.
     * This service manages a single, persistent connection.
     */
    async scanAndConnect() {
        if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
            console.log('A connection is already active or in progress.');
            return;
        }

        if (!navigator.bluetooth) {
            this._setState('error');
            this.emitter.emit('error', 'Web Bluetooth API is not available.');
            return;
        }

        try {
            this._setState('connecting');
            // In a real scenario, you might have more complex filters or allow choosing from a list.
            // For now, we request a device with a heart_rate service.
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service']
            });

            this.device.addEventListener('gattserverdisconnected', this._onDisconnect.bind(this));

            this.server = await this.device.gatt.connect();
            
            // Get Heart Rate service and characteristic
            const hrService = await this.server.getPrimaryService('heart_rate');
            const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
            await hrCharacteristic.startNotifications();
            hrCharacteristic.addEventListener('characteristicvaluechanged', this.boundHrHandler);
            this.characteristics.heartRate = hrCharacteristic;

            this._setState('connected');

        } catch (error) {
            console.error('Bluetooth connection failed:', error);
            this._setState('error');
            this.emitter.emit('error', error.message);
            this.device = null;
        }
    }

    /**
     * Manually disconnects from the current device.
     */
    async disconnect() {
        if (this.characteristics.heartRate) {
            try {
                await this.characteristics.heartRate.stopNotifications();
                this.characteristics.heartRate.removeEventListener('characteristicvaluechanged', this.boundHrHandler);
            } catch (error) { console.warn("Could not stop HR notifications, device might be already gone.", error); }
        }
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
    }

    /**
     * Handles the gattserverdisconnected event.
     * @private
     */
    _onDisconnect() {
        console.log('Device disconnected.');
        this.device = null;
        this.server = null;
        this.characteristics = {};
        this._setState('disconnected');
    }

    /**
     * Handles incoming heart rate measurement data and emits an event.
     * @param {Event} event
     * @private
     */
    _handleHeartRateMeasurement(event) {
        const value = event.target.value; // This is a DataView
        const flags = value.getUint8(0);
        const rate16Bits = (flags & 0x01) !== 0;
        const energyExpendedPresent = (flags & 0x08) !== 0;
        const rrIntervalPresent = (flags & 0x10) !== 0;

        let byteOffset = 1;

        // 1. Parse Heart Rate
        let heartRate;
        if (rate16Bits) {
            heartRate = value.getUint16(byteOffset, true); // true for little-endian
            byteOffset += 2;
        } else {
            heartRate = value.getUint8(byteOffset);
            byteOffset += 1;
        }
        this.emitter.emit('heartRateUpdate', heartRate);

        // 2. Skip Energy Expended if present
        if (energyExpendedPresent) {
            byteOffset += 2;
        }

        // 3. Parse RR-Intervals if present
        if (rrIntervalPresent) {
            const rrIntervals = [];
            while (byteOffset < value.byteLength) {
                const rrValue = value.getUint16(byteOffset, true); // RR is always UINT16
                rrIntervals.push((rrValue / 1024) * 1000); // Convert from 1/1024s to ms
                byteOffset += 2;
            }
            if (rrIntervals.length > 0) {
                this.emitter.emit('rrIntervalUpdate', rrIntervals);
            }
        }
    }
}

// Export a singleton instance so the entire app shares one connection manager.
export default new BluetoothService();