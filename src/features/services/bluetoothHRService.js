/**
 * @class BluetoothHRService
 * @description Handles Bluetooth Low Energy (BLE) communication for Heart Rate Monitors (HRM).
 *              Provides methods to scan, connect, and receive heart rate data.
 */
class BluetoothHRService {
    constructor() {
        this.device = null;
        this.server = null;
        this.heartRateCharacteristic = null;
        this.onHeartRateChangeCallback = null;
        this.isScanning = false;
    }

    /**
     * Starts scanning for Bluetooth Heart Rate devices.
     * @param {Function} onDeviceFound Callback function when a device is found.
     * @returns {Promise<void>}
     */
    async scanForDevices(onDeviceFound) {
        if (!navigator.bluetooth) {
            console.error('Web Bluetooth API is not available in this browser.');
            alert('Web Bluetooth API is not available in this browser. Please use a browser that supports it (e.g., Chrome, Edge).');
            return;
        }

        if (this.isScanning) {
            console.log('Already scanning for devices.');
            return;
        }

        this.isScanning = true;

        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service'] // Optional: to get battery level
            });

            this.isScanning = false;
            if (onDeviceFound) {
                onDeviceFound(this.device);
            }
        } catch (error) {
            this.isScanning = false;
            console.error('Error during device scan:', error);
            if (error.name === 'NotFoundError') {
                console.log('No device selected or found.');
            } else {
                alert(`Error scanning for devices: ${error.message}`);
            }
        }
    }

    /**
     * Connects to the selected Bluetooth device and starts receiving heart rate data.
     * @param {Function} onHeartRateChange Callback function for heart rate updates.
     * @returns {Promise<boolean>} True if connection was successful, false otherwise.
     */
    async connect(onHeartRateChange) {
        if (!this.device) {
            console.error('No device selected. Call scanForDevices first.');
            return false;
        }

        if (this.device.gatt.connected) {
            console.log('Already connected to device.');
            return true;
        }

        this.onHeartRateChangeCallback = onHeartRateChange;

        try {
            this.server = await this.device.gatt.connect();
            const service = await this.server.getPrimaryService('heart_rate');
            this.heartRateCharacteristic = await service.getCharacteristic('heart_rate_measurement');

            await this.heartRateCharacteristic.startNotifications();
            this.heartRateCharacteristic.addEventListener('characteristicvaluechanged', this._handleHeartRateMeasurement.bind(this));

            // Optional: Get battery level
            try {
                const batteryService = await this.server.getPrimaryService('battery_service');
                const batteryLevelCharacteristic = await batteryService.getCharacteristic('battery_level');
                const batteryLevel = await batteryLevelCharacteristic.readValue();
            } catch (error) {
                console.warn('Could not get battery service or characteristic:', error);
            }

            return true;
        } catch (error) {
            console.error('Error during connection or characteristic setup:', error);
            alert(`Error connecting to device: ${error.message}`);
            this.disconnect();
            return false;
        }
    }

    /**
     * Disconnects from the Bluetooth device.
     */
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            console.log('Disconnected from device.');
        }
        if (this.heartRateCharacteristic) {
            this.heartRateCharacteristic.removeEventListener('characteristicvaluechanged', this._handleHeartRateMeasurement.bind(this));
            this.heartRateCharacteristic = null;
        }
        this.device = null;
        this.server = null;
        this.onHeartRateChangeCallback = null;
    }

    /**
     * Handles incoming heart rate measurement data.
     * @param {Event} event
     */
    _handleHeartRateMeasurement(event) {
        const value = event.target.value;
        // Heart Rate Measurement Format: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.heart_rate_measurement.xml
        // Byte 0: Flags
        // Bit 0: Heart Rate Value Format (0 = UINT8, 1 = UINT16)
        // Bit 1,2: Sensor Contact Status
        // Bit 3: Energy Expended Status
        // Bit 4: RR-Interval Status

        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x01; // Check if heart rate value is UINT16

        let heartRate;
        if (rate16Bits) {
            heartRate = value.getUint16(1, true); // UINT16, little-endian
        } else {
            heartRate = value.getUint8(1); // UINT8
        }

        // For simplicity, we're only extracting heart rate.
        // More complex parsing would be needed for RR-Intervals, Energy Expended, etc.

        if (this.onHeartRateChangeCallback) {
            this.onHeartRateChangeCallback(heartRate);
        }
    }
}

export default new BluetoothHRService(); // Export a singleton instance
