
// Assigns a stable string ID to each unit based on its starting position.
// IDs survive moves (registry tracks them). Promotions transfer the pawn's ID
// to the new queen so remote clients can look up the promoted unit.

class UnitIdRegistry {
	constructor() {
		this.unitToId = new Map();
		this.idToUnit = new Map();
	}

	// Call once at game start with the initial board.
	registerAll( board ) {
		this.unitToId.clear();
		this.idToUnit.clear();

		const iter = board.getUnits();
		let w = iter.next();

		while ( !w.done ) {
			const unit = w.value;
			const coord = board.getCoordinateOfUnit( unit );
			const id = "r" + coord.getRow() + "c" + coord.getColumn();
			this.unitToId.set( unit, id );
			this.idToUnit.set( id, unit );
			w = iter.next();
		}
	}

	getId( unit ) {
		return this.unitToId.get( unit );
	}

	getUnit( id ) {
		return this.idToUnit.get( id );
	}

	// Called after a pawn promotes: gives the new unit the pawn's ID.
	transferId( fromUnit, toUnit ) {
		const id = this.unitToId.get( fromUnit );
		if ( id === undefined ) return;
		this.unitToId.delete( fromUnit );
		this.unitToId.set( toUnit, id );
		this.idToUnit.set( id, toUnit );
	}

	clear() {
		this.unitToId.clear();
		this.idToUnit.clear();
	}
}
