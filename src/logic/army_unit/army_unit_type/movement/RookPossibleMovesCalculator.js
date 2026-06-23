


class RookPossibleMovesCalculator {
	static execute(
		board,
		startRow,
		startCol,
		targetSet,
	) {
		LineMovementHelper.execute( board, startRow, startCol, -1,  0, targetSet );
		LineMovementHelper.execute( board, startRow, startCol,  0,  -1, targetSet );
		LineMovementHelper.execute( board, startRow, startCol,  1,  0, targetSet );
		LineMovementHelper.execute( board, startRow, startCol,  0,  1, targetSet );
	}
}