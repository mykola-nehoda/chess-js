
class UIOverlay {
	constructor() {
		this.turnText       = document.getElementById( "turn-text" );
		this.turnNumber     = document.getElementById( "turn-number" );
		this.playerDot      = document.getElementById( "player-dot" );
		this.gameOverPanel  = document.getElementById( "game-over-panel" );
		this.gameOverText   = document.getElementById( "game-over-text" );
		this.newGameButton  = document.getElementById( "new-game-button" );
		this.capturedWhite  = document.getElementById( "captured-white" );
		this.capturedBlack  = document.getElementById( "captured-black" );
		this.disconnectPanel = document.getElementById( "disconnect-panel-overlay" );
		this.disconnectTimer = document.getElementById( "disconnect-timer" );

		this.capturedPieces = { white: [], black: [] };

		this.pieceSymbols = {};
		this.pieceSymbols[ ArmyUnitTypeNames.KING_TYPE_NAME ]   = { white: "\u2654", black: "\u265A" };
		this.pieceSymbols[ ArmyUnitTypeNames.QUEEN_TYPE_NAME ]  = { white: "\u2655", black: "\u265B" };
		this.pieceSymbols[ ArmyUnitTypeNames.ROOK_TYPE_NAME ]   = { white: "\u2656", black: "\u265C" };
		this.pieceSymbols[ ArmyUnitTypeNames.BISHOP_TYPE_NAME ] = { white: "\u2657", black: "\u265D" };
		this.pieceSymbols[ ArmyUnitTypeNames.KNIGHT_TYPE_NAME ] = { white: "\u2658", black: "\u265E" };
		this.pieceSymbols[ ArmyUnitTypeNames.PAWN_TYPE_NAME ]   = { white: "\u2659", black: "\u265F" };

		this.onNewGame = null;
		this.onGiveUp  = null;
		this._disconnectCountdown = null;

		this._setupButtons();
	}

	_setupButtons() {
		this.newGameButton.addEventListener( "click", () => {
			if ( this.onNewGame ) this.onNewGame();
		});

		document.getElementById( "btn-give-up" ).addEventListener( "click", () => {
			if ( this.onGiveUp ) this.onGiveUp();
		});
	}

	updateTurnIndicator( alignment, turnNumber ) {
		const isFirst = ( alignment === Alignment.FirstPlayer );
		this.turnText.textContent   = isFirst ? "White's Turn" : "Black's Turn";
		this.turnNumber.textContent = "Turn " + turnNumber;
		this.playerDot.className    = "player-dot " + ( isFirst ? "white-dot" : "black-dot" );
	}

	showGameOver( winnerAlignment ) {
		const isFirst = ( winnerAlignment === Alignment.FirstPlayer );
		this.gameOverText.textContent = ( isFirst ? "White" : "Black" ) + " Wins!";
		this.gameOverPanel.classList.remove( "hidden" );
		this.gameOverPanel.classList.add( "show" );
	}

	addCapturedPiece( unit ) {
		const typeName  = unit.getType().getName();
		const isFirst   = ( unit.getAlignment() === Alignment.FirstPlayer );
		const key       = isFirst ? "white" : "black";
		const symbols   = this.pieceSymbols[ typeName ];
		if ( !symbols ) return;

		if ( isFirst ) {
			this.capturedPieces.white.push( symbols[ key ] );
			this._renderCaptured( this.capturedWhite, this.capturedPieces.white );
		} else {
			this.capturedPieces.black.push( symbols[ key ] );
			this._renderCaptured( this.capturedBlack, this.capturedPieces.black );
		}
	}

	_renderCaptured( container, pieces ) {
		container.textContent = "";
		for ( const symbol of pieces ) {
			const span = document.createElement( "span" );
			span.className   = "captured-piece";
			span.textContent = symbol;
			container.appendChild( span );
		}
	}

	// ─── Disconnect Panel ─────────────────────────────────────

	showDisconnected( timeoutSeconds = 60 ) {
		this.disconnectPanel.classList.remove( "hidden" );
		this.disconnectPanel.classList.add( "show" );

		let remaining = timeoutSeconds;
		this._updateTimer( remaining );

		this._disconnectCountdown = setInterval( () => {
			remaining--;
			this._updateTimer( remaining );
			if ( remaining <= 0 ) this.hideDisconnected();
		}, 1000 );
	}

	hideDisconnected() {
		if ( this._disconnectCountdown ) {
			clearInterval( this._disconnectCountdown );
			this._disconnectCountdown = null;
		}
		this.disconnectPanel.classList.remove( "show" );
		this.disconnectPanel.classList.add( "hidden" );
	}

	_updateTimer( seconds ) {
		if ( this.disconnectTimer ) {
			this.disconnectTimer.textContent = seconds + "s";
		}
	}

	// ─── Reset ───────────────────────────────────────────────

	reset() {
		this.capturedPieces = { white: [], black: [] };
		this.capturedWhite.textContent = "";
		this.capturedBlack.textContent = "";
		this.gameOverPanel.classList.add( "hidden" );
		this.gameOverPanel.classList.remove( "show" );
		this.hideDisconnected();
		this.updateTurnIndicator( Alignment.FirstPlayer, 1 );
	}
}
