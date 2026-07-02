

class PawnPossibleMovesCalculator {
	static getRowForDoubleMove( board, alignment ) {
		return (
				BoardRegionCalculator.getHomeRow( alignment, board )
			+	AlignmentDirectionCalculator.execute( alignment )
		);
	}
	
	static execute(
		board,
		startRow,
		startCol,
		targetSet,
	) {
		const alignment = board.getCell( startRow, startCol ).getUnit().getAlignment();
		const moveDirection = AlignmentDirectionCalculator.execute( alignment );
		
		this.tryCapture( board, startRow + moveDirection, startCol - 1, alignment, targetSet );
		this.tryCapture( board, startRow + moveDirection, startCol + 1, alignment, targetSet );
		
		const canMoveOnce = this.tryMove( board, startRow + moveDirection, startCol, targetSet );
		if ( !canMoveOnce ) {
			// Center-column pawns can capture forward vertically when blocked
			if ( BoardRegionCalculator.isCenterCol( board, startCol ) ) {
				this.tryCapture( board, startRow + moveDirection, startCol, alignment, targetSet );
			}
			return;
		}

		if ( startRow === this.getRowForDoubleMove( board, alignment ) ) {
			const doubleMoveRow = startRow + ( 2 * moveDirection );
			if (
					!this.checkForDoubleMoveStopper( board, doubleMoveRow, startCol - 1 )
				&&	!this.checkForDoubleMoveStopper( board, doubleMoveRow, startCol + 1 )
			) {
				this.tryMove( board, doubleMoveRow, startCol, targetSet );
			}
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
	
	static checkForDoubleMoveStopper(
		board,
		row,
		col,
	) {
		if ( !board.isWithin( row, col ) )
			return false;
		const cell = board.getCell( row, col );
		if ( !cell.containsUnit() )
			return false;
		const metUnit = cell.getUnit();
		return metUnit.getType().canStopDoubleMove();
	}
}