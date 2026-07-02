

class SampleGameStateGenerator {
	static execute( unitTypeLibrary, handicapAlignment = null ) {
		const board = SampleBoardGenerator.execute();
		
		this.placeFirstPlayerUnits( board, unitTypeLibrary );
		this.placeSecondPlayerUnits( board, unitTypeLibrary );
		
		// Apply handicap: remove the queen of the handicapped side before GameState creation
		if ( handicapAlignment !== null ) {
			this.applyQueenHandicap( board, unitTypeLibrary, handicapAlignment );
		}
		
		const gameState = new GameState( board );

		const knightType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KNIGHT_TYPE_NAME );
		gameState.getPlayer( Alignment.FirstPlayer ).addUnitToReserve(
			new ArmyUnit( knightType, Alignment.FirstPlayer, false )
		);
		gameState.getPlayer( Alignment.SecondPlayer ).addUnitToReserve(
			new ArmyUnit( knightType, Alignment.SecondPlayer, false )
		);
		
		// Black starts with 1 control point
		gameState.getPlayer( Alignment.SecondPlayer ).collectControlPoints(
			this.SECOND_PLAYER_STARTING_CONTROL_POINTS
		);
		
		return gameState;
	}
	
	static applyQueenHandicap( board, unitTypeLibrary, handicapAlignment ) {
		const queenTypeName = ArmyUnitTypeNames.QUEEN_TYPE_NAME;
		const unitIterator = board.getUnits();
		let wrapper = unitIterator.next();
		while ( !wrapper.done ) {
			const unit = wrapper.value;
			if (
				unit.getAlignment() === handicapAlignment &&
				unit.getType().getName() === queenTypeName
			) {
				board.removeUnit( unit );
				return;
			}
			wrapper = unitIterator.next();
		}
	}
	
	static placeRowOfUnits( board, row, unitTypeArray, alignment ) {
		for ( let column = 0; column < unitTypeArray.length; ++column ) {
			if ( unitTypeArray[column] === null )
				continue;

			board.placeNewUnit(
				new ArmyUnit( unitTypeArray[column], alignment, false ),
				row,
				column,
			);
		}
	}
	
	static placeRowOfSameUnits( board, row, unitType, alignment ) {
		for ( let column = 0; column < board.getColumnCount(); ++column ) {
			board.placeNewUnit(
				new ArmyUnit( unitType, alignment, false ),
				row,
				column,
			);
		}
	}
	
	static placeFirstPlayerUnits( board, unitTypeLibrary ) {
		
		const pawnType   = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.PAWN_TYPE_NAME );
		const knightType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KNIGHT_TYPE_NAME );
		const bishopType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.BISHOP_TYPE_NAME );
		const rookType   = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.ROOK_TYPE_NAME );
		const queenType  = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.QUEEN_TYPE_NAME );
		const kingType   = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KING_TYPE_NAME );
		
		const firstPlayerRow = 0;
		
		this.placeRowOfSameUnits(
			board,
			firstPlayerRow + 1,
			pawnType,
			Alignment.FirstPlayer,
		);
		
		// col 0 = null (Knight goes to reserve), then King, Rook, Knight, Bishop, Bishop, Rook, Queen
		const unitTypeArray = [
			null,
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
		
		const pawnType   = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.PAWN_TYPE_NAME );
		const knightType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KNIGHT_TYPE_NAME );
		const bishopType = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.BISHOP_TYPE_NAME );
		const rookType   = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.ROOK_TYPE_NAME );
		const queenType  = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.QUEEN_TYPE_NAME );
		const kingType   = unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.KING_TYPE_NAME );
		
		const secondPlayerRow = ( SampleBoardGenerator.ROW_COUNT - 1 );

		this.placeRowOfSameUnits(
			board,
			secondPlayerRow - 1,
			pawnType,
			Alignment.SecondPlayer,
		);
		
		// col 7 = null (Knight goes to reserve): Rook, Rook, Bishop, Queen, Knight, Bishop, King, null
		const unitTypeArray = [
			rookType,
			rookType,
			bishopType,
			queenType,
			knightType,
			bishopType,
			kingType,
			null,
		];
		
		this.placeRowOfUnits(
			board,
			secondPlayerRow,
			unitTypeArray,
			Alignment.SecondPlayer,
		);
	}
	
	static SECOND_PLAYER_STARTING_CONTROL_POINTS = 1;
}
