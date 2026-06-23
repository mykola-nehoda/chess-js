


class BishopPossibleMovesCalculator {
	static execute(
		board,
		startRow,
		startCol,
		targetSet,
	) {
		LineMovementHelper.execute( board, startRow, startCol, -1, -1, targetSet );
		LineMovementHelper.execute( board, startRow, startCol, -1,  1, targetSet );
		LineMovementHelper.execute( board, startRow, startCol,  1, -1, targetSet );
		LineMovementHelper.execute( board, startRow, startCol,  1,  1, targetSet );
	}
}