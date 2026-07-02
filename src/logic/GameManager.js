

class GameManager {
	
	constructor( gameState ) {
		this.gameState = gameState;
		this.turnLimit = 0;
		
		this.availableActions = new Map();
		this.availableActions.set( Alignment.FirstPlayer, new AvailableActions() );
		this.availableActions.set( Alignment.SecondPlayer, new AvailableActions() );
		
		this.updateAvailableActions();
		
		this.unitTypeLibrary = null;
	}
	
	getGameState() {
		return this.gameState;
	}
	
	// ─── Available Actions ────────────────────────────────────────
	
	updateAvailableActions() {
		this.updateAvailableActionsForAlignment( Alignment.FirstPlayer );
		this.updateAvailableActionsForAlignment( Alignment.SecondPlayer );
	}
	
	updateAvailableActionsForAlignment( alignment ) {
		this.updateAvailableUnitMoves( alignment );
		this.updateAvailableDeployments( alignment );
	}
	
	updateAvailableUnitMoves( alignment ) {
		const alignmentAvailableActions = this.availableActions.get( alignment );
		
		const board = this.gameState.getBoard();
		const player = this.gameState.getPlayer( alignment );
		let unitIterator = player.getActiveUnits();
		let unitWrapper = unitIterator.next();
		
		while( !unitWrapper.done ) {
			let unit = unitWrapper.value;
			const unitCoordinate = board.getCoordinateOfUnit( unit );
			const updatedPossibleMoves = unit.getType().getPossibleMoves(
				this.gameState,
				unitCoordinate.getRow(),
				unitCoordinate.getColumn(),
			);
			// Weak pieces cannot capture — filter out squares that have units
			if ( !unit.isWeak() ) {
				alignmentAvailableActions.setUnitMoves( unit, updatedPossibleMoves );
			} else {
				const notCaptureMoves = new Set();
				for ( const coordinate of updatedPossibleMoves ) {
					const cell = board.getCell( coordinate.getRow(), coordinate.getColumn() );
					if ( !cell.containsUnit() ) {
						notCaptureMoves.add( coordinate );
					}
				}
				alignmentAvailableActions.setUnitMoves( unit, notCaptureMoves );
			}
			unitWrapper = unitIterator.next();
		}
	}
	
	updateAvailableDeployments( alignment ) {
		const alignmentAvailableActions = this.availableActions.get( alignment );
		
		const availableDeploymentCalculator = new AvailableDeploymentCalculator();
		availableDeploymentCalculator.execute( this.gameState, alignment );
		
		alignmentAvailableActions.setNormalDeployments(
			availableDeploymentCalculator.getNormalDeploymentDestinations()
		);
		alignmentAvailableActions.setColorBoundDeployments(
			availableDeploymentCalculator.getColorBoundDeploymentDestinations()
		);
	}
	
	// ─── Move ─────────────────────────────────────────────────────
	
	getAvailableMovesForUnit( unit ) {
		const availableActions = this.availableActions.get( unit.getAlignment() );
		if ( !availableActions.getUnitMoves().has( unit ) ) {
			console.trace();
			throw new Error( 'No moves found for unit' );
		}
		return availableActions.getUnitMoves().get( unit ).values();
	}
	
	canExecuteMove( unit, destinationRow, destinationColumn ) {
		if ( this.gameState.isWinnerDecided() )
			return false;
		if ( unit.getAlignment() !== this.gameState.getActivePlayerAlignment() )
			return false;
		if (
			!this.checkIfCollectionContainsCoordinate(
				this.getAvailableMovesForUnit( unit ),
				destinationRow,
				destinationColumn,
			)
		)
			return false;
		return true;
	}
	
	executeMove( unit, destinationRow, destinationColumn ) {
		if ( !this.canExecuteMove( unit, destinationRow, destinationColumn ) ) {
			console.log( this );
			console.trace();
			throw new Error();
		}

		this.tryProcessUnitCapture( destinationRow, destinationColumn );

		const board = this.gameState.getBoard();
		board.moveUnit( unit, destinationRow, destinationColumn );
		
		this.tryPromote( unit, destinationRow, destinationColumn );
		
		if ( !this.gameState.isWinnerDecided() )
			this.passTurn();
		
		this.updateAvailableActions();
	}
	
	// ─── Deploy ───────────────────────────────────────────────────
	
	getAvailableDeploymentsForUnit( unit ) {
		const availableActions = this.availableActions.get( unit.getAlignment() );
		const deployments = ( unit.getType().isColorBound() )
			?	availableActions.getColorBoundDeployments()
			:	availableActions.getNormalDeployments()
		;
		
		return deployments.values();
	}
	
	canExecuteDeploy( unit, destinationRow, destinationColumn ) {
		if ( this.gameState.isWinnerDecided() )
			return false;
		if ( unit.getAlignment() !== this.gameState.getActivePlayerAlignment() )
			return false;
		if (
			!this.checkIfCollectionContainsCoordinate(
				this.getAvailableDeploymentsForUnit( unit ),
				destinationRow,
				destinationColumn,
			)
		)
			return false;
		return true;
	}
	
	executeDeploy( unit, destinationRow, destinationColumn ) {
		if ( !this.canExecuteDeploy( unit, destinationRow, destinationColumn ) ) {
			console.log( this );
			console.trace();
			throw new Error();
		}
		
		this.gameState.deployUnit( unit, destinationRow, destinationColumn );
		unit.setWeaknessCounter( GameManager.POST_DEPLOYMENT_WEAKNESS_COUNTER );
		
		if ( !this.gameState.isWinnerDecided() )
			this.passTurn();
		
		this.updateAvailableActions();
	}
	
