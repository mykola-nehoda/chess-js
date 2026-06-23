


class QueenUnitType extends ArmyUnitType {
	getName() {
		return ArmyUnitTypeNames.QUEEN_TYPE_NAME;
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		const result = new Set();
		QueenPossibleMovesCalculator.execute(
			gameState.getBoard(),
			startLine,
			startColumn,
			result,
		);
		return result;
	}
}