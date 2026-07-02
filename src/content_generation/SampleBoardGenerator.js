

class SampleBoardGenerator {
	
	static ROW_COUNT = 8;
	
	static COLUMN_COUNT = 8;

	static execute() {
		const board = new Board(
			SampleBoardGenerator.ROW_COUNT,
			SampleBoardGenerator.COLUMN_COUNT,
		);
		
		this.setCenterIncomes( board );
		this.setAlignmentIncomes( board, Alignment.FirstPlayer );
		this.setAlignmentIncomes( board, Alignment.SecondPlayer );
		
		return board;
	}
	
	static setCenterIncomes( board ) {
		const CENTER = BoardRegionCalculator.getCenter( board );
		this.setRectangleIncomes(
			board,
			CENTER,
			Alignment.FirstPlayer,
			this.CENTER_CONTROL_POINT_INCOME
		);
		this.setRectangleIncomes(
			board,
			CENTER,
			Alignment.SecondPlayer,
			this.CENTER_CONTROL_POINT_INCOME
		);
	}
	
	static setRectangleIncomes(
		board,
		rectangle,
		alignment,
		newControlPointIncome,
	) {
		const leftCol  = rectangle.getLeftColumn();
		const rightCol = rectangle.getRightColumn();
		
		const bottomRow = rectangle.getBottomRow();
		const topRow    = rectangle.getTopRow();
		
		for ( let row = bottomRow; row <= topRow; ++row ) {
			for ( let col = leftCol; col <= rightCol; ++col ) {
				const cell = board.getCell( row, col );
				cell.setControlPointIncome( alignment, newControlPointIncome );
			}
		}
	}
	
	static setAlignmentIncomes( board, alignment ) {
		const opponentAlignment = Alignment.getOpposite( alignment );

		const opponentTerritoryRectangle =
			BoardRegionCalculator.getTerritoryRectangle( opponentAlignment, board );
		this.setRectangleIncomes(
			board,
			opponentTerritoryRectangle,
			alignment,
			this.TERRITORY_CONTROL_POINT_INCOME,
		);
		
		const opponentCitadelRectangle =
			BoardRegionCalculator.getCitadelRectangle( opponentAlignment, board );
		this.setRectangleIncomes(
			board,
			opponentCitadelRectangle,
			alignment,
			this.CITADEL_CONTROL_POINT_INCOME,
		);
	}
	
	static CENTER_CONTROL_POINT_INCOME = 2;
	
	static TERRITORY_CONTROL_POINT_INCOME = 4;
	
	static CITADEL_CONTROL_POINT_INCOME = 6;
}