import { ISerialData } from './serial-data';

export interface IMeasuredValues {
    data: number[];
}

export class MeasuredValues {

    public static isInstanceOfMeasuredValues(object: any): object is MeasuredValues {
        return 'data' in object;
    }

    public static toMeasuredValuesArray(serialData: ISerialData): MeasuredValues[] {
        const measuredValues: MeasuredValues[] = [];

        while (serialData.data.length > 2 && serialData.data[1] - 3 < serialData.data.length) {
            measuredValues.push(new MeasuredValues(serialData.data.slice(0, serialData.data[1] + 3)));
            serialData.data = serialData.data.slice(serialData.data[1] + 3, serialData.data.length + 1);
        }

        return measuredValues;
    }

    public data: number[] = [];

    constructor(measuredValues: IMeasuredValues | number[]) {
        if (measuredValues instanceof MeasuredValues) {
            Object.assign(this, measuredValues);
        } else {
            this.data = measuredValues as number[];
        }
    }

}