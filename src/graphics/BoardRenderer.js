
class BoardRenderer {
	constructor( scene, glowLayer ) {
		this.scene = scene;
		this.glowLayer = glowLayer;
		this.squareMeshes = [];
		this.highlightMeshes = [];
		this.cpFlagMeshes = [];

		this.lightColor = new BABYLON.Color3( 0.94, 0.85, 0.71 );
		this.darkColor  = new BABYLON.Color3( 0.71, 0.53, 0.39 );

		this.createBoard();
		this.createFrame();
		this.createCoordinateLabels();
	}

	createBoard() {
		for ( let row = 0; row < 8; ++row ) {
			this.squareMeshes[row] = [];
			for ( let col = 0; col < 8; ++col ) {
				const square = BABYLON.MeshBuilder.CreatePlane(
					"square_" + row + "_" + col,
					{ size: 1 },
					this.scene,
				);
				square.position = new BABYLON.Vector3( col, 0, row );
				square.rotation.x = Math.PI / 2;

				const isLight = ( row + col ) % 2 === 0;
				const mat = new BABYLON.StandardMaterial(
					"sqMat_" + row + "_" + col,
					this.scene,
				);
				mat.diffuseColor = isLight
					? this.lightColor.clone()
					: this.darkColor.clone();
				mat.specularColor = BABYLON.Color3.Black();
				mat.emissiveColor = mat.diffuseColor.scale( 0.15 );
				square.material = mat;

				square.metadata = { row: row, col: col, type: "square" };

				this.squareMeshes[row][col] = square;
			}
		}
	}

	createFrame() {
		const frameMat = new BABYLON.StandardMaterial( "frameMat", this.scene );
		frameMat.diffuseColor = new BABYLON.Color3( 0.30, 0.18, 0.10 );
		frameMat.specularColor = BABYLON.Color3.Black();
		frameMat.emissiveColor = new BABYLON.Color3( 0.06, 0.04, 0.02 );

		const thickness = 0.35;
		const boardLen  = 8;
		const half = ( boardLen - 1 ) / 2;

		const sides = [
			{ w: boardLen + thickness * 2, d: thickness, x: half, z: -0.5 - thickness / 2 },
			{ w: boardLen + thickness * 2, d: thickness, x: half, z: boardLen - 0.5 + thickness / 2 },
			{ w: thickness, d: boardLen, x: -0.5 - thickness / 2, z: half },
			{ w: thickness, d: boardLen, x: boardLen - 0.5 + thickness / 2, z: half },
		];

		for ( let i = 0; i < sides.length; ++i ) {
			const s = sides[i];
			const frame = BABYLON.MeshBuilder.CreatePlane(
				"frame_" + i,
				{ width: s.w, height: s.d },
				this.scene,
			);
			frame.position = new BABYLON.Vector3( s.x, -0.01, s.z );
			frame.rotation.x = Math.PI / 2;
			frame.material = frameMat;
			frame.isPickable = false;
		}
	}

	createCoordinateLabels() {
		const columns = [ "a", "b", "c", "d", "e", "f", "g", "h" ];

		for ( let col = 0; col < 8; ++col ) {
			this.createLabel( columns[col], col, -1.05 );
			this.createLabel( columns[col], col, 8.05 );
		}

		for ( let row = 0; row < 8; ++row ) {
			this.createLabel( String( row + 1 ), -1.05, row );
			this.createLabel( String( row + 1 ), 8.05, row );
		}
	}

