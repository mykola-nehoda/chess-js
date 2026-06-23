
class AnimationManager {
	constructor( scene ) {
		this.scene = scene;
		this.isAnimating = false;
	}

	animateMove( mesh, fromRow, fromCol, toRow, toCol ) {
		return new Promise( ( resolve ) => {
			this.isAnimating = true;

			const frameRate = 30;
			const totalFrames = 20;

			const posXAnim = new BABYLON.Animation(
				"moveX", "position.x", frameRate,
				BABYLON.Animation.ANIMATIONTYPE_FLOAT,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			posXAnim.setKeys([
				{ frame: 0, value: fromCol },
				{ frame: totalFrames, value: toCol },
			]);

			const posZAnim = new BABYLON.Animation(
				"moveZ", "position.z", frameRate,
				BABYLON.Animation.ANIMATIONTYPE_FLOAT,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			posZAnim.setKeys([
				{ frame: 0, value: fromRow },
				{ frame: totalFrames, value: toRow },
			]);

			const easing = new BABYLON.CubicEase();
			easing.setEasingMode( BABYLON.EasingFunction.EASINGMODE_EASEINOUT );
			posXAnim.setEasingFunction( easing );
			posZAnim.setEasingFunction( easing );

			mesh.animations = [];
			mesh.animations.push( posXAnim, posZAnim );

			this.scene.beginAnimation(
				mesh, 0, totalFrames, false, 1.2,
				() => {
					this.isAnimating = false;
					resolve();
				},
			);
		});
	}

	animateCapture( mesh ) {
		return new Promise( ( resolve ) => {
			const frameRate = 30;
			const totalFrames = 12;

			const scaleAnim = new BABYLON.Animation(
				"captureScale", "scaling", frameRate,
				BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			scaleAnim.setKeys([
				{ frame: 0, value: new BABYLON.Vector3( 1, 1, 1 ) },
				{ frame: 4, value: new BABYLON.Vector3( 1.1, 1.1, 1.1 ) },
				{ frame: totalFrames, value: new BABYLON.Vector3( 0, 0, 0 ) },
			]);

			const alphaAnim = new BABYLON.Animation(
				"captureAlpha", "material.alpha", frameRate,
				BABYLON.Animation.ANIMATIONTYPE_FLOAT,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			alphaAnim.setKeys([
				{ frame: 0, value: 1 },
				{ frame: totalFrames, value: 0 },
			]);

			mesh.animations = [];
			mesh.animations.push( scaleAnim, alphaAnim );

			this.scene.beginAnimation(
				mesh, 0, totalFrames, false, 1.0,
				() => {
					mesh.dispose();
					resolve();
				},
			);
		});
	}

	animatePromotion( newMesh ) {
		return new Promise( ( resolve ) => {
			newMesh.scaling = new BABYLON.Vector3( 0, 0, 0 );

			const frameRate = 30;
			const totalFrames = 18;

			const scaleAnim = new BABYLON.Animation(
				"promoteScale", "scaling", frameRate,
				BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			scaleAnim.setKeys([
				{ frame: 0, value: new BABYLON.Vector3( 0, 0, 0 ) },
				{ frame: 12, value: new BABYLON.Vector3( 1.12, 1.12, 1.12 ) },
				{ frame: totalFrames, value: new BABYLON.Vector3( 1, 1, 1 ) },
			]);

			newMesh.animations = [];
			newMesh.animations.push( scaleAnim );

			this.scene.beginAnimation(
				newMesh, 0, totalFrames, false, 1.0,
				() => resolve(),
			);
		});
	}

	getIsAnimating() {
		return this.isAnimating;
	}
}
