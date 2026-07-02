

class ArmyUnitType {
	getName() {
		throw new Error();
	}
	
	getPossibleMoves(
		gameState,
		startLine,
		startColumn,
	) {
		throw new Error();
	}
	
	canBePromoted() {
		return false;
	}
	
	isGameCritical() {
		return false;
	}
	
	canBeRedeployed() {
		return true;
	}
	
	canCollectControlPoints() {
		return true;
	}
	
	canStopDoubleMove() {
		return false;
	}
	
	isColorBound() {
		return false;
	}
}