	createLabel( text, x, z ) {
		const size = 128;
		const tex = new BABYLON.DynamicTexture(
			"labelTex_" + text + "_" + x + "_" + z,
			{ width: size, height: size },
			this.scene,
			false,
		);
		tex.hasAlpha = true;

		const ctx = tex.getContext();
		ctx.clearRect( 0, 0, size, size );
		ctx.font = "bold 72px Arial";
		ctx.fillStyle = "rgba(180, 165, 140, 0.55)";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText( text, size / 2, size / 2 );
		tex.update();

		const plane = BABYLON.MeshBuilder.CreatePlane(
			"label_" + text + "_" + x + "_" + z,
			{ size: 0.5 },
			this.scene,
		);
		plane.position = new BABYLON.Vector3( x, 0, z );
		plane.rotation.x = Math.PI / 2;

		const mat = new BABYLON.StandardMaterial(
			"labelMat_" + text + "_" + x + "_" + z,
			this.scene,
		);
		mat.diffuseTexture  = tex;
		mat.emissiveTexture = tex;
		mat.opacityTexture  = tex;
		mat.specularColor   = BABYLON.Color3.Black();
		mat.backFaceCulling = false;
		mat.disableLighting = true;
		plane.material = mat;
		plane.isPickable = false;
	}

	// ─── CP Flag Visualization ────────────────────────────────────

	createCPFlags( board ) {
		// Remove old flags
		for ( const m of this.cpFlagMeshes ) m.dispose();
		this.cpFlagMeshes = [];

		for ( let row = 0; row < board.getRowCount(); ++row ) {
			for ( let col = 0; col < board.getColumnCount(); ++col ) {
				const cell = board.getCell( row, col );
				const whiteIncome = cell.getControlPointIncome( Alignment.FirstPlayer );
				const blackIncome = cell.getControlPointIncome( Alignment.SecondPlayer );

				if ( whiteIncome > 0 ) {
					this._createCPFlag( row, col, whiteIncome, true );
				}
				if ( blackIncome > 0 ) {
					this._createCPFlag( row, col, blackIncome, false );
				}
			}
		}
	}

	_createCPFlag( row, col, income, isWhiteFlag ) {
		// White flag: bottom-right corner; Black flag: bottom-left corner
		const offsetX = isWhiteFlag ? 0.32 : -0.32;
		const name    = "cpflag_" + row + "_" + col + "_" + ( isWhiteFlag ? "w" : "b" );

		const flagSize = 256;
		const tex = new BABYLON.DynamicTexture( name + "_tex", { width: flagSize, height: flagSize }, this.scene, false );
		tex.hasAlpha = true;

		const ctx = tex.getContext();
		ctx.clearRect( 0, 0, flagSize, flagSize );

		// Circle background
		const cx = flagSize / 2, cy = flagSize / 2, r = 110;
		ctx.beginPath();
		ctx.arc( cx, cy, r, 0, Math.PI * 2 );
		if ( isWhiteFlag ) {
			ctx.fillStyle = "rgba(240, 220, 140, 0.88)";
		} else {
			ctx.fillStyle = "rgba(40, 30, 60, 0.88)";
		}
		ctx.fill();

		// Border
		ctx.lineWidth = 10;
		ctx.strokeStyle = isWhiteFlag ? "rgba(200, 160, 60, 0.9)" : "rgba(120, 100, 180, 0.9)";
		ctx.stroke();

		// VP number
		ctx.font = "bold 120px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = isWhiteFlag ? "#5a3a00" : "#e0d8f8";
		ctx.fillText( String( income ), cx, cy + 4 );
		tex.update();

		const plane = BABYLON.MeshBuilder.CreatePlane( name, { size: 0.28 }, this.scene );
		plane.position = new BABYLON.Vector3( col + offsetX, 0.04, row - 0.32 );
		plane.rotation.x = Math.PI / 2;

		const mat = new BABYLON.StandardMaterial( name + "_mat", this.scene );
		mat.diffuseTexture  = tex;
		mat.emissiveTexture = tex;
		mat.opacityTexture  = tex;
		mat.specularColor   = BABYLON.Color3.Black();
		mat.backFaceCulling = false;
		mat.disableLighting = true;
		plane.material  = mat;
		plane.isPickable = false;

		this.cpFlagMeshes.push( plane );
	}

	// ─── Highlights ───────────────────────────────────────────────

	highlightSelected( row, col ) {
		this.createHighlightPlane(
			row, col,
			new BABYLON.Color3( 1.0, 0.85, 0.2 ),
			0.55,
			true,
		);
	}

