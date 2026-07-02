


class Player {
	constructor( alignment ) {
		this.alignment = alignment;
		this.activeUnits = new Set();
		this.reservedUnits = new Array();
		this.controlPoints = 0;
	}
	
	getAlignment() {
		return this.alignment;
	}
	
	addActiveUnit( newUnit ) {
		this.activeUnits.add( newUnit );
	}
	
	removeActiveUnit( unit ) {
		this.activeUnits.delete( unit );
	}
	
	getActiveUnits() {
		return this.activeUnits.values();
	}
	
	addUnitToReserve( newUnit ) {
		this.reservedUnits.push( newUnit );
	}
	
	removeUnitFromReserve( unit ) {
		const indexInReserve = this.reservedUnits.indexOf( unit );
		if ( indexInReserve === -1 )
			throw new Error();
		this.reservedUnits.splice( indexInReserve, 1 );
	}
	
	getReservedUnits() {
		return this.reservedUnits.values();
	}
	
	hasReservedUnit( unit ) {
		return this.reservedUnits.includes( unit );
	}
	
	getUnitFromReserveByIndex( idx ) {
		if ( !this.isWithinReserve( idx ) ) {
			throw new Error();
		}
		return this.reservedUnits[idx];
	}
	
	getControlPoints() {
		return this.controlPoints;
	}
	
	collectControlPoints( controlPoints ) {
		this.controlPoints += controlPoints;
	}
	
	isWithinReserve( idx ) {
		if ( idx < 0 )
			return false;
		if ( idx >= this.getReserveSize() )
			return false;

		return true;
	}

	getReserveSize() {
		return this.reservedUnits.length;
	}
}