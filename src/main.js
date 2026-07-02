

// ─── Game Application Entry Point ───

class ChessApp {
	constructor() {
		this.unitTypeLibrary = null;
		this.gameManager     = null;

		this.chessScene      = null;
		this.boardRenderer   = null;
		this.pieceRenderer   = null;
		this.animationManager = null;
		this.inputHandler    = null;
		this.uiOverlay       = null;
		this.lobbyUI         = null;

		this.networkClient   = null;
		this.unitRegistry    = null;
		this.isOnlineGame    = false;
	}

	// ─── Initialization ───────────────────────────────────────────

	init() {
		this.chessScene = new ChessScene( "renderCanvas" );
		const scene     = this.chessScene.getScene();
		const glow      = this.chessScene.getGlowLayer();

		this.boardRenderer    = new BoardRenderer( scene, glow );
		this.pieceRenderer    = new PieceRenderer( scene );
		this.animationManager = new AnimationManager( scene );
		this.uiOverlay        = new UIOverlay();
		this.lobbyUI          = new LobbyUI();
		this.unitRegistry     = new UnitIdRegistry();

		this._wireLobbyCallbacks();
		this._wireUICallbacks();

		this.lobbyUI.show();
		this.chessScene.startRenderLoop();
	}

	// ─── Lobby callbacks ──────────────────────────────────────────

	_wireLobbyCallbacks() {
		this.lobbyUI.onLocalGame = () => {
			this.isOnlineGame = false;
			this._disconnectNetwork();
			this.lobbyUI.hide();

			// Resolve color and handicap from the lobby selection
			const colorChoice     = this.lobbyUI.getSelectedColor();
			const handicapEnabled = this.lobbyUI.isHandicapEnabled();

			let viewAlignment;
			if ( colorChoice === "white" ) {
				viewAlignment = "First Player";
			} else if ( colorChoice === "black" ) {
				viewAlignment = "Second Player";
			} else {
				// Random
				viewAlignment = Math.random() < 0.5 ? "First Player" : "Second Player";
			}

			// Handicap: the host (local chosen color) gives up their queen
			let handicapAlignment = null;
			if ( handicapEnabled ) {
				handicapAlignment =
					( viewAlignment === "First Player" )
					? Alignment.FirstPlayer
					: Alignment.SecondPlayer;
			}

			this.startNewGame( null, handicapAlignment );
		};

		this.lobbyUI.onCreateGame = async () => {
			try {
				this.lobbyUI.showConnecting();
				await this._connectNetwork();
				this.networkClient.onRoomCreated = ( code ) => {
					this.lobbyUI.showWaiting( code );
				};
				this.networkClient.onGameStart = ( alignment ) => {
					this.lobbyUI.hide();
					this._startOnlineGame( alignment );
				};
				this.networkClient.onError = ( msg ) => {
					this.lobbyUI.showError( msg );
				};
				this.networkClient.createRoom();
			} catch ( e ) {
				this.lobbyUI.showError( "Cannot connect to server. Check your connection." );
			}
		};

		this.lobbyUI.onJoinGame = async ( code ) => {
			try {
				this.lobbyUI.showConnecting();
				await this._connectNetwork();
				this.networkClient.onGameStart = ( alignment ) => {
					this.lobbyUI.hide();
					this._startOnlineGame( alignment );
				};
				this.networkClient.onError = ( msg ) => {
					this.lobbyUI.showError( msg );
					this.lobbyUI._showPanel( this.lobbyUI.panelOnline );
				};
				this.networkClient.joinRoom( code );
			} catch ( e ) {
				this.lobbyUI.showError( "Cannot connect to server. Check your connection." );
			}
		};
	}

	_wireUICallbacks() {
		this.uiOverlay.onNewGame = () => {
			this._disconnectNetwork();
			this.lobbyUI.show();
		};

		this.uiOverlay.onGiveUp = () => {
			if ( this.networkClient ) {
				this.networkClient.giveUp();
			}
			const localAlignment = this.networkClient ? this.networkClient.myAlignment : null;
			const winnerAlignment = localAlignment === "First Player"
				? Alignment.SecondPlayer
				: Alignment.FirstPlayer;

			this.uiOverlay.hideDisconnected();
			this.uiOverlay.showGameOver( winnerAlignment );
			this._disconnectNetwork();
		};
	}

	// ─── Game Lifecycle ───────────────────────────────────────────

