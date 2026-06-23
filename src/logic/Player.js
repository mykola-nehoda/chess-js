

class Player {
	constructor( alignment ) {
		this.alignment = alignment;
		this.units = new Set();
	}
	
	getAlignment() {
		return this.alignment;
	}
	
	addUnit( newUnit ) {
		this.units.add( newUnit );
	}
	
	removeUnit( unit ) {
		this.units.delete( unit );
	}
	
	getUnits() {
		return this.units.values();
	}
}