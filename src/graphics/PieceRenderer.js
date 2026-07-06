
class PieceRenderer {
	constructor( scene ) {
		this.scene = scene;
		this.unitToMeshMap    = new Map();
		this.meshToUnitMap    = new Map();
		this.weaknessMeshMap  = new Map();
		this.flipped = false;

		this.pieceSymbols = {};
		this.pieceSymbols[ ArmyUnitTypeNames.KING_TYPE_NAME ]   = { white: "\u2654", black: "\u265A" };
		this.pieceSymbols[ ArmyUnitTypeNames.QUEEN_TYPE_NAME ]  = { white: "\u2655", black: "\u265B" };
		this.pieceSymbols[ ArmyUnitTypeNames.ROOK_TYPE_NAME ]   = { white: "\u2656", black: "\u265C" };
		this.pieceSymbols[ ArmyUnitTypeNames.BISHOP_TYPE_NAME ] = { white: "\u2657", black: "\u265D" };
		this.pieceSymbols[ ArmyUnitTypeNames.KNIGHT_TYPE_NAME ] = { white: "\u2658", black: "\u265E" };
		this.pieceSymbols[ ArmyUnitTypeNames.PAWN_TYPE_NAME ]   = { white: "\u2659", black: "\u265F" };

		this.textureCache = new Map();
	}

	getSymbol( unit ) {
		const typeName = unit.getType().getName();
		const symbols  = this.pieceSymbols[ typeName ];
		if ( !symbols ) return "?";
		const isFirst = ( unit.getAlignment() === Alignment.FirstPlayer );
		return isFirst ? symbols.white : symbols.black;
	}

	getCacheKey( unit ) {
		return unit.getType().getName() + "_" + ( unit.getAlignment() === Alignment.FirstPlayer ? "w" : "b" );
	}

	createPieceTexture( unit ) {
		const key = this.getCacheKey( unit );
		if ( this.textureCache.has( key ) ) {
			return this.textureCache.get( key );
		}

		const size = 256;
		const tex  = new BABYLON.DynamicTexture(
			"pieceTex_" + key,
			{ width: size, height: size },
			this.scene,
			true,
		);
		tex.hasAlpha = true;

		const ctx    = tex.getContext();
		ctx.clearRect( 0, 0, size, size );

		const symbol  = this.getSymbol( unit );
		const isFirst = ( unit.getAlignment() === Alignment.FirstPlayer );

		ctx.font          = "180px serif";
		ctx.textAlign     = "center";
		ctx.textBaseline  = "middle";

		if ( isFirst ) {
			ctx.shadowColor   = "rgba(0, 0, 0, 0.4)";
			ctx.shadowBlur    = 8;
			ctx.shadowOffsetX = 2;
			ctx.shadowOffsetY = 3;
			ctx.fillStyle     = "#ffffff";
		} else {
			ctx.shadowColor   = "rgba(0, 0, 0, 0.5)";
			ctx.shadowBlur    = 6;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 2;
			ctx.fillStyle     = "#1a1520";
		}

		ctx.fillText( symbol, size / 2, size / 2 + 6 );
		tex.update();

		this.textureCache.set( key, tex );
		return tex;
	}

	createPieceForUnit( unit, row, col ) {
		const plane = BABYLON.MeshBuilder.CreatePlane(
			"piece_" + unit.getType().getName() + "_" + row + "_" + col + "_" + Math.random(),
			{ size: 0.88 },
			this.scene,
		);
		plane.position  = new BABYLON.Vector3( col, 0.03, row );
		plane.rotation.x = Math.PI / 2;
		plane.rotation.y = this.flipped ? Math.PI : 0;

		const tex = this.createPieceTexture( unit );

		const mat = new BABYLON.StandardMaterial(
			"pieceMat_" + plane.uniqueId,
			this.scene,
		);
		mat.diffuseTexture  = tex;
		mat.emissiveTexture = tex;
		mat.opacityTexture  = tex;
		mat.specularColor   = BABYLON.Color3.Black();
		mat.backFaceCulling = false;
		mat.disableLighting = true;
		plane.material = mat;

		plane.metadata = { unit: unit, row: row, col: col, type: "piece" };

		this.unitToMeshMap.set( unit, plane );
		this.meshToUnitMap.set( plane, unit );

		return plane;
	}

	removePiece( unit ) {
		this._removeWeaknessOverlay( unit );
		const mesh = this.unitToMeshMap.get( unit );
		if ( mesh ) {
			this.meshToUnitMap.delete( mesh );
			this.unitToMeshMap.delete( unit );
			mesh.dispose();
		}
	}

	getMeshForUnit( unit ) {
		return this.unitToMeshMap.get( unit );
	}

