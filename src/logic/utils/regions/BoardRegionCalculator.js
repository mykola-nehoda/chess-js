


class BoardRegionCalculator {
	static getHomeRow( alignment, board ) {
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return 0;
			case Alignment.SecondPlayer:
				return board.getRowCount() - 1;
			default:
				throw new Error();
		}
	}
	
	static getTerritoryBottomRow( alignment, board ) {
		if ( !this.checkBoardDimensions( board ) )
			throw new Error();
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return 0;
			case Alignment.SecondPlayer:
				return board.getRowCount() - this.ALIGNMENT_TERRITORY_ROW_COUNT;
			default:
				throw new Error();
		}
	}
	
	static getTerritoryRectangle( alignment, board ) {
		return new Rectangle(
			new Coordinate( this.getTerritoryBottomRow( alignment, board ), 0 ),
			this.ALIGNMENT_TERRITORY_ROW_COUNT,
			board.getColumnCount(),
		);
	}
	
	static getCitadelBottomLeft( alignment, board ) {
		if ( !this.checkBoardDimensions( board ) )
			throw new Error();
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return new Coordinate( 0, 0 );
			case Alignment.SecondPlayer:
				return new Coordinate(
					board.getRowCount() - this.CITADEL_ROW_COUNT,
					board.getColumnCount() - this.CITADEL_COLUMN_COUNT,
				);
			default:
				throw new Error();
		}
	}
	
	static getCitadelRectangle( alignment, board ) {
		return new Rectangle(
			this.getCitadelBottomLeft( alignment, board ),
			this.CITADEL_ROW_COUNT,
			this.CITADEL_COLUMN_COUNT,
		);
	}
	
	static isCenterCol( board, col ) {
		if ( !this.checkBoardDimensions( board ) )
			throw new Error();
		const centerLeftCol = this.CENTER.getLeftColumn();
		const centreRightCol = this.CENTER.getRightColumn();
		return (
				( col >= centerLeftCol )
			&&	( col <= centreRightCol )
		);
	}
	
	static getCenter( board ) {
		if ( !this.checkBoardDimensions( board ) )
			throw new Error();
		return this.CENTER;
	}
	
	static CENTER = new Rectangle(
		new Coordinate( 3, 3 ),
		2,
		2,
	);
	
	static checkBoardDimensions( board ) {
		if ( board.getRowCount() !== 8 )
			return false;
		if ( board.getColumnCount() !== 8 )
			return false;
		return true;
	}
	
	static ALIGNMENT_TERRITORY_ROW_COUNT = 3;
	
	static CITADEL_ROW_COUNT = 2;
	
	static CITADEL_COLUMN_COUNT = 3;
}
