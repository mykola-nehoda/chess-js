



class QueenPossibleMovesCalculator {
	static execute(
		board,
		startRow,
		startCol,
		targetSet,
	) {
		BishopPossibleMovesCalculator.execute( board, startRow, startCol, targetSet );
		RookPossibleMovesCalculator.execute( board, startRow, startCol, targetSet );
	}
}