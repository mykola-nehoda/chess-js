
class NetworkClient {
	constructor( serverUrl ) {
		this.serverUrl = serverUrl;
		this.ws = null;

		this.roomCode = null;
		this.myAlignment = null;
		this._intentionalClose = false;
		this._reconnectAttempts = 0;
		this._maxReconnectAttempts = 20;

		// Callbacks — set by app code
		this.onRoomCreated = null;
		this.onGameStart = null;
		this.onOpponentMove = null;
		this.onOpponentDeploy = null;
		this.onOpponentDisconnected = null;
		this.onOpponentReconnected = null;
		this.onOpponentGaveUp = null;
		this.onOpponentLeft = null;
		this.onReconnected = null;
		this.onConnectionLost = null;
		this.onError = null;
	}

	// ─── Public API ───────────────────────────────────────────

	connect() {
		return new Promise( ( resolve, reject ) => {
			try {
				this.ws = new WebSocket( this.serverUrl );
			} catch ( e ) {
				reject( e );
				return;
			}

			this.ws.onopen  = () => { this._setupHandlers(); resolve(); };
			this.ws.onerror = () => reject( new Error( "Could not connect to server." ) );
		});
	}

	createRoom() {
		this._send( { type: "create-room" } );
	}

	joinRoom( code ) {
		this._send( { type: "join-room", code } );
	}

	sendMove( unitId, destRow, destCol ) {
		this._send( { type: "move", unitId, destRow, destCol } );
	}

	sendDeploy( unitId, destRow, destCol ) {
		this._send( { type: "deploy", unitId, destRow, destCol } );
	}

	giveUp() {
		this._send( { type: "give-up" } );
		this._intentionalClose = true;
		this.disconnect();
	}

	disconnect() {
		this._intentionalClose = true;
		if ( this.ws ) {
			this.ws.close();
			this.ws = null;
		}
	}

	// ─── Internal ─────────────────────────────────────────────

	_setupHandlers() {
		this.ws.onmessage = ( event ) => {
			let msg;
			try { msg = JSON.parse( event.data ); } catch { return; }
			this._handleMessage( msg );
		};

		this.ws.onclose = () => {
			if ( !this._intentionalClose && this.roomCode ) {
				if ( this.onConnectionLost ) this.onConnectionLost();
				this._scheduleReconnect();
			}
		};

		this.ws.onerror = () => {};
	}

	_handleMessage( msg ) {
		switch ( msg.type ) {
			case "room-created":
				this.roomCode = msg.code;
				this.myAlignment = msg.alignment;
				if ( this.onRoomCreated ) this.onRoomCreated( msg.code, msg.alignment );
				break;

			case "game-start":
				this.myAlignment = msg.alignment;
				this._reconnectAttempts = 0;
				if ( this.onGameStart ) this.onGameStart( msg.alignment );
				break;

			case "reconnected":
				this.myAlignment = msg.alignment;
				this._reconnectAttempts = 0;
				if ( this.onReconnected ) this.onReconnected( msg.alignment );
				break;

			case "move":
				if ( this.onOpponentMove ) {
					this.onOpponentMove( msg.unitId, msg.destRow, msg.destCol );
				}
				break;

			case "deploy":
				if ( this.onOpponentDeploy ) {
					this.onOpponentDeploy( msg.unitId, msg.destRow, msg.destCol );
				}
				break;

			case "opponent-disconnected":
				if ( this.onOpponentDisconnected ) this.onOpponentDisconnected();
				break;

			case "opponent-reconnected":
				if ( this.onOpponentReconnected ) this.onOpponentReconnected();
				break;

			case "opponent-gave-up":
				if ( this.onOpponentGaveUp ) this.onOpponentGaveUp();
				break;

			case "opponent-left":
				if ( this.onOpponentLeft ) this.onOpponentLeft();
				break;

			case "error":
				if ( this.onError ) this.onError( msg.message );
				break;
		}
	}

	_send( data ) {
		if ( this.ws && this.ws.readyState === WebSocket.OPEN ) {
			this.ws.send( JSON.stringify( data ) );
		}
	}

	_scheduleReconnect() {
		if ( this._reconnectAttempts >= this._maxReconnectAttempts ) return;
		this._reconnectAttempts++;

		const delay = Math.min( 1000 * this._reconnectAttempts, 5000 );
		setTimeout( () => this._attemptReconnect(), delay );
	}

	_attemptReconnect() {
		if ( this._intentionalClose ) return;

		let ws;
		try {
			ws = new WebSocket( this.serverUrl );
		} catch {
			this._scheduleReconnect();
			return;
		}

		ws.onopen = () => {
			this.ws = ws;
			this._setupHandlers();
			this._send( { type: "reconnect", code: this.roomCode, alignment: this.myAlignment } );
		};

		ws.onerror = () => this._scheduleReconnect();
	}
}
