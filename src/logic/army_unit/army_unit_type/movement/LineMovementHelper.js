


class LineMovementHelper {
	static execute(
		board,
		startRow,
		startCol,
		rowStep,
		colStep,
		targetSet,
	) {
		const movingUnitAlignment = board.getCell( startRow, startCol ).getUnit().getAlignment();

		let currentRow = startRow + rowStep;
		let currentCol = startCol + colStep;
		
		for ( ; ; currentRow += rowStep, currentCol += colStep ) {
			if ( !board.isWithin( currentRow, currentCol ) )
				return;
			const cell = board.getCell( currentRow, currentCol );
			if ( !cell.containsUnit() ) {
				targetSet.add( new Coordinate( currentRow, currentCol ) );
				continue;
			}

			const metUnit = cell.getUnit();
			if ( metUnit.getAlignment() !== movingUnitAlignment ) {
				targetSet.add( new Coordinate( currentRow, currentCol ) );
			}
			return;
		}
	}
}