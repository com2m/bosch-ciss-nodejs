import { Subject } from 'rxjs';
import SerialPort from 'serialport';
import { MeasuredValues } from './model/measured-values';
import { SensorData } from './model/sensor-data';
import { SerialData } from './model/serial-data';

export class BoschCiss {
    public subject: Subject<{ timestamp: Date, data: SensorData[] }> = new Subject<{ timestamp: Date, data: SensorData[] }>();

    private port: SerialPort;

    constructor(deviceName: string) {
        this.port = new SerialPort('/dev/' + deviceName, {
            baudRate: 115200
        }, (error) => {
            if (error) {
                console.log('Error: ' + error);
            }
        });

        this.start();
    }

    private async start() {
        console.log('Turn off sensors.');
        await this.write(this.toPayload([0xfe, 0x02, 0x84, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x81, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x83, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x82, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x80, 0x00]));

        console.log('Sensor configuration.');
        console.log('Set range of acceleration sensor to 16g:');
        await this.write(this.toPayload([0xfe, 0x03, 0x80, 0x04, 0x10]));
        console.log('Configure accelerometer period 100000:');
        await this.write(this.toPayload([0xfe, 0x06, 0x80, 0x02, 0xa0, 0x86, 0x01, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x80, 0x01]));
        console.log('Configure period 1:');
        await this.write(this.toPayload([0xfe, 0x04, 0x84, 0x02, 0x01, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x84, 0x01]));
        console.log('Configure magnetometer period 100000:');
        await this.write(this.toPayload([0xfe, 0x06, 0x81, 0x02, 0xa0, 0x86, 0x01, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x81, 0x01]));
        console.log('Configure period 1:');
        await this.write(this.toPayload([0xfe, 0x04, 0x83, 0x02, 0x01, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x83, 0x01]));
        console.log('Configure gyroscope period 100000:');
        await this.write(this.toPayload([0xfe, 0x06, 0x82, 0x02, 0xa0, 0x86, 0x01, 0x00]));
        await this.write(this.toPayload([0xfe, 0x02, 0x82, 0x01]));

        this.handleDataEvents();
    }

    private handleDataEvents(): void {
        this.port.on('data', (data: string) => {
            const serialData: SerialData = new SerialData(data);

            const sensorData: SensorData[] = MeasuredValues.toMeasuredValuesArray(serialData)
                .map(SensorData.parseData);

            this.subject.next({ timestamp: new Date(), data: sensorData });
        });
    }

    private toPayload(numbers: number[]): number[] {
        return [...numbers, calcCrc(numbers)];
    }

    private toHex(numbers: number[]): string {
        let dataString: string = '';

        numbers.forEach((num: number) => {
            dataString = dataString + (dataString !== '' ? ' ' : '');

            let hexNum: string = num.toString(16);
            while (hexNum.length < 2) {
                hexNum = '0' + hexNum;
            }

            dataString = dataString + '0x' + hexNum;
        });

        return dataString;
    }

    private async write(data: number[], wait: number = 500): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.port.write(data, (error) => {
                console.log('Write: ' + this.toHex(data));

                if (error) {
                    console.log('Error on write: ', error.message);
                    reject();
                }

                setTimeout(() => resolve(), wait);
            });
        });
    }

}
