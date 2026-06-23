class SampleGameManagerGenerator {
	static execute( unitTypeLibrary ) {
		const board = SampleBoardGenerator.execute( unitTypeLibrary );
		
		const gameState = new GameState( board );
		const gameManager = new GameManager( gameState );
		gameManager.setTurnLimit( SampleGameManagerGenerator.TURN_LIMIT );
		gameManager.setUnitTypeLibrary( unitTypeLibrary );
		
		//console.log( gameManager );
		
		return gameManager;
	}
	
	static TURN_LIMIT = 80;
}