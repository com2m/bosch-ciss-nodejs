export interface IInertialData {
	accelerationX?: number;
	accelerationY?: number;
	accelerationZ?: number;
	gyroX?: number;
	gyroY?: number;
	gyroZ?: number;
	magnetometerX?: number;
	magnetometerY?: number;
	magnetometerZ?: number;
}

export class InertialData {
	public accelerationX?: number;
	public accelerationY?: number;
	public accelerationZ?: number;
	public gyroX?: number;
	public gyroY?: number;
	public gyroZ?: number;
	public magnetometerX?: number;
	public magnetometerY?: number;
	public magnetometerZ?: number;

	constructor(inertialData: IInertialData) {
		Object.assign(this, inertialData);
	}
}
