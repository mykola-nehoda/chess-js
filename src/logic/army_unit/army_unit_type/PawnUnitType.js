


class PawnUnitType extends ArmyUnitType {
	getName() {
		return ArmyUnitTypeNames.PAWN_TYPE_NAME;
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		const result = new Set();
		PawnPossibleMovesCalculator.execute(
			gameState.getBoard(),
			startLine,
			startColumn,
			result,
		);
		return result;
	}
	
	canBePromoted() {
		return true;
	}
}