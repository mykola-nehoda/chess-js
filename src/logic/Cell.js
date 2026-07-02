


class Cell {
	constructor() {
		this.unit = null;
		
		this.controlPointIncomes = new Map();
		this.initControlPointIncomes();
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
	
	initControlPointIncomes() {
		this.controlPointIncomes.set( Alignment.FirstPlayer, 0 );
		this.controlPointIncomes.set( Alignment.SecondPlayer, 0 );
	}
	
	getControlPointIncome( alignment ) {
		return this.controlPointIncomes.get( alignment );
	}
	
	setControlPointIncome( alignment, newIncome ) {
		this.controlPointIncomes.set( alignment, newIncome );
	}
}