

class TextGridToCoordinateSetConverter {
	constructor(
		inputGrid,
		board,
	) {
		this.inputGrid = inputGrid;
		this.board = board;
		this.resultSet = new Set();
	}
	
	execute() {
		const lineCount = this.inputGrid.length;
		const columnCount = this.inputGrid[0].length;
		
		for ( let line = 0; line < lineCount; ++line ) {
			for ( let column = 0; column < columnCount; ++column ) {
				this.processCell( line, column );
			}
		}
		
		return this.resultSet;
	}
	
	processCell( inputLine, inputColumn ) {
		const adjustedLine = TextGridCoordinateAdjuster.adjustLine( inputLine, this.board );
		const adjustedColumn = TextGridCoordinateAdjuster.adjustColumn( inputColumn, this.board );
		
		if ( TextGridToCoordinateSetConverter.shouldAddCoordinate( this.inputGrid[inputLine][inputColumn] ) )
			this.resultSet.add( new Coordinate( adjustedLine, adjustedColumn ) );
	}
	
	static shouldAddCoordinate( textInput ) {
		switch ( textInput ) {
			case 'X':
				return true;
			case '_':
				return false;
			default:
				throw new Error();
		}
	}
}