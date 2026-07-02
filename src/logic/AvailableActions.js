


class AvailableActions {
	constructor() {
		this.unitMoves = new Map();
		this.normalDeployments = null;
		this.colorBoundDeployments = null;
	}
	
	getUnitMoves() {
		return this.unitMoves;
	}
	
	getNormalDeployments() {
		return this.normalDeployments;
	}
	
	getColorBoundDeployments() {
		return this.colorBoundDeployments;
	}
	
	setUnitMoves( unit, moves ) {
		this.unitMoves.set( unit, moves );
	}
	
	setNormalDeployments( deployments ) {
		this.normalDeployments = deployments;
	}
	
	setColorBoundDeployments( deployments ) {
		this.colorBoundDeployments = deployments;
	}
}