	startNewGame( localAlignment, handicapAlignment = null ) {
		// Orient the board: always put the local player's pieces at the bottom.
		const viewAlignment = localAlignment !== null ? localAlignment : "First Player";
		this.chessScene.setCameraForAlignment( viewAlignment );

		if ( this.inputHandler ) {
			this.inputHandler.reset();
			this.inputHandler = null;
		}

		this.pieceRenderer.clearAllPieces();
		this.boardRenderer.clearHighlights();
		this.boardRenderer.clearLastMoveHighlights();

		this.unitTypeLibrary = UnitTypeLibraryGenerator.execute();

		// Build game state (includes new starting position, reserves, and Black's 1 VP head-start)
		const gameState = SampleGameStateGenerator.execute( this.unitTypeLibrary, handicapAlignment );
		this.gameManager = SampleGameManagerGenerator.execute( this.unitTypeLibrary, gameState );

		// Draw VP flags on board squares (called once per game)
		this.boardRenderer.createCPFlags( gameState.getBoard() );

		this._spawnAllPieces();
		this.uiOverlay.reset();

		// Initialize reserve display and VP
		this.uiOverlay.updateReserve( gameState );
		this.uiOverlay.updateVictoryPoints( gameState );

		// Register unit IDs for network play
		if ( localAlignment !== null ) {
			this.unitRegistry.registerAll( this.gameManager.getGameState().getBoard() );
		} else {
			this.unitRegistry.clear();
		}

		this.inputHandler = new InputHandler(
			this.chessScene.getScene(),
			this.boardRenderer,
			this.pieceRenderer,
			this.gameManager,
			this.animationManager,
			this.uiOverlay,
		);

		if ( localAlignment !== null ) {
			const alignment = localAlignment === "First Player"
				? Alignment.FirstPlayer
				: Alignment.SecondPlayer;

			this.inputHandler.localAlignment = alignment;
			this.inputHandler.networkClient  = this.networkClient;
			this.inputHandler.unitRegistry   = this.unitRegistry;

			this._wireNetworkGameEvents();
		}
	}

	_startOnlineGame( alignmentString ) {
		this.isOnlineGame = true;
		this.startNewGame( alignmentString );
	}

	_spawnAllPieces() {
		const board = this.gameManager.getGameState().getBoard();
		const iter  = board.getUnits();
		let   w     = iter.next();

		while ( !w.done ) {
			const unit  = w.value;
			const coord = board.getCoordinateOfUnit( unit );
			this.pieceRenderer.createPieceForUnit( unit, coord.getRow(), coord.getColumn() );
			w = iter.next();
		}
	}

	// ─── Network Game Event Wiring ────────────────────────────────

	_wireNetworkGameEvents() {
		if ( !this.networkClient ) return;

		this.networkClient.onOpponentMove = ( unitId, destRow, destCol ) => {
			if ( this.inputHandler ) {
				this.inputHandler.applyRemoteMove( unitId, destRow, destCol );
			}
		};

		this.networkClient.onOpponentDisconnected = () => {
			this.uiOverlay.showDisconnected( 60 );
		};

		this.networkClient.onOpponentReconnected = () => {
			this.uiOverlay.hideDisconnected();
		};

		this.networkClient.onOpponentGaveUp = () => {
			const localAlign = this.networkClient.myAlignment === "First Player"
				? Alignment.FirstPlayer
				: Alignment.SecondPlayer;
			this.uiOverlay.showGameOver( localAlign );
		};

		this.networkClient.onOpponentLeft = () => {
			this.uiOverlay.hideDisconnected();
			const localAlign = this.networkClient.myAlignment === "First Player"
				? Alignment.FirstPlayer
				: Alignment.SecondPlayer;
			this.uiOverlay.showGameOver( localAlign );
		};

		this.networkClient.onConnectionLost = () => {
			// Auto-reconnect is handled inside NetworkClient
		};

		this.networkClient.onReconnected = () => {
			// No UI change needed on our side
		};
	}

	// ─── Network helpers ──────────────────────────────────────────

	async _connectNetwork() {
		this._disconnectNetwork();
		this.networkClient = new NetworkClient( GameConfig.SERVER_URL );
		await this.networkClient.connect();
	}

	_disconnectNetwork() {
		if ( this.networkClient ) {
			this.networkClient.disconnect();
			this.networkClient = null;
		}
		this.isOnlineGame = false;
	}
}

// ─── Start ───

const app = new ChessApp();
app.init();