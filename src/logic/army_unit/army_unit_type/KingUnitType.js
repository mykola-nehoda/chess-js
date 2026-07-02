


class KingUnitType extends ArmyUnitType {
	getName() {
		return ArmyUnitTypeNames.KING_TYPE_NAME;
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		const result = new Set();
		KingPossibleMovesCalculator.execute(
			gameState.getBoard(),
			startLine,
			startColumn,
			result,
		);
		return result;
	}
	
	isGameCritical() {
		return true;
	}
	
	canBeRedeployed() {
		return false;
	}
	
	canCollectControlPoints() {
		return false;
	}
}