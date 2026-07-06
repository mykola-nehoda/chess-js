
// Assigns a stable string ID to each unit based on its starting position.
// IDs survive moves (registry tracks them). Promotions transfer the pawn's ID
// to the new queen so remote clients can look up the promoted unit.

class UnitIdRegistry {
	constructor() {
		this.unitToId = new Map();
		this.idToUnit = new Map();
	}

	// Call once at game start with the initial game state.
	// Board units are keyed by their starting coordinate. Units that start in the
	// reserve (e.g. the starting knight) never touch the board, so they are keyed
	// by a reserve-scoped id instead — both clients build identical starting
	// reserves, so these ids line up across the network.
	registerAll( gameState ) {
		this.unitToId.clear();
		this.idToUnit.clear();

		const board = gameState.getBoard();
		const iter = board.getUnits();
		let w = iter.next();

		while ( !w.done ) {
			const unit = w.value;
			const coord = board.getCoordinateOfUnit( unit );
			this._assignId( unit, "r" + coord.getRow() + "c" + coord.getColumn() );
			w = iter.next();
		}

		for ( const alignment of [ Alignment.FirstPlayer, Alignment.SecondPlayer ] ) {
			const reserveIter = gameState.getPlayer( alignment ).getReservedUnits();
			let idx = 0;
			let rw = reserveIter.next();
			while ( !rw.done ) {
				this._assignId( rw.value, "reserve-" + alignment.name + "-" + idx );
				idx++;
				rw = reserveIter.next();
			}
		}
	}

	_assignId( unit, id ) {
		this.unitToId.set( unit, id );
		this.idToUnit.set( id, unit );
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
