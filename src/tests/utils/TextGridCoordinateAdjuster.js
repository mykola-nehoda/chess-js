class TextGridCoordinateAdjuster {
	static adjustLine( line, board ) {
		return ( board.getRowCount() - 1 ) - line;
	}
	
	static adjustColumn( column, board ) {
		return column;
	}
}