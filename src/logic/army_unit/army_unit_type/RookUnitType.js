


class RookUnitType extends ArmyUnitType {
	getName() {
		return ArmyUnitTypeNames.ROOK_TYPE_NAME;
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		const result = new Set();
		RookPossibleMovesCalculator.execute(
			gameState.getBoard(),
			startLine,
			startColumn,
			result,
		);
		return result;
	}
}