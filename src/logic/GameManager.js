

class GameManager {
	constructor( gameState ) {
		this.gameState = gameState;
		this.turnLimit = 0;

		this.unitPossibleMoves = new Map();
		this.updateUnitsPossibleMoves();
		
		this.unitTypeLibrary = null;
	}
	
	getGameState() {
		return this.gameState;
	}
	
	updateUnitsPossibleMoves() {
		const board = this.gameState.getBoard();
		let unitIterator = board.getUnits();
		let unitWrapper = unitIterator.next();
		
		while( !unitWrapper.done ) {
			let unit = unitWrapper.value;
			//console.log( unit );
			const unitCoordinate = board.getCoordinateOfUnit( unit );
			//console.log( unitCoordinate );
			const updatedPossibleMoves = unit.getType().getPossibleMoves(
				this.gameState,
				unitCoordinate.getRow(),
				unitCoordinate.getColumn(),
			);
			this.unitPossibleMoves.set( unit, updatedPossibleMoves );
			unitWrapper = unitIterator.next();
		}
	}
	
	canExecuteMove( unit, destinationRow, destinationColumn ) {
		if ( this.gameState.isWinnerDecided() )
			return false;
		if ( unit.getAlignment() !== this.gameState.getActivePlayerAlignment() )
			return false;
		const possibleMoves = this.unitPossibleMoves.get( unit );
		const destination = new Coordinate( destinationRow, destinationColumn );
		let moveIsValid = false;
		for ( const move of possibleMoves ) {
			if ( Coordinate.areEqual( move, destination ) ) {
				moveIsValid = true;
				break;
			}
		}
		if ( !moveIsValid )
			return false;
		return true;
	}
	
	executeMove( unit, destinationRow, destinationColumn ) {
		if ( !this.canExecuteMove( unit, destinationRow, destinationColumn ) )
			throw new Error();

		const board = this.gameState.getBoard();
		const destinationCell = board.getCell( destinationRow, destinationColumn );
		if ( destinationCell.containsUnit() ) {
			const unitToRemove = destinationCell.getUnit();
			if ( unitToRemove.getType().isGameCritical() ) {
				this.gameState.setWinner( Alignment.getOpposite( unitToRemove.getAlignment() ) );
			}
			this.removeUnit( unitToRemove );
		}
		
		board.moveUnit( unit, destinationRow, destinationColumn );
		
		this.tryPromote( unit, destinationRow, destinationColumn );
		
		if ( !this.gameState.isWinnerDecided() )
			this.passTurn();
		
		this.updateUnitsPossibleMoves();
	}
	
	removeUnit( unit ) {
		this.unitPossibleMoves.delete( unit );
		this.gameState.removeUnit( unit );
	}
	
	setTurnLimit( turnLimit ) {
		this.turnLimit = turnLimit;
	}
	
	setUnitTypeLibrary( unitTypeLibrary ) {
		this.unitTypeLibrary = unitTypeLibrary;
	}
	
	passTurn() {
		this.gameState.switchActivePlayer();
		if ( this.gameState.getActivePlayerAlignment() === Alignment.FirstPlayer ) {
			this.gameState.incrementTurnCounter();
			if ( this.gameState.getCurrentTurn() > this.turnLimit )
				this.gameState.setWinner( Alignment.SecondPlayer );
		}
	}
	
	tryPromote( unit, destinationRow, destinationColumn ) {
		if ( !unit.getType().canBePromoted() )
			return;
		const oppositeAlinment = Alignment.getOpposite( unit.getAlignment() );
		const board = this.gameState.getBoard();
		const opponentHomeRow = HomeRowCalculator.execute(
			oppositeAlinment,
			board,
		);
		if ( destinationRow === opponentHomeRow ) {
			const promotedQueen = new ArmyUnit(
				this.unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.QUEEN_TYPE_NAME ),
				unit.getAlignment()
			);
			this.removeUnit( unit );
			this.placeNewUnit( promotedQueen, destinationRow, destinationColumn );
		}
	}
	
	placeNewUnit( newUnit, row, column ) {
		this.gameState.placeNewUnit( newUnit, row, column )
	}
}