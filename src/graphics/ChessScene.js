
class ChessScene {
	constructor( canvasId ) {
		this.canvas = document.getElementById( canvasId );
		this.engine = new BABYLON.Engine( this.canvas, true, {
			preserveDrawingBuffer: true,
			stencil: true,
			antialias: true,
		});
		this.scene = new BABYLON.Scene( this.engine );
		this.camera = null;
		this.glowLayer = null;

		this.setupScene();
		this.setupCamera();
		this.setupLighting();
		this.setupGlow();
		this.setupResizeHandler();
	}

	setupScene() {
		this.scene.clearColor = new BABYLON.Color4( 0.10, 0.10, 0.18, 1 );
	}

	setupCamera() {
		// Camera positioned south of the board (white's view: row 0 at bottom).
		// Offset in Z avoids the degenerate straight-down case (gimbal lock).
		this.camera = new BABYLON.FreeCamera(
			"topCamera",
			new BABYLON.Vector3( 3.5, 16, -1 ),
			this.scene,
		);
		this.camera.setTarget( new BABYLON.Vector3( 3.5, 0, 3.5 ) );
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

		this.updateOrthoSize();

		this.camera.inputs.clear();
	}

	// Set camera perspective based on which side the player plays.
	// White (FirstPlayer): row 0 at bottom — camera south of board.
	// Black (SecondPlayer): row 7 at bottom — camera north of board (180° flip).
	setCameraForAlignment( alignmentString ) {
		const target = new BABYLON.Vector3( 3.5, 0, 3.5 );
		if ( alignmentString === "Second Player" ) {
			this.camera.position = new BABYLON.Vector3( 3.5, 16, 8 );
		} else {
			this.camera.position = new BABYLON.Vector3( 3.5, 16, -1 );
		}
		this.camera.setTarget( target );
		this.updateOrthoSize();
	}

	updateOrthoSize() {
		const aspect = this.canvas.width / this.canvas.height;
		const halfSize = 4.8;

		if ( aspect >= 1 ) {
			this.camera.orthoTop = halfSize;
			this.camera.orthoBottom = -halfSize;
			this.camera.orthoLeft = -halfSize * aspect;
			this.camera.orthoRight = halfSize * aspect;
		} else {
			this.camera.orthoTop = halfSize / aspect;
			this.camera.orthoBottom = -halfSize / aspect;
			this.camera.orthoLeft = -halfSize;
			this.camera.orthoRight = halfSize;
		}
	}

	setupLighting() {
		const light = new BABYLON.HemisphericLight(
			"hemiLight",
			new BABYLON.Vector3( 0, 1, 0 ),
			this.scene,
		);
		light.intensity = 1.0;
		light.groundColor = new BABYLON.Color3( 0.5, 0.5, 0.5 );
	}

	setupGlow() {
		this.glowLayer = new BABYLON.GlowLayer( "glow", this.scene, {
			blurKernelSize: 32,
		});
		this.glowLayer.intensity = 0.6;
	}

	setupResizeHandler() {
		window.addEventListener( "resize", () => {
			this.engine.resize();
			this.updateOrthoSize();
		});
	}

	getScene() {
		return this.scene;
	}

	getEngine() {
		return this.engine;
	}

	getGlowLayer() {
		return this.glowLayer;
	}

	startRenderLoop() {
		this.engine.runRenderLoop( () => {
			this.scene.render();
		});
	}
}
