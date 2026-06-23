



class KingPossibleMovesCalculator {
	static execute(
		board,
		startRow,
		startCol,
		targetSet,
	) {
		const alignment = board.getCell( startRow, startCol ).getUnit().getAlignment();
		this.tryAddCoordinate( board, startRow - 1, startCol - 1, alignment, targetSet );
		this.tryAddCoordinate( board, startRow - 1, startCol + 0, alignment, targetSet );
		this.tryAddCoordinate( board, startRow + 0, startCol - 1, alignment, targetSet );
		this.tryAddCoordinate( board, startRow - 1, startCol + 1, alignment, targetSet );
		this.tryAddCoordinate( board, startRow + 1, startCol - 1, alignment, targetSet );
		this.tryAddCoordinate( board, startRow + 1, startCol + 0, alignment, targetSet );
		this.tryAddCoordinate( board, startRow + 0, startCol + 1, alignment, targetSet );
		this.tryAddCoordinate( board, startRow + 1, startCol + 1, alignment, targetSet );
	}
	
	static tryAddCoordinate(
		board,
		row,
		col,
		movingUnitAlignment,
		targetSet,
	) {
		if ( !board.isWithin( row, col ) )
			return;
		const cell = board.getCell( row, col );
		if ( !cell.containsUnit() ) {
			targetSet.add( new Coordinate( row, col ) );
			return;
		}
		const metUnit = cell.getUnit();
		if ( metUnit.getAlignment() !== movingUnitAlignment ) {
			targetSet.add( new Coordinate( row, col ) );
		}
	}
}