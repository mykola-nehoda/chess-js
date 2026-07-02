


class Coordinate {
	
	constructor( row, column ) {
		this.row = row;
		this.column = column;
	}
	
	getRow() {
		return this.row;
	}
	
	getColumn() {
		return this.column;
	}
	
	isEven() {
		const sum = this.row + this.column;
		return ( ( sum & 1 ) === 0 );
	}
	
	static areEqual( coordinate1, coordinate2 ) {
		if ( coordinate1.getRow() !== coordinate2.getRow() )
			return false;
		return ( coordinate1.getColumn() === coordinate2.getColumn() );
	}
	
	static compare( coordinate1, coordinate2 ) {
		if ( coordinate1.getRow() !== coordinate2.getRow() )
			return coordinate2.getRow() - coordinate1.getRow();
		if ( coordinate1.getColumn() !== coordinate2.getColumn() )
			return coordinate2.getColumn() - coordinate1.getColumn();
		return 0;
	}
}