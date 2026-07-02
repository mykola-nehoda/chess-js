


class Rectangle {
	constructor(
		bottomLeft,
		rowCount,
		columnCount,
	) {
		this.bottomLeft = bottomLeft;
		this.rowCount = rowCount;
		this.columnCount = columnCount;
	}
	
	getRowCount() {
		return this.rowCount;
	}
	
	getColumnCount() {
		return this.columnCount;
	}
	
	getBottomLeftCoordinate() {
		return this.bottomLeft;
	}
	
	getLeftColumn() {
		return this.bottomLeft.getColumn();
	}
	
	getRightColumn() {
		return this.bottomLeft.getColumn() + this.columnCount - 1;
	}
	
	getBottomRow() {
		return this.bottomLeft.getRow();
	}
	
	getTopRow() {
		return this.bottomLeft.getRow() + this.rowCount - 1;
	}
}
