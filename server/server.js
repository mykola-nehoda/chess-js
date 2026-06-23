"use strict";

const WebSocket = require( "ws" );

const PORT = process.env.PORT || 8765;
const wss = new WebSocket.Server( { port: PORT } );

// rooms: Map<code, { players: [ws|null, ws|null], timers: [timer|null, timer|null] }>
const rooms = new Map();

const RECONNECT_TIMEOUT_MS = 60000;
const HEARTBEAT_INTERVAL_MS = 30000;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ─── Utilities ───────────────────────────────────────────────

function generateCode() {
	let code;
	do {
		code = Array.from(
			{ length: 4 },
			() => CODE_CHARS[ Math.floor( Math.random() * CODE_CHARS.length ) ],
		).join( "" );
	} while ( rooms.has( code ) );
	return code;
}

function send( ws, data ) {
	if ( ws && ws.readyState === WebSocket.OPEN ) {
		ws.send( JSON.stringify( data ) );
	}
}

function getOpponent( room, playerIndex ) {
	return room.players[ 1 - playerIndex ];
}

function cleanupRoom( code ) {
	const room = rooms.get( code );
	if ( !room ) return;
	for ( const timer of room.timers ) {
		if ( timer ) clearTimeout( timer );
	}
	rooms.delete( code );
}

// ─── Message Handlers ─────────────────────────────────────────

function handleCreateRoom( ws ) {
	const code = generateCode();
	rooms.set( code, {
		players: [ ws, null ],
		timers: [ null, null ],
	});
	ws.roomCode = code;
	ws.playerIndex = 0;
	send( ws, { type: "room-created", code, alignment: "First Player" } );
	console.log( `Room created: ${ code }` );
}

function handleJoinRoom( ws, msg ) {
	const code = ( msg.code || "" ).trim().toUpperCase();
	const room = rooms.get( code );

	if ( !room ) {
		send( ws, { type: "error", message: "Room not found. Check the code and try again." } );
		return;
	}

	const slot1 = room.players[ 1 ];
	const slot1Alive = slot1 && slot1.readyState === WebSocket.OPEN;

	if ( slot1Alive ) {
		send( ws, { type: "error", message: "Room is full." } );
		return;
	}

	// Clear any pending disconnect timer for slot 1
	if ( room.timers[ 1 ] ) {
		clearTimeout( room.timers[ 1 ] );
		room.timers[ 1 ] = null;
	}

	room.players[ 1 ] = ws;
	ws.roomCode = code;
	ws.playerIndex = 1;

	const p0 = room.players[ 0 ];
	send( p0, { type: "game-start", alignment: "First Player" } );
	send( ws,  { type: "game-start", alignment: "Second Player" } );
	console.log( `Room joined: ${ code }` );
}

function handleReconnect( ws, msg ) {
	const code = ( msg.code || "" ).trim().toUpperCase();
	const alignment = msg.alignment;
	const room = rooms.get( code );

	if ( !room ) {
		send( ws, { type: "error", message: "Session expired. Please start a new game." } );
		return;
	}

	const playerIndex = alignment === "First Player" ? 0 : 1;

	// Clear disconnect timer
	if ( room.timers[ playerIndex ] ) {
		clearTimeout( room.timers[ playerIndex ] );
		room.timers[ playerIndex ] = null;
	}

	room.players[ playerIndex ] = ws;
	ws.roomCode = code;
	ws.playerIndex = playerIndex;

	const opponent = getOpponent( room, playerIndex );
	send( opponent, { type: "opponent-reconnected" } );
	send( ws, { type: "reconnected", alignment } );
	console.log( `Player reconnected to room: ${ code }` );
}

function handleMove( ws, msg ) {
	const room = rooms.get( ws.roomCode );
	if ( !room ) return;

	const opponent = getOpponent( room, ws.playerIndex );
	send( opponent, {
		type: "move",
		unitId: msg.unitId,
		destRow: msg.destRow,
		destCol: msg.destCol,
	});
}

function handleGiveUp( ws ) {
	const room = rooms.get( ws.roomCode );
	if ( !room ) return;

	const opponent = getOpponent( room, ws.playerIndex );
	send( opponent, { type: "opponent-gave-up" } );
	cleanupRoom( ws.roomCode );
	console.log( `Player gave up in room: ${ ws.roomCode }` );
}

function handleDisconnect( ws ) {
	const code = ws.roomCode;
	if ( !code ) return;

	const room = rooms.get( code );
	if ( !room ) return;

	const playerIndex = ws.playerIndex;
	const opponent = getOpponent( room, playerIndex );

	send( opponent, { type: "opponent-disconnected" } );

	// Give 60s to reconnect
	room.timers[ playerIndex ] = setTimeout( () => {
		const current = room.players[ playerIndex ];
		if ( !current || current === ws || current.readyState !== WebSocket.OPEN ) {
			send( opponent, { type: "opponent-left" } );
			cleanupRoom( code );
			console.log( `Room ${ code } cleaned up after timeout` );
		}
	}, RECONNECT_TIMEOUT_MS );
}

// ─── Connection Lifecycle ──────────────────────────────────────

wss.on( "connection", ( ws ) => {
	ws.roomCode = null;
	ws.playerIndex = -1;
	ws.isAlive = true;

	ws.on( "pong", () => { ws.isAlive = true; } );

	ws.on( "message", ( raw ) => {
		let msg;
		try {
			msg = JSON.parse( raw );
		} catch {
			return;
		}

		switch ( msg.type ) {
			case "create-room":   handleCreateRoom( ws );       break;
			case "join-room":     handleJoinRoom( ws, msg );    break;
			case "reconnect":     handleReconnect( ws, msg );   break;
			case "move":          handleMove( ws, msg );        break;
			case "give-up":       handleGiveUp( ws );           break;
		}
	});

	ws.on( "close", () => handleDisconnect( ws ) );
	ws.on( "error", () => handleDisconnect( ws ) );
});

// ─── Heartbeat (detect dead connections) ──────────────────────

const heartbeat = setInterval( () => {
	for ( const ws of wss.clients ) {
		if ( !ws.isAlive ) {
			ws.terminate();
			continue;
		}
		ws.isAlive = false;
		ws.ping();
	}
}, HEARTBEAT_INTERVAL_MS );

wss.on( "close", () => clearInterval( heartbeat ) );

console.log( `Chess-JS WebSocket server running on port ${ PORT }` );
