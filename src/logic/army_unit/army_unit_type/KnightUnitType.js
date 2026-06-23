


class KnightUnitType extends ArmyUnitType {
	getName() {
		return ArmyUnitTypeNames.KNIGHT_TYPE_NAME;
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		const result = new Set();
		KnightPossibleMovesCalculator.execute(
			gameState.getBoard(),
			startLine,
			startColumn,
			result,
		);
		return result;
	}
}