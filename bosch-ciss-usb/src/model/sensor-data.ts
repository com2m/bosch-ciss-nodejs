import { MeasuredValues } from './measured-values';

export interface ISensorData {
    accelerationX?: number;
    accelerationY?: number;
    accelerationZ?: number;
    gyroX?: number;
    gyroY?: number;
    gyroZ?: number;
    magnetometerX?: number;
    magnetometerY?: number;
    magnetometerZ?: number;
    temperature?: number;
    humidity?: number;
    pressure?: number;
    light?: number;
    noise?: number;
}

export class SensorData {

    public static parseData(measuredValues: MeasuredValues): SensorData {
        const sensorData = new SensorData();

        if (measuredValues.data[2] === 0x05) {
            const temperature: number = SensorData.toSigned16Bit(measuredValues.data[4] << 8 | measuredValues.data[3]) / 10.0;

            sensorData.temperature = temperature;
        }

        if (measuredValues.data[5] === 0x07) {
            const humidity: number = (measuredValues.data[7] << 8 | measuredValues.data[6]) / 100.0;

            sensorData.humidity = humidity;
        }

        if (measuredValues.data[8] === 0x06) {
            const pressure: number = (measuredValues.data[12] << 24 | measuredValues.data[11] << 16 | measuredValues.data[10] << 8 | measuredValues.data[9]) / 100.0;

            sensorData.pressure = pressure;
        }

        if (measuredValues.data[2] === 0x08) {
            const lux: number = measuredValues.data[6] << 24 | measuredValues.data[5] << 16 | measuredValues.data[4] << 8 | measuredValues.data[3];

            sensorData.light = lux;
        }

        if (measuredValues.data[2] === 0x02) {
            const accelerationX: number = SensorData.toSigned16Bit(measuredValues.data[4] << 8 | measuredValues.data[3]);
            const accelerationY: number = SensorData.toSigned16Bit(measuredValues.data[6] << 8 | measuredValues.data[5]);
            const accelerationZ: number = SensorData.toSigned16Bit(measuredValues.data[8] << 8 | measuredValues.data[7]);

            sensorData.accelerationX = accelerationX;
            sensorData.accelerationY = accelerationY;
            sensorData.accelerationZ = accelerationZ;
        }

        if (measuredValues.data[2] === 0x04) {
            const gyroX: number = measuredValues.data[4] << 8 | measuredValues.data[3];
            const gyroY: number = measuredValues.data[6] << 8 | measuredValues.data[5];
            const gyroZ: number = measuredValues.data[8] << 8 | measuredValues.data[7];

            sensorData.gyroX = gyroX;
            sensorData.gyroY = gyroY;
            sensorData.gyroZ = gyroZ;
        }

        if (measuredValues.data[2] === 0x03) {
            const magnetoX: number = measuredValues.data[4] << 8 | measuredValues.data[3];
            const magnetoY: number = measuredValues.data[6] << 8 | measuredValues.data[5];
            const magnetoZ: number = SensorData.toSigned16Bit(measuredValues.data[8] << 8 | measuredValues.data[7]);

            sensorData.magnetometerX = magnetoX;
            sensorData.magnetometerY = magnetoY;
            sensorData.magnetometerZ = magnetoZ;
        }

        return sensorData;
    }

    private static toSigned16Bit(unsigned: number): number {
        return -(unsigned & 0x8000) | (unsigned & 0x7fff);
    }

    private static toSigned32Bit(unsigned: number): number {
        return -(unsigned & 0x80000000) | (unsigned & 0x7fffffff);
    }


    public accelerationX?: number;
    public accelerationY?: number;
    public accelerationZ?: number;
    public gyroX?: number;
    public gyroY?: number;
    public gyroZ?: number;
    public magnetometerX?: number;
    public magnetometerY?: number;
    public magnetometerZ?: number;
    public temperature?: number;
    public humidity?: number;
    public pressure?: number;
    public light?: number;
    public noise?: number;
    [key: string]: number | undefined;
    
    constructor(sensorData?: ISensorData) {
        if (sensorData != null) {
            Object.assign(this, sensorData);
        }
    }

}
