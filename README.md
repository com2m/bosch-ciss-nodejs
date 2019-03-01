# Bosch CISS NodeJS

This project contains two subprojects which can be used to access the Bosch CISS via USB and Bluetooth LE, respectively.

To access the device you have to import the appropriate classes from either `bosch-ciss-usb` or `bosch-ciss-ble`.
Subsequently you have to instantiate an object by passing the device path (in case of USB) or the bluetooth address (in case of BLE) to the constructor.

Afterwards you're able to receive new measured values from the device by using the RxJS subject as shown in the following snippet, which will log the measurements.

```typescript
// Connection via USB:
const boschCiss = new BoschCiss('tty.usbmodem000000');
boschCiss.subject.subscribe(console.log);

// Connection via BLE:
const boschCiss = new BoschCiss('00:00:00:00:00:00');
ciss.subject.subscribe(console.log);
```