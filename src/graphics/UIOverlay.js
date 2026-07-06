class UIOverlay {
	constructor() {
		this.turnText       = document.getElementById( "turn-text" );
		this.turnNumber     = document.getElementById( "turn-number" );
		this.playerDot      = document.getElementById( "player-dot" );
		this.gameOverPanel  = document.getElementById( "game-over-panel" );
		this.gameOverText   = document.getElementById( "game-over-text" );
		this.newGameButton  = document.getElementById( "new-game-button" );
		this.disconnectPanel = document.getElementById( "disconnect-panel-overlay" );
		this.disconnectTimer = document.getElementById( "disconnect-timer" );

		// Reserve panel + toggle
		this.reservePanel   = document.getElementById( "reserve-panel" );
		this.reserveWhite   = document.getElementById( "reserve-white" );
		this.reserveBlack   = document.getElementById( "reserve-black" );
		this.reserveToggleBtn = document.getElementById( "reserve-toggle-btn" );
		this.reserveBadge   = document.getElementById( "reserve-badge" );

		// Victory point elements
		this.vpWhite        = document.getElementById( "vp-white" );
		this.vpBlack        = document.getElementById( "vp-black" );

		// Captured pieces (for pawns/kings that don't go to reserve)
		this.capturedWhite  = document.getElementById( "captured-white" );
		this.capturedBlack  = document.getElementById( "captured-black" );

		this.capturedPieces = { white: [], black: [] };

		this.pieceSymbols = {};
		this.pieceSymbols[ ArmyUnitTypeNames.KING_TYPE_NAME ]   = { white: "\u2654", black: "\u265A" };
		this.pieceSymbols[ ArmyUnitTypeNames.QUEEN_TYPE_NAME ]  = { white: "\u2655", black: "\u265B" };
		this.pieceSymbols[ ArmyUnitTypeNames.ROOK_TYPE_NAME ]   = { white: "\u2656", black: "\u265C" };
		this.pieceSymbols[ ArmyUnitTypeNames.BISHOP_TYPE_NAME ] = { white: "\u2657", black: "\u265D" };
		this.pieceSymbols[ ArmyUnitTypeNames.KNIGHT_TYPE_NAME ] = { white: "\u2658", black: "\u265E" };
		this.pieceSymbols[ ArmyUnitTypeNames.PAWN_TYPE_NAME ]   = { white: "\u2659", black: "\u265F" };

		this.onNewGame  = null;
		this.onGiveUp   = null;
		this.onReservePieceClick = null;

		this._disconnectCountdown = null;
		this._selectedReserveEl   = null;

		this._setupButtons();
		this._setupReserveToggle();
	}

	_setupButtons() {
		this.newGameButton.addEventListener( "click", () => {
			if ( this.onNewGame ) this.onNewGame();
		});

		document.getElementById( "btn-give-up" ).addEventListener( "click", () => {
			if ( this.onGiveUp ) this.onGiveUp();
		});
	}

	// ─── Reserve Toggle (compact mode) ────────────────────────────

	_setupReserveToggle() {
		if ( !this.reserveToggleBtn || !this.reservePanel ) return;

		this.reserveToggleBtn.addEventListener( "click", ( e ) => {
			e.stopPropagation();
			const open = this.reservePanel.classList.toggle( "panel-open" );
			this.reserveToggleBtn.classList.toggle( "active", open );
		});

		// Close when clicking outside the panel or toggle button
		document.addEventListener( "click", ( e ) => {
			if (
				this.reservePanel.classList.contains( "panel-open" ) &&
				!this.reservePanel.contains( e.target ) &&
				e.target !== this.reserveToggleBtn
			) {
				this.reservePanel.classList.remove( "panel-open" );
				this.reserveToggleBtn.classList.remove( "active" );
			}
		});
	}

	updateReserveBadge( gameState ) {
		if ( !this.reserveBadge ) return;
		const p1 = gameState.getPlayer( Alignment.FirstPlayer ).getReserveSize();
		const p2 = gameState.getPlayer( Alignment.SecondPlayer ).getReserveSize();
		const total = p1 + p2;
		this.reserveBadge.textContent = total > 0 ? String( total ) : "";
	}


	updateTurnIndicator( alignment, turnNumber ) {
		const isFirst = ( alignment === Alignment.FirstPlayer );
		this.turnText.textContent   = isFirst ? "White's Turn" : "Black's Turn";
		this.turnNumber.textContent = "Turn " + turnNumber;
		this.playerDot.className    = "player-dot " + ( isFirst ? "white-dot" : "black-dot" );
	}

	// ─── Victory Points ───────────────────────────────────────────

	updateVictoryPoints( gameState ) {
		const firstPlayer  = gameState.getPlayer( Alignment.FirstPlayer );
		const secondPlayer = gameState.getPlayer( Alignment.SecondPlayer );
		if ( this.vpWhite ) this.vpWhite.textContent = firstPlayer.getControlPoints() + " VP";
		if ( this.vpBlack ) this.vpBlack.textContent = secondPlayer.getControlPoints() + " VP";
	}

	// ─── Reserve Panels ───────────────────────────────────────────

	updateReserve( gameState ) {
		const firstPlayer  = gameState.getPlayer( Alignment.FirstPlayer );
		const secondPlayer = gameState.getPlayer( Alignment.SecondPlayer );
		const activeAlign  = gameState.getActivePlayerAlignment();

		this._renderReserveSide(
			this.reserveWhite,
			firstPlayer,
			Alignment.FirstPlayer,
			activeAlign,
		);
		this._renderReserveSide(
			this.reserveBlack,
			secondPlayer,
			Alignment.SecondPlayer,
			activeAlign,
		);

		// Keep the compact-mode toggle badge in sync
		this.updateReserveBadge( gameState );
	}

	_renderReserveSide( container, player, alignment, activeAlignment ) {
		container.textContent = "";
		const reserveSize = player.getReserveSize();
		const isActive    = ( alignment === activeAlignment );

		if ( reserveSize === 0 ) {
			const empty = document.createElement( "span" );
			empty.className   = "reserve-empty";
			empty.textContent = "—";
			container.appendChild( empty );
			return;
		}

		for ( let i = 0; i < reserveSize; ++i ) {
			const unit     = player.getUnitFromReserveByIndex( i );
			const typeName = unit.getType().getName();
			const symbols  = this.pieceSymbols[ typeName ];
			if ( !symbols ) continue;

			const isFirst = ( alignment === Alignment.FirstPlayer );
			const symbol  = isFirst ? symbols.white : symbols.black;

			const btn = document.createElement( "button" );
			btn.className   = "reserve-piece" + ( isActive ? " reserve-piece-active" : "" );
			btn.textContent = symbol;
			btn.title       = typeName.charAt(0).toUpperCase() + typeName.slice(1);
			btn.dataset.idx = String( i );

			if ( isActive ) {
				btn.addEventListener( "click", ( e ) => {
					e.stopPropagation();
					if ( this.onReservePieceClick ) {
						this.onReservePieceClick( unit );
					}
				});
			}

			container.appendChild( btn );
		}
	}

	highlightReserveUnit( unit ) {
		this.clearReserveHighlight();

		// Find the button element for this unit across both panels
		const allBtns = document.querySelectorAll( ".reserve-piece" );
		allBtns.forEach( ( btn ) => {
			// We identify by position in the parent — match via closure in _renderReserveSide
			// The simplest reliable way: store a reference when building
		});
		// Reserve buttons are rebuilt on every updateReserve, so we mark the selected unit
		// on the container for CSS targeting via a data attribute
		if ( unit.getAlignment() === Alignment.FirstPlayer ) {
			if ( this.reserveWhite ) this.reserveWhite.dataset.selectedIdx = "";
		} else {
			if ( this.reserveBlack ) this.reserveBlack.dataset.selectedIdx = "";
		}
	}

	clearReserveHighlight() {
		document.querySelectorAll( ".reserve-piece.reserve-piece-selected" ).forEach( ( el ) => {
			el.classList.remove( "reserve-piece-selected" );
		});
	}

	// ─── Captured pieces (pawns / kings) ─────────────────────────

	addCapturedPiece( unit ) {
		// Only show truly non-redeployable pieces (pawns and kings)
		if ( unit.getType().canBeRedeployed() ) return;
		if ( unit.isPromoted() ) return; // promoted queens also get captured but skip reserve

		const typeName = unit.getType().getName();
		const isFirst  = ( unit.getAlignment() === Alignment.FirstPlayer );
		const key      = isFirst ? "white" : "black";
		const symbols  = this.pieceSymbols[ typeName ];
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

	// ─── Game Over ────────────────────────────────────────────────

	showGameOver( winnerAlignment ) {
		const isFirst = ( winnerAlignment === Alignment.FirstPlayer );
		this.gameOverText.textContent = ( isFirst ? "White" : "Black" ) + " Wins!";
		this.gameOverPanel.classList.remove( "hidden" );
		this.gameOverPanel.classList.add( "show" );
	}

	// ─── Disconnect Panel ─────────────────────────────────────────

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

	// ─── Reset ───────────────────────────────────────────────────

	reset() {
		this.capturedPieces = { white: [], black: [] };
		if ( this.capturedWhite ) this.capturedWhite.textContent = "";
		if ( this.capturedBlack ) this.capturedBlack.textContent = "";
		if ( this.reserveWhite )  this.reserveWhite.textContent  = "";
		if ( this.reserveBlack )  this.reserveBlack.textContent  = "";
		if ( this.vpWhite )       this.vpWhite.textContent       = "0 VP";
		if ( this.vpBlack )       this.vpBlack.textContent       = "1 VP";
		this.gameOverPanel.classList.add( "hidden" );
		this.gameOverPanel.classList.remove( "show" );
		this.hideDisconnected();
		this.updateTurnIndicator( Alignment.FirstPlayer, 1 );
		this._selectedReserveEl = null;
	}
}
