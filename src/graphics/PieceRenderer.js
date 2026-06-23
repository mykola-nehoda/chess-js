
class PieceRenderer {
	constructor( scene ) {
		this.scene = scene;
		this.unitToMeshMap = new Map();
		this.meshToUnitMap = new Map();

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
		const symbols = this.pieceSymbols[ typeName ];
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
		const tex = new BABYLON.DynamicTexture(
			"pieceTex_" + key,
			{ width: size, height: size },
			this.scene,
			true,
		);
		tex.hasAlpha = true;

		const ctx = tex.getContext();
		ctx.clearRect( 0, 0, size, size );

		const symbol = this.getSymbol( unit );
		const isFirst = ( unit.getAlignment() === Alignment.FirstPlayer );

		ctx.font = "180px serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		if ( isFirst ) {
			ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
			ctx.shadowBlur = 8;
			ctx.shadowOffsetX = 2;
			ctx.shadowOffsetY = 3;
			ctx.fillStyle = "#ffffff";
		} else {
			ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
			ctx.shadowBlur = 6;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 2;
			ctx.fillStyle = "#1a1520";
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
		plane.position = new BABYLON.Vector3( col, 0.03, row );
		plane.rotation.x = Math.PI / 2;

		const tex = this.createPieceTexture( unit );

		const mat = new BABYLON.StandardMaterial(
			"pieceMat_" + plane.uniqueId,
			this.scene,
		);
		mat.diffuseTexture = tex;
		mat.emissiveTexture = tex;
		mat.opacityTexture = tex;
		mat.specularColor = BABYLON.Color3.Black();
		mat.backFaceCulling = false;
		mat.disableLighting = true;
		plane.material = mat;

		plane.metadata = { unit: unit, row: row, col: col, type: "piece" };

		this.unitToMeshMap.set( unit, plane );
		this.meshToUnitMap.set( plane, unit );

		return plane;
	}

	removePiece( unit ) {
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
	}

	clearAllPieces() {
		for ( const [ unit, mesh ] of this.unitToMeshMap ) {
			mesh.dispose();
		}
		this.unitToMeshMap.clear();
		this.meshToUnitMap.clear();
	}
}
