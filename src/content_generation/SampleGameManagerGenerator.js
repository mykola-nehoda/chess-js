
class SampleGameManagerGenerator {
	static execute( unitTypeLibrary, gameState ) {
		const gameManager = new GameManager( gameState );
		gameManager.setTurnLimit( SampleGameManagerGenerator.TURN_LIMIT );
		gameManager.setUnitTypeLibrary( unitTypeLibrary );
		
		return gameManager;
	}
	
	static TURN_LIMIT = 80;
}