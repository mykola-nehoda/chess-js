


class BishopUnitType extends ArmyUnitType {
	getName() {
		return ArmyUnitTypeNames.BISHOP_TYPE_NAME;
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		const result = new Set();
		BishopPossibleMovesCalculator.execute(
			gameState.getBoard(),
			startLine,
			startColumn,
			result,
		);
		return result;
	}
	
	isColorBound() {
		return true;
	}
}