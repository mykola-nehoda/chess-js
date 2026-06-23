


class PawnPossibleMovesCalculator {
	static getMoveDirection( alignment ) {
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return 1;
			case Alignment.SecondPlayer:
				return -1;
			default:
				throw new Error();
		}
	}
	
	static getRowForDoubleMove( board, alignment ) {
		return (
				HomeRowCalculator.execute( alignment, board )
			+	this.getMoveDirection( alignment )
		);
	}
	
	static execute(
		board,
		startRow,
		startCol,
		targetSet,
	) {
		const alignment = board.getCell( startRow, startCol ).getUnit().getAlignment();
		const moveDirection = this.getMoveDirection( alignment );
		
		this.tryCapture( board, startRow + moveDirection, startCol - 1, alignment, targetSet );
		this.tryCapture( board, startRow + moveDirection, startCol + 1, alignment, targetSet );
		
		const canMoveOnce = this.tryMove( board, startRow + moveDirection, startCol, targetSet );
		if ( !canMoveOnce )
			return;

		if ( startRow === this.getRowForDoubleMove( board, alignment ) ) {
			this.tryMove( board, startRow + ( 2 * moveDirection ), startCol, targetSet );
		}
	}
	
	static tryCapture(
		board,
		row,
		col,
		movingUnitAlignment,
		targetSet,
	) {
		if ( !board.isWithin( row, col ) )
			return;
		const cell = board.getCell( row, col );
		if ( !cell.containsUnit() )
			return;
		const metUnit = cell.getUnit();
		if ( metUnit.getAlignment() !== movingUnitAlignment ) {
			targetSet.add( new Coordinate( row, col ) );
		}
	}
	
	static tryMove(
		board,
		row,
		col,
		targetSet,
	) {
		if ( !board.isWithin( row, col ) )
			return false;
		const cell = board.getCell( row, col );
		if ( cell.containsUnit() )
			return false;
		targetSet.add( new Coordinate( row, col ) );
		return true;
	}
}