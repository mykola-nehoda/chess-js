
class LobbyUI {
	constructor() {
		this.overlay     = document.getElementById( "lobby-overlay" );
		this.panelMode   = document.getElementById( "lobby-mode-select" );
		this.panelColor  = document.getElementById( "lobby-color-select" );
		this.panelOnline = document.getElementById( "lobby-online-panel" );
		this.panelWait   = document.getElementById( "lobby-waiting-panel" );
		this.panelConn   = document.getElementById( "lobby-connecting-panel" );
		this.errorText   = document.getElementById( "lobby-error-text" );
		this.codeDisplay = document.getElementById( "room-code-display" );
		this.codeInput   = document.getElementById( "room-code-input" );

		// Color / handicap state
		this._selectedColor    = "white"; // "white" | "black" | "random"
		this._handicapEnabled  = false;
		this._pendingOnline    = false;   // true if color panel was opened for online game

		// Callbacks set by app
		this.onLocalGame  = null;
		this.onCreateGame = null;
		this.onJoinGame   = null;

		this._setupEvents();
	}

	// ─── Public accessors ─────────────────────────────────────────

	getSelectedColor() {
		return this._selectedColor;
	}

	isHandicapEnabled() {
		return this._handicapEnabled;
	}

	// ─── Event setup ──────────────────────────────────────────────

	_setupEvents() {
		// Main mode buttons
		document.getElementById( "btn-local-game" ).addEventListener( "click", () => {
			this._pendingOnline = false;
			this._showPanel( this.panelColor );
			this.clearError();
		});

		document.getElementById( "btn-online-game" ).addEventListener( "click", () => {
			this._showPanel( this.panelOnline );
			this.clearError();
		});

		// Color selector buttons
		document.querySelectorAll( ".color-btn" ).forEach( ( btn ) => {
			btn.addEventListener( "click", () => {
				document.querySelectorAll( ".color-btn" ).forEach( ( b ) => b.classList.remove( "active" ) );
				btn.classList.add( "active" );
				this._selectedColor = btn.dataset.color;
			});
		});

		// Handicap checkbox
		const chkHandicap = document.getElementById( "chk-handicap" );
		if ( chkHandicap ) {
			chkHandicap.addEventListener( "change", () => {
				this._handicapEnabled = chkHandicap.checked;
			});
		}

		// Start with options (local game)
		document.getElementById( "btn-start-with-options" ).addEventListener( "click", () => {
			if ( !this._pendingOnline ) {
				if ( this.onLocalGame ) this.onLocalGame();
			}
		});

		// Back from color panel
		document.getElementById( "btn-back-color" ).addEventListener( "click", () => {
			this._showPanel( this.panelMode );
			this.clearError();
		});

		// Online sub-panel
		document.getElementById( "btn-create-room" ).addEventListener( "click", () => {
			this.clearError();
			if ( this.onCreateGame ) this.onCreateGame();
		});

		document.getElementById( "btn-join-room" ).addEventListener( "click", () => {
			const code = this.codeInput.value.trim().toUpperCase();
			if ( code.length !== 4 ) {
				this.showError( "Enter a 4-letter room code." );
				return;
			}
			this.clearError();
			if ( this.onJoinGame ) this.onJoinGame( code );
		});

		this.codeInput.addEventListener( "keydown", ( e ) => {
			if ( e.key === "Enter" ) {
				document.getElementById( "btn-join-room" ).click();
			}
		});

		this.codeInput.addEventListener( "input", () => {
			this.codeInput.value = this.codeInput.value.toUpperCase();
		});

		document.getElementById( "btn-back-online" ).addEventListener( "click", () => {
			this._showPanel( this.panelMode );
			this.clearError();
			this.codeInput.value = "";
		});

		document.getElementById( "btn-cancel-wait" ).addEventListener( "click", () => {
			this._showPanel( this.panelMode );
			this.clearError();
		});
	}

	// ─── Show / hide ──────────────────────────────────────────────

	show() {
		this.overlay.classList.remove( "hidden" );
		this._showPanel( this.panelMode );
		this.clearError();
		this.codeInput.value = "";
		this._resetColorPanel();
	}

	hide() {
		this.overlay.classList.add( "hidden" );
	}

	showConnecting() {
		this._showPanel( this.panelConn );
		this.clearError();
	}

	showWaiting( code ) {
		this.codeDisplay.textContent = code;
		this._showPanel( this.panelWait );
		this.clearError();
	}

	showError( message ) {
		this.errorText.textContent = message;
		this.errorText.classList.remove( "hidden" );
	}

	clearError() {
		this.errorText.textContent = "";
		this.errorText.classList.add( "hidden" );
	}

	// ─── Internal helpers ─────────────────────────────────────────

	_showPanel( panel ) {
		const panels = [
			this.panelMode,
			this.panelColor,
			this.panelOnline,
			this.panelWait,
			this.panelConn,
		];
		for ( const p of panels ) {
			if ( p ) p.classList.add( "hidden" );
		}
		if ( panel ) panel.classList.remove( "hidden" );
	}

	_resetColorPanel() {
		this._selectedColor   = "white";
		this._handicapEnabled = false;
		document.querySelectorAll( ".color-btn" ).forEach( ( b ) => b.classList.remove( "active" ) );
		const whiteBtn = document.querySelector( ".color-btn[data-color='white']" );
		if ( whiteBtn ) whiteBtn.classList.add( "active" );
		const chkHandicap = document.getElementById( "chk-handicap" );
		if ( chkHandicap ) chkHandicap.checked = false;
	}
}
