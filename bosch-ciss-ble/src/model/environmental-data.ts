export interface IEnvironmentalData {
	temperature?: number;
	humidity?: number;
	pressure?: number;
	light?: number;
	noise?: number;
}

export class EnvironmentalData {
	public temperature?: number;
	public humidity?: number;
	public pressure?: number;
	public light?: number;
	public noise?: number;

	constructor(inertialData: EnvironmentalData) {
		Object.assign(this, inertialData);
	}
}
