


class GameState {
	constructor( board ) {
		this.board = board;
		this.turnCounter = 1;
		this.initPlayers();
		this.activePlayerAlignment = Alignment.FirstPlayer;
		this.winner = null;
	}
	
	initPlayers() {
		this.players = new Map();
		this.players.set(
			Alignment.FirstPlayer,
			new Player( Alignment.FirstPlayer ),
		);
		this.players.set(
			Alignment.SecondPlayer,
			new Player( Alignment.SecondPlayer ),
		);
		
		let unitIterator = this.board.getUnits();
		let unitWrapper = unitIterator.next();
		
		while( !unitWrapper.done ) {
			let unit = unitWrapper.value;
			this.players.get( unit.getAlignment() ).addActiveUnit( unit );
			unitWrapper = unitIterator.next();
		}
	}
	
	getBoard() {
		return this.board;
	}
	
	getCurrentTurn() {
		return this.turnCounter;
	}
	
	incrementTurnCounter() {
		++this.turnCounter;
	}
	
	getPlayer( alignment ) {
		return this.players.get( alignment );
	}
	
	getActivePlayerAlignment() {
		return this.activePlayerAlignment;
	}
	
	switchActivePlayer() {
		this.activePlayerAlignment =
			Alignment.getOpposite( this.activePlayerAlignment );
	}
	
	isWinnerDecided() {
		return this.winner !== null;
	}
	
	getWinner() {
		return this.winner;
	}
	
	setWinner( alignment ) {
		this.winner = this.getPlayer( alignment );
	}
	
	deployUnit( unit, row, column ) {
		const player = this.players.get( unit.getAlignment() );
		player.removeUnitFromReserve( unit );
		this.placeNewUnit( unit, row, column );
	}
	
	placeNewUnit( newUnit, row, column ) {
		const player = this.players.get( newUnit.getAlignment() );
		player.addActiveUnit( newUnit );
		this.board.placeNewUnit( newUnit, row, column );
	}
	
	removeUnitFromBoard( unit ) {
		const player = this.players.get( unit.getAlignment() );
		player.removeActiveUnit( unit );
		this.board.removeUnit( unit );
	}
}