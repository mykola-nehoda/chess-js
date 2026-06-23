

class TextGridToBoardConverter {
	constructor(
		inputGrid,
		unitTypeLibrary,
		subjectUnitType,
		subjectAlignment,
	) {
		this.inputGrid = inputGrid;
		this.board = null;
		this.unitTypeLibrary = unitTypeLibrary;
		this.subjectUnitType = subjectUnitType;
		this.subjectAlignment = subjectAlignment;
		this.rookType = this.unitTypeLibrary.getTypeByName( ArmyUnitTypeNames.ROOK_TYPE_NAME );
	}
	
	execute() {
		const lineCount = this.inputGrid.length;
		const columnCount = this.inputGrid[0].length;
		
		this.board = new Board( lineCount, columnCount );
		
		for ( let line = 0; line < lineCount; ++line ) {
			for ( let column = 0; column < columnCount; ++column ) {
				this.processCell( line, column );
			}
		}
		
		return this.board;
	}
	
	processCell( inputLine, inputColumn ) {
		const adjustedLine = TextGridCoordinateAdjuster.adjustLine( inputLine, this.board );
		const adjustedColumn = TextGridCoordinateAdjuster.adjustColumn( inputColumn, this.board );
		
		const newArmyUnit =
			this.createNewUnit( this.inputGrid[inputLine][inputColumn] );
		
		if ( newArmyUnit === null )
			return;

		this.board.placeNewUnit(
			newArmyUnit,
			adjustedLine,
			adjustedColumn,
		);
	}
	
	createNewUnit( textInput ) {
		switch ( textInput ) {
			case 'S':
				return new ArmyUnit(
					this.subjectUnitType,
					this.subjectAlignment,
				);
			case 'F':
				return new ArmyUnit(
					this.rookType,
					this.subjectAlignment,
				);
			case 'E':
				return new ArmyUnit(
					this.rookType,
					Alignment.getOpposite( this.subjectAlignment ),
				);
			case '_':
				return null;
			default:
				throw new Error();
		}
	}
}