	highlightValidMove( row, col, isCapture ) {
		if ( isCapture ) {
			this.createHighlightRing( row, col, new BABYLON.Color3( 0.9, 0.2, 0.2 ) );
		} else {
			this.createHighlightDot( row, col, new BABYLON.Color3( 0.2, 0.7, 0.35 ) );
		}
	}

	highlightDeploySquare( row, col ) {
		this.createHighlightDot( row, col, new BABYLON.Color3( 0.2, 0.5, 1.0 ) );
	}

	highlightLastMove( fromRow, fromCol, toRow, toCol ) {
		this.clearLastMoveHighlights();
		this.createHighlightPlane( fromRow, fromCol, new BABYLON.Color3( 0.6, 0.78, 0.0 ), 0.25, false, "lastmove" );
		this.createHighlightPlane( toRow, toCol, new BABYLON.Color3( 0.6, 0.78, 0.0 ), 0.35, false, "lastmove" );
	}

	clearLastMoveHighlights() {
		const toRemove = this.scene.meshes.filter( ( m ) =>
			m.name && m.name.startsWith( "lastmove_" )
		);
		for ( const m of toRemove ) {
			m.dispose();
		}
	}

	createHighlightPlane( row, col, color, alpha, glow, prefix ) {
		const name  = ( prefix || "highlight" ) + "_" + row + "_" + col;
		const plane = BABYLON.MeshBuilder.CreatePlane(
			name,
			{ size: 0.95 },
			this.scene,
		);
		plane.position = new BABYLON.Vector3( col, 0.01, row );
		plane.rotation.x = Math.PI / 2;

		const mat = new BABYLON.StandardMaterial( name + "_mat", this.scene );
		mat.diffuseColor   = color;
		mat.emissiveColor  = color.scale( 0.7 );
		mat.specularColor  = BABYLON.Color3.Black();
		mat.alpha          = alpha;
		mat.backFaceCulling = false;
		mat.disableLighting = true;
		plane.material  = mat;
		plane.isPickable = false;

		if ( glow ) {
			this.glowLayer.addIncludedOnlyMesh( plane );
		}

		if ( !prefix ) {
			this.highlightMeshes.push( plane );
		}

		return plane;
	}

	createHighlightDot( row, col, color ) {
		const name = "dot_" + row + "_" + col;
		const dot  = BABYLON.MeshBuilder.CreateDisc(
			name,
			{ radius: 0.16, tessellation: 24 },
			this.scene,
		);
		dot.position = new BABYLON.Vector3( col, 0.02, row );
		dot.rotation.x = Math.PI / 2;

		const mat = new BABYLON.StandardMaterial( name + "_mat", this.scene );
		mat.diffuseColor  = color;
		mat.emissiveColor = color.scale( 0.5 );
		mat.specularColor  = BABYLON.Color3.Black();
		mat.alpha          = 0.7;
		mat.backFaceCulling = false;
		mat.disableLighting = true;
		dot.material  = mat;
		dot.isPickable = false;

		this.highlightMeshes.push( dot );
		return dot;
	}

	createHighlightRing( row, col, color ) {
		const name = "ring_" + row + "_" + col;
		const ring = BABYLON.MeshBuilder.CreateTorus(
			name,
			{ diameter: 0.85, thickness: 0.06, tessellation: 32 },
			this.scene,
		);
		ring.position = new BABYLON.Vector3( col, 0.02, row );
		ring.rotation.x = Math.PI / 2;

		const mat = new BABYLON.StandardMaterial( name + "_mat", this.scene );
		mat.diffuseColor  = color;
		mat.emissiveColor = color.scale( 0.6 );
		mat.specularColor  = BABYLON.Color3.Black();
		mat.alpha          = 0.75;
		mat.disableLighting = true;
		ring.material  = mat;
		ring.isPickable = false;

		this.glowLayer.addIncludedOnlyMesh( ring );
		this.highlightMeshes.push( ring );
		return ring;
	}

	clearHighlights() {
		for ( const mesh of this.highlightMeshes ) {
			mesh.dispose();
		}
		this.highlightMeshes = [];
	}

	getSquareMesh( row, col ) {
		return this.squareMeshes[row][col];
	}
}
