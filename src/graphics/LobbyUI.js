
class LobbyUI {
	constructor() {
		this.overlay     = document.getElementById( "lobby-overlay" );
		this.panelMode   = document.getElementById( "lobby-mode-select" );
		this.panelOnline = document.getElementById( "lobby-online-panel" );
		this.panelWait   = document.getElementById( "lobby-waiting-panel" );
		this.panelConn   = document.getElementById( "lobby-connecting-panel" );
		this.errorText   = document.getElementById( "lobby-error-text" );
		this.codeDisplay = document.getElementById( "room-code-display" );
		this.codeInput   = document.getElementById( "room-code-input" );

		// Callbacks set by app
		this.onLocalGame  = null;
		this.onCreateGame = null;
		this.onJoinGame   = null;

		this._setupEvents();
	}

	_setupEvents() {
		document.getElementById( "btn-local-game" ).addEventListener( "click", () => {
			if ( this.onLocalGame ) this.onLocalGame();
		});

		document.getElementById( "btn-online-game" ).addEventListener( "click", () => {
			this._showPanel( this.panelOnline );
			this.clearError();
		});

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

	show() {
		this.overlay.classList.remove( "hidden" );
		this._showPanel( this.panelMode );
		this.clearError();
		this.codeInput.value = "";
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

	_showPanel( panel ) {
		const panels = [
			this.panelMode,
			this.panelOnline,
			this.panelWait,
			this.panelConn,
		];
		for ( const p of panels ) {
			p.classList.add( "hidden" );
		}
		panel.classList.remove( "hidden" );
	}
}