	getUnitForMesh( mesh ) {
		return this.meshToUnitMap.get( mesh );
	}

	updatePiecePosition( unit, row, col ) {
		const mesh = this.unitToMeshMap.get( unit );
		if ( mesh ) {
			mesh.position.x = col;
			mesh.position.z = row;
			mesh.metadata.row = row;
			mesh.metadata.col = col;
		}
		// Move weakness overlay too
		const weakMesh = this.weaknessMeshMap.get( unit );
		if ( weakMesh ) {
			weakMesh.position.x = col + 0.32;
			weakMesh.position.z = row + 0.32;
		}
	}

	clearAllPieces() {
		for ( const [ , mesh ] of this.weaknessMeshMap ) {
			mesh.dispose();
		}
		this.weaknessMeshMap.clear();

		for ( const [ , mesh ] of this.unitToMeshMap ) {
			mesh.dispose();
		}
		this.unitToMeshMap.clear();
		this.meshToUnitMap.clear();
	}

	// ─── Weakness Overlays ────────────────────────────────────────

	updateWeaknessCounters( board ) {
		// Collect all currently-tracked units
		const processedUnits = new Set();

		const unitIter = board.getUnits();
		let   wrapper  = unitIter.next();
		while ( !wrapper.done ) {
			const unit = wrapper.value;
			processedUnits.add( unit );

			if ( unit.isWeak() ) {
				const coord = board.getCoordinateOfUnit( unit );
				this._upsertWeaknessOverlay( unit, coord.getRow(), coord.getColumn(), unit.getWeaknessCounter() );
			} else {
				this._removeWeaknessOverlay( unit );
			}

			wrapper = unitIter.next();
		}

		// Remove overlays for units no longer on the board
		for ( const [ unit ] of this.weaknessMeshMap ) {
			if ( !processedUnits.has( unit ) ) {
				this._removeWeaknessOverlay( unit );
			}
		}
	}

	_upsertWeaknessOverlay( unit, row, col, counter ) {
		// Rebuild the overlay each time the counter changes
		this._removeWeaknessOverlay( unit );

		const name    = "weak_" + unit.getType().getName() + "_" + row + "_" + col + "_" + Math.random();
		const texSize = 128;
		const tex     = new BABYLON.DynamicTexture( name + "_tex", { width: texSize, height: texSize }, this.scene, false );
		tex.hasAlpha  = true;

		const ctx = tex.getContext();
		ctx.clearRect( 0, 0, texSize, texSize );

		// Red circle badge
		const cx = texSize / 2, cy = texSize / 2, r = 52;
		ctx.beginPath();
		ctx.arc( cx, cy, r, 0, Math.PI * 2 );
		ctx.fillStyle = "rgba(200, 50, 50, 0.92)";
		ctx.fill();
		ctx.lineWidth    = 6;
		ctx.strokeStyle  = "rgba(255, 120, 80, 0.9)";
		ctx.stroke();

		// Counter number
		ctx.font          = "bold 70px Arial";
		ctx.textAlign     = "center";
		ctx.textBaseline  = "middle";
		ctx.fillStyle     = "#ffffff";
		ctx.fillText( String( counter ), cx, cy + 2 );
		tex.update();

		const plane = BABYLON.MeshBuilder.CreatePlane( name, { size: 0.30 }, this.scene );
		plane.position  = new BABYLON.Vector3( col + 0.32, 0.08, row + 0.32 );
		plane.rotation.x = Math.PI / 2;
		plane.rotation.y = this.flipped ? Math.PI : 0;

		const mat = new BABYLON.StandardMaterial( name + "_mat", this.scene );
		mat.diffuseTexture   = tex;
		mat.emissiveTexture  = tex;
		mat.opacityTexture   = tex;
		mat.specularColor    = BABYLON.Color3.Black();
		mat.backFaceCulling  = false;
		mat.disableLighting  = true;
		plane.material  = mat;
		plane.isPickable = false;

		this.weaknessMeshMap.set( unit, plane );
	}

	_removeWeaknessOverlay( unit ) {
		const mesh = this.weaknessMeshMap.get( unit );
		if ( mesh ) {
			mesh.dispose();
			this.weaknessMeshMap.delete( unit );
		}
	}

	// ─── Flip for Black’s perspective ────────────────────────────

	setFlipped( flipped ) {
		this.flipped = flipped;
		const rotY = flipped ? Math.PI : 0;
		for ( const [ , mesh ] of this.unitToMeshMap )   mesh.rotation.y = rotY;
		for ( const [ , mesh ] of this.weaknessMeshMap ) mesh.rotation.y = rotY;
	}
}
