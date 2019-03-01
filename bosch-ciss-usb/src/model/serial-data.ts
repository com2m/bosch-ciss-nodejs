export interface ISerialData {
    type: string;
    data: number[];
}

export class SerialData implements ISerialData {

    public static isInstanceOfSerialData(object: any): object is SerialData {
        return 'type' in object && 'data' in object;
    }

    public type: string = '';
    public data: number[] = [];

    constructor(serialData: ISerialData | string) {
        if (serialData instanceof SerialData) {
            Object.assign(this, serialData);
        } else {
            Object.assign(this, JSON.parse(JSON.stringify(serialData)));
        }
    }

}
