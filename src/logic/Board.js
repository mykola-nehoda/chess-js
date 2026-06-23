
class Board {
	constructor( rowCount, columnCount ) {
		this.grid = new Array( rowCount );
		for ( let row = 0; row < rowCount; ++row ) {
			this.grid[row] = new Array( columnCount );
			for ( let column = 0; column < columnCount; ++column ) {
				this.grid[row][column] = new Cell();
			}
		}
		this.unitToCoordinateMap = new Map();
	}
	
	getRowCount() {
		return this.grid.length;
	}
	
	getColumnCount() {
		return this.grid[0].length;
	}
	
	isWithin( row, column ) {
		if ( row < 0 )
			return false;
		if ( column < 0 )
			return false;
		if ( row >= this.getRowCount() )
			return false;
		if ( column >= this.getColumnCount() )
			return false;
		return true;
	}
	
	getCell( row, column ) {
		if ( !this.isWithin( row, column ) )
		{
			console.log( this );
			console.log( row );
			console.log( column );
			throw new Error();
		}
		return this.grid[row][column];
	}
	
	getUnits() {
		return this.unitToCoordinateMap.keys();
	}
	
	getCoordinateOfUnit( unit ) {
		return this.unitToCoordinateMap.get( unit );
	}
	
	placeNewUnit( newUnit, row, column ) {
		const cell = this.getCell( row, column );
		if ( cell.containsUnit() )
			this.removeUnit( cell.getUnit() );
		cell.setUnit( newUnit );
		this.unitToCoordinateMap.set(
			newUnit,
			new Coordinate( row, column ),
		);
	}
	
	removeUnit( unit ) {
		const coordinate = this.getCoordinateOfUnit( unit );
		const cell = this.getCell( coordinate.getRow(), coordinate.getColumn() );
		cell.setUnit( null );
		this.unitToCoordinateMap.delete( unit );
	}
	
	moveUnit( movingUnit, destinationRow, destinationColumn ) {
		const startCoordinate = this.getCoordinateOfUnit( movingUnit );
		const startCell =
			this.getCell( startCoordinate.getRow(), startCoordinate.getColumn() );
		startCell.setUnit( null );

		const destinationCell = this.grid[destinationRow][destinationColumn];
		if ( destinationCell.containsUnit() )
			this.removeUnit( destinationCell.getUnit() );
		destinationCell.setUnit( movingUnit );
		this.unitToCoordinateMap.set(
			movingUnit,
			new Coordinate( destinationRow, destinationColumn ),
		);
	}
}