	// ─── Unit Management ──────────────────────────────────────────
	
	removeUnit( unit ) {
		this.availableActions.get( unit.getAlignment() ).getUnitMoves().delete( unit );
		this.gameState.removeUnitFromBoard( unit );
	}
	
	placeNewUnit( newUnit, row, column ) {
		this.gameState.placeNewUnit( newUnit, row, column );
	}
	
	// ─── Turn Management ──────────────────────────────────────────
	
	setTurnLimit( turnLimit ) {
		this.turnLimit = turnLimit;
	}
	
	setUnitTypeLibrary( unitTypeLibrary ) {
		this.unitTypeLibrary = unitTypeLibrary;
	}
	
	passTurn() {
		this.tickWeaknessCounters( this.gameState.getActivePlayerAlignment() );
		this.gameState.switchActivePlayer();
		if ( this.gameState.getActivePlayerAlignment() === Alignment.FirstPlayer ) {
			this.gameState.incrementTurnCounter();
			if ( this.gameState.getCurrentTurn() > this.turnLimit )
				this.decideWinnerBasedOnControlPoints();
		}
		
		if ( !this.gameState.isWinnerDecided() )
			this.collectControlPoints( this.gameState.getActivePlayerAlignment() );
	}
	
	// ─── Promotion ────────────────────────────────────────────────
	
	tryPromote( unit, destinationRow, destinationColumn ) {
		if ( !unit.getType().canBePromoted() )
			return;
		const oppositeAlignment = Alignment.getOpposite( unit.getAlignment() );
		const board = this.gameState.getBoard();
		const opponentHomeRow = BoardRegionCalculator.getHomeRow(
			oppositeAlignment,
			board,
		);
		if ( destinationRow === opponentHomeRow ) {
			// promoted=true prevents this queen from entering the reserve if captured
			const promotedQueen = new ArmyUnit(
				this.unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.QUEEN_TYPE_NAME ),
				unit.getAlignment(),
				true,
			);
			this.removeUnit( unit );
			this.placeNewUnit( promotedQueen, destinationRow, destinationColumn );
		}
	}
	
	// ─── Victory Points ───────────────────────────────────────────
	
	decideWinnerBasedOnControlPoints() {
		const firstPlayer  = this.gameState.getPlayer( Alignment.FirstPlayer );
		const secondPlayer = this.gameState.getPlayer( Alignment.SecondPlayer );
		
		const firstPlayerControlPoints  = firstPlayer.getControlPoints();
		const secondPlayerControlPoints = secondPlayer.getControlPoints();
		
		// Ties should not normally occur given the 1-point head-start Black receives
		if ( firstPlayerControlPoints === secondPlayerControlPoints )
			throw new Error( 'Control point tie — unexpected draw' );
		
		const winnerAlignment =
				( firstPlayerControlPoints > secondPlayerControlPoints )
			?	Alignment.FirstPlayer
			:	Alignment.SecondPlayer
		;
		this.gameState.setWinner( winnerAlignment );
	}
	
	collectControlPoints( alignment ) {
		const board  = this.gameState.getBoard();
		const player = this.gameState.getPlayer( alignment );
		let unitIterator = player.getActiveUnits();
		let unitWrapper  = unitIterator.next();
		
		while( !unitWrapper.done ) {
			let unit = unitWrapper.value;
			if ( unit.getType().canCollectControlPoints() && !unit.isWeak() ) {
				const unitCoordinate = board.getCoordinateOfUnit( unit );
				const cell = board.getCell(
					unitCoordinate.getRow(),
					unitCoordinate.getColumn(),
				);
				player.collectControlPoints(
					cell.getControlPointIncome( alignment )
				);
			}
			
			unitWrapper = unitIterator.next();
		}
	}
	
	// ─── Capture ─────────────────────────────────────────────────
	
	tryProcessUnitCapture( destinationRow, destinationColumn ) {
		const board = this.gameState.getBoard();
		const destinationCell = board.getCell( destinationRow, destinationColumn );
		if ( destinationCell.containsUnit() ) {
			const capturedUnit = destinationCell.getUnit();
			const beneficiary  = this.gameState.getPlayer(
				Alignment.getOpposite( capturedUnit.getAlignment() )
			);
			if ( capturedUnit.getType().isGameCritical() ) {
				this.gameState.setWinner( beneficiary.getAlignment() );
			}
			this.removeUnit( capturedUnit );
			
			// Only redeployable and non-promoted pieces go to the reserve
			if ( !capturedUnit.getType().canBeRedeployed() )
				return;
			
			if ( capturedUnit.isPromoted() )
				return;

			capturedUnit.switchAlignment();
			beneficiary.addUnitToReserve( capturedUnit );
		}
	}
	
	// ─── Weakness ─────────────────────────────────────────────────
	
	tickWeaknessCounters( alignment ) {
		const player = this.gameState.getPlayer( alignment );
		let unitIterator = player.getActiveUnits();
		let unitWrapper  = unitIterator.next();
		
		while( !unitWrapper.done ) {
			let unit = unitWrapper.value;
			if ( unit.isWeak() )
				unit.decrementWeaknessCounter();
			
			unitWrapper = unitIterator.next();
		}
	}
	
	// ─── Helpers ──────────────────────────────────────────────────
	
	/*
	// Coordinate should work as value, but it is currently Object.
	*/
	checkIfCollectionContainsCoordinate( collection, row, col ) {
		for ( const coordinate of collection ) {
			if ( 
					( coordinate.getRow() === row )
				&&	( coordinate.getColumn() === col )
			)
				return true;
		}
		return false;
	}
	
	static POST_DEPLOYMENT_WEAKNESS_COUNTER = 4;
}