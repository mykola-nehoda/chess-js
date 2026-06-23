

class SampleBoardGenerator {
	
	static ROW_COUNT = 8;
	
	static COLUMN_COUNT = 8;

	static execute( unitTypeLibrary ) {
		const board = new Board(
			SampleBoardGenerator.ROW_COUNT,
			SampleBoardGenerator.COLUMN_COUNT,
		);
		
		this.placeFirstPlayerUnits( board, unitTypeLibrary );
		this.placeSecondPlayerUnits( board, unitTypeLibrary );
		
		return board;
	}
	
	static placeRowOfUnits( board, row, unitTypeArray, alignment ) {
		for ( let column = 0; column < unitTypeArray.length; ++column ) {
			board.placeNewUnit(
				new ArmyUnit( unitTypeArray[column], alignment ),
				row,
				column,
			);
		}
	}
	
	static placeRowOfSameUnits( board, row, unitType, alignment ) {
		for ( let column = 0; column < board.getColumnCount(); ++column ) {
			board.placeNewUnit(
				new ArmyUnit( unitType, alignment ),
				row,
				column,
			);
		}
	}
	
	static placeFirstPlayerUnits( board, unitTypeLibrary ) {
		
		const pawnType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.PAWN_TYPE_NAME );
		const knightType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KNIGHT_TYPE_NAME );
		const bishopType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.BISHOP_TYPE_NAME );
		const rookType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.ROOK_TYPE_NAME );
		const queenType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.QUEEN_TYPE_NAME );
		const kingType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KING_TYPE_NAME );
		
		const firstPlayerRow = 0;
		
		this.placeRowOfSameUnits(
			board,
			firstPlayerRow + 1,
			pawnType,
			Alignment.FirstPlayer,
		);
		
		const unitTypeArray = [
			knightType,
			kingType,
			rookType,
			knightType,
			bishopType,
			bishopType,
			rookType,
			queenType,
		];
		
		this.placeRowOfUnits(
			board,
			firstPlayerRow,
			unitTypeArray,
			Alignment.FirstPlayer,
		);
	}
	
	static placeSecondPlayerUnits( board, unitTypeLibrary ) {
		
		const pawnType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.PAWN_TYPE_NAME );
		const knightType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KNIGHT_TYPE_NAME );
		const bishopType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.BISHOP_TYPE_NAME );
		const rookType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.ROOK_TYPE_NAME );
		const queenType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.QUEEN_TYPE_NAME );
		const kingType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KING_TYPE_NAME );
		
		const secondPlayerRow = ( SampleBoardGenerator.ROW_COUNT - 1 );

		this.placeRowOfSameUnits(
			board,
			secondPlayerRow - 1,
			pawnType,
			Alignment.SecondPlayer,
		);
		
		const unitTypeArray = [
			rookType,
			rookType,
			bishopType,
			queenType,
			knightType,
			bishopType,
			kingType,
			knightType,
		];
		
		this.placeRowOfUnits(
			board,
			secondPlayerRow,
			unitTypeArray,
			Alignment.SecondPlayer,
		);
	}
}