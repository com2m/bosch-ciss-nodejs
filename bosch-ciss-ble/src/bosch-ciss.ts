import { Characteristic, Descriptor, Peripheral, Service } from 'noble';
import noble from 'noble';
import { Subject } from 'rxjs';
import { EnvironmentalData } from './model/environmental-data';
import { InertialData } from './model/inertial-data';

export class BoschCiss {
	public subject: Subject<EnvironmentalData | InertialData> = new Subject<EnvironmentalData | InertialData>();

	private noble = noble;
	private connectedDevices: Peripheral[] = [];

	constructor(private address: string) {
		process.stdin.resume();
		process.on('SIGINT', this.exitHandler.bind(this));

		this.start();
	}

	private async exitHandler() {
		await this.disconnectAllDevices();
		process.exit();
	}

	private async waitForPoweredOn(): Promise<void> {
		return new Promise<void>((resolve) =>
			this.noble.on('stateChange', (state: string) => {
				if (state === 'poweredOn') {
					resolve();
				}
			}));
	}

	private async disconnectAllDevices(): Promise<void> {
		this.connectedDevices.forEach(async (peripheral: Peripheral) => {
			console.log('Disconnecting from ' + peripheral.address + '.');
			await peripheral.disconnect();
			console.log('Sucessfully disconnected from ' + peripheral.address + '.');
		});
	}

	private async start() {
		console.log('Waiting for BLE adapter to change state to "poweredOn".');
		await this.waitForPoweredOn();
		console.log('BLE adapter is powered on.');
		console.log('Start scanning...');

		this.noble.startScanning([], true, (error: Error | undefined) => {
			if (error) {
				console.log(error);
			}
		});

		console.log('Looking for peripheral with address ' + this.address + '.');
		const peripheral: Peripheral = await this.getPeripheral(this.address);
		console.log('Found device.');
		console.log('Connecting to device...');
		await this.connect(peripheral);
		console.log('Successfully connected to device.');
		console.log('Discovering services and characteristics...');
		const serviceCharacteristicsDiscoveryResult: { services: Service[]; characteristics: Characteristic[]; } = await this.discoverServicesAndCharacteristics(peripheral);
		const services: Service[] = serviceCharacteristicsDiscoveryResult.services;
		const characteristics: Characteristic[] = serviceCharacteristicsDiscoveryResult.characteristics;
		console.log('Service and characteristic discovery completed.');
		console.log('Discover descriptors...');

		const deviceInformationService: Service = services.find((service: Service) => service.uuid.startsWith('0000180a')) as Service;
		const i40Service: Service = services.find((service: Service) => service.uuid.startsWith('00007500')) as Service;
		const eventDetectionService: Service = services.find((service: Service) => service.uuid.startsWith('00007700')) as Service;

		const dataControlCharacteristic: Characteristic = characteristics.find((characteristic: Characteristic) => characteristic.uuid.startsWith('0000750a')) as Characteristic;
		const inertialDataCharacteristic: Characteristic = characteristics.find((characteristic: Characteristic) => characteristic.uuid.startsWith('00007502')) as Characteristic;
		const environmentalDataCharacteristic: Characteristic = characteristics.find((characteristic: Characteristic) => characteristic.uuid.startsWith('00007504')) as Characteristic;
		const eventDetectionConfigurationCharacteristic: Characteristic = characteristics.find((characteristic: Characteristic) => characteristic.uuid.startsWith('00007701')) as Characteristic;

		const environmentalDataDescriptors: Descriptor[] = await this.discoverDescriptors([environmentalDataCharacteristic]);
		const inertialDataDescriptors: Descriptor[] = await this.discoverDescriptors([inertialDataCharacteristic]);

		const clientCharacteristicConfiguration: Descriptor = environmentalDataDescriptors.find((descriptor: Descriptor) => descriptor.uuid === '2902') as Descriptor;

		dataControlCharacteristic.read((error: string, data: Buffer) => {
			if (error) {
				console.log(error);
			}
		});

		const disableNotificationValue: Buffer = Buffer.from([0x00, 0x00]);
		const enableNotificationValue: Buffer = Buffer.from([0x01, 0x00]);

		const configuration: Buffer = Buffer.from([0x19, 0x0f, 0x02, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

		await environmentalDataDescriptors[0].writeValue(disableNotificationValue, console.log);
		await inertialDataDescriptors[0].writeValue(disableNotificationValue, console.log);

		await environmentalDataCharacteristic.on('data', (data: Buffer, isNotification: boolean) => {
			const temperature: number = this.toSigned16Bit((data[0] << 8) | data[1]) / 10.0;
			const humidity: number = (data[2] << 8 | data[3]) / 100.0;
			const pressure: number = ((data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7]) / 100.0;
			const noise: number = this.toSigned16Bit((data[8] << 8) | data[9]);
			const light: number = (data[10] << 24) | (data[11] << 16) | (data[12] << 8) | data[13];

			this.subject.next(
				new EnvironmentalData({
					temperature,
					humidity,
					pressure,
					noise,
					light
				}));
		});

		await environmentalDataCharacteristic.subscribe(console.log);

		await inertialDataCharacteristic.on('data', (data: Buffer, isNotification: boolean) => {
			const accelerationX: number = this.toSigned16Bit((data[0] << 8) | data[1]);
			const accelerationY: number = this.toSigned16Bit((data[2] << 8) | data[3]);
			const accelerationZ: number = this.toSigned16Bit((data[4] << 8) | data[5]);

			const gyroX: number = ((data[6] << 8) | data[7]) >> 4;
			const gyroY: number = ((data[7] & 0x0f) << 8) | data[8];
			const gyroZ: number = (data[9] << 4) | (data[10] >> 4);

			const magnetometerX: number = ((((data[10] & 0x0f) << 8) | data[11]) << 2) | (data[12] >> 6);
			const magnetometerY: number = ((data[12] & 0x3f) << 8) | data[13];
			const magnetometerZ: number = this.toSigned16Bit((data[14] << 8) | data[15]);

			this.subject.next(
				new InertialData({
					accelerationX,
					accelerationY,
					accelerationZ,
					gyroX,
					gyroY,
					gyroZ,
					magnetometerX,
					magnetometerY,
					magnetometerZ
				})
			);
		});

		await inertialDataCharacteristic.subscribe(console.log);
		await environmentalDataDescriptors[0].writeValue(enableNotificationValue, console.log);
		await inertialDataDescriptors[0].writeValue(enableNotificationValue, console.log);
		await dataControlCharacteristic.write(configuration, true, console.log);

		dataControlCharacteristic.read((error: string, data: Buffer) => {
			if (error) {
				console.log(error);
			}
		});
	}

	private toSigned16Bit(unsigned: number): number {
		return -(unsigned & 0x8000) | (unsigned & 0x7fff);
	}

	private async discoverDescriptors(characteristics: Characteristic[]): Promise<Descriptor[]> {
		const descriptorsResult: Descriptor[] = [];

		return new Promise<Descriptor[]>((resolve) => {
			const promises: Array<Promise<Descriptor[]>> = [];

			characteristics.forEach((characteristic: Characteristic) =>
				promises.push(
					new Promise<Descriptor[]>((resolveInner) =>
						characteristic.discoverDescriptors(
							(error: string, descriptors: Descriptor[]) => {
								descriptorsResult.push(...descriptors);
								resolveInner();
							}
						)
					)
				)
			);

			Promise.all(promises).then(() => resolve(descriptorsResult));
		});
	}

	private async discoverServicesAndCharacteristics(peripheral: Peripheral): Promise<{ services: Service[]; characteristics: Characteristic[] }> {
		const result: { services: Service[]; characteristics: Characteristic[] } = { services: [], characteristics: [] };

		return new Promise<{ services: Service[], characteristics: Characteristic[]; }>((resolve) => {
			peripheral.discoverAllServicesAndCharacteristics((error: string, services: Service[], characteristics: Characteristic[]) => {
				if (error) {
					console.log(error);
				} else {
					result.services = services;
					result.characteristics = characteristics;
					resolve(result);
				}
			});
		});
	}

	private async connect(peripheral: Peripheral): Promise<void> {
		return new Promise<void>((resolve, reject) =>
			peripheral.connect((error: string) => {
				if (!error) {
					this.connectedDevices.push(peripheral);
					resolve();
				} else {
					console.log(error);
					reject();
				}
			}));
	}

	private async getPeripheral(address: string): Promise<Peripheral> {
		return new Promise<Peripheral>(resolve => {
			this.noble.on('discover', (peripheral: Peripheral) => {
				if (peripheral.address == address) {
					resolve(peripheral);
				}
			});
		});
	}
}
