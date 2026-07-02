


class AvailableDeploymentCalculator {
	constructor() {
		this.normalDeploymentDestinations = new Set();
		this.colorBoundDeploymentDestinations = new Set();
	}
	
	getNormalDeploymentDestinations() {
		return this.normalDeploymentDestinations;
	}
	
	getColorBoundDeploymentDestinations() {
		return this.colorBoundDeploymentDestinations;
	}
	
	execute( gameState, alignment ) {
		this.calculateNormalDestinations( gameState.getBoard(), alignment );
		this.calculateColorBoundDestinations( gameState, alignment );
	}
	
	calculateNormalDestinations( board, alignment ) {
		for ( let col = 0; col < board.getColumnCount(); ++col ) {
			this.tryAddNormalDestination( board, alignment, col );
		}
	}
	
	calculateColorBoundDestinations( gameState, alignment ) {
		const player = gameState.getPlayer( alignment );
		const board = gameState.getBoard();
		
		let oddColorBoundUnitCount = 0;
		let evenColorBoundUnitCount = 0;
		
		let unitIterator = player.getActiveUnits();
		let unitWrapper = unitIterator.next();
		
		while( !unitWrapper.done ) {
			const unit = unitWrapper.value;
			if ( unit.getType().isColorBound() ) {
				const unitCoordinate = board.getCoordinateOfUnit( unit );
				if ( unitCoordinate.isEven() )
					++evenColorBoundUnitCount;
				else
					++oddColorBoundUnitCount;
			}
			
			unitWrapper = unitIterator.next();
		}
		
		if ( evenColorBoundUnitCount === oddColorBoundUnitCount ) {
			this.colorBoundDeploymentDestinations = this.normalDeploymentDestinations;
			return;
		}
		
		const dominatingParity = ( evenColorBoundUnitCount > oddColorBoundUnitCount )
			?	0
			:	1
		;
		for ( const coordinate of this.normalDeploymentDestinations ) {
			const parity = ( coordinate.isEven() ) ? 0 : 1;
			if ( parity !== dominatingParity ) {
				this.colorBoundDeploymentDestinations.add( coordinate );
			}
		}
	}
	
	tryAddNormalDestination(
		board,
		alignment,
		candidateCol
	) {
		const homeRow = BoardRegionCalculator.getHomeRow( alignment, board ); 
		const candidateCell = board.getCell( homeRow, candidateCol );
		if ( candidateCell.containsUnit() )
			return false;

		for ( let row = homeRow - 1; row <= homeRow + 1; ++row ) {
			for ( let col = candidateCol - 1; col <= candidateCol + 1; ++col ) {
				if ( !board.isWithin( row, col ) )
					continue;
				const cell = board.getCell( row, col );
				if ( !cell.containsUnit() )
					continue;
				const adjacentUnit = cell.getUnit();
				if ( adjacentUnit.getAlignment() !== alignment ) {
					return false;
				}
			}
		}
		
		this.normalDeploymentDestinations.add( new Coordinate( homeRow, candidateCol ) );
		return true;
	}
}
