

class Cell {
	constructor() {
		this.unit = null;
	}
	
	containsUnit() {
		return this.unit !== null;
	}
	
	getUnit() {
		return this.unit;
	}
	
	setUnit( newUnit ) {
		this.unit = newUnit;
	}
}