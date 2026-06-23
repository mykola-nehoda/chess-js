
class InputHandler {
	constructor( scene, boardRenderer, pieceRenderer, gameManager, animationManager, uiOverlay ) {
		this.scene = scene;
		this.boardRenderer = boardRenderer;
		this.pieceRenderer = pieceRenderer;
		this.gameManager = gameManager;
		this.animationManager = animationManager;
		this.uiOverlay = uiOverlay;

		this.selectedUnit = null;
		this.validMoves = [];

		// Network — set externally for online games, null for local
		this.localAlignment = null;
		this.networkClient  = null;
		this.unitRegistry   = null;

		this._pointerObserver = null;
		this.setupPointerHandler();
	}

	setupPointerHandler() {
		this._pointerObserver = this.scene.onPointerObservable.add( ( pointerInfo ) => {
			if ( pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK ) {
				this.handlePick( pointerInfo );
			}
		});
	}

	removePointerHandler() {
		if ( this._pointerObserver ) {
			this.scene.onPointerObservable.remove( this._pointerObserver );
			this._pointerObserver = null;
		}
	}

	// ─── Pick handling ────────────────────────────────────────

	handlePick( pointerInfo ) {
		if ( this.animationManager.getIsAnimating() ) return;

		const gameState = this.gameManager.getGameState();
		if ( gameState.isWinnerDecided() ) return;

		// Online: block input when it is not the local player's turn
		if ( this.localAlignment !== null &&
		     gameState.getActivePlayerAlignment() !== this.localAlignment ) {
			return;
		}

		const pickResult = pointerInfo.pickInfo;
		if ( !pickResult.hit ) { this.deselect(); return; }

		const pickedMesh = pickResult.pickedMesh;
		const meta = pickedMesh.metadata;
		if ( !meta ) { this.deselect(); return; }

		if ( meta.type === "piece" ) {
			this.handlePiecePick( meta.unit, meta.row, meta.col );
			return;
		}

		if ( meta.type === "square" ) {
			const board = gameState.getBoard();
			const cell  = board.getCell( meta.row, meta.col );

			if ( cell.containsUnit() ) {
				const unit = cell.getUnit();
				if ( unit.getAlignment() === gameState.getActivePlayerAlignment() ) {
					this.handlePiecePick( unit, meta.row, meta.col );
					return;
				}
			}

			this.handleSquarePick( meta.row, meta.col );
			return;
		}

		this.deselect();
	}

	handlePiecePick( unit, row, col ) {
		const activeAlignment = this.gameManager.getGameState().getActivePlayerAlignment();

		if ( unit.getAlignment() === activeAlignment ) {
			this.selectUnit( unit );
		} else if ( this.selectedUnit ) {
			this.handleSquarePick( row, col );
		}
	}

	selectUnit( unit ) {
		this.deselect();
		this.selectedUnit = unit;

		const board = this.gameManager.getGameState().getBoard();
		const coord = board.getCoordinateOfUnit( unit );
		this.boardRenderer.highlightSelected( coord.getRow(), coord.getColumn() );

		this.showValidMoves( unit );
	}

	showValidMoves( unit ) {
		const possibleMoves = this.gameManager.unitPossibleMoves.get( unit );
		if ( !possibleMoves ) return;

		const board = this.gameManager.getGameState().getBoard();
		this.validMoves = [];

		for ( const move of possibleMoves ) {
			const row = move.getRow();
			const col = move.getColumn();
			const isCapture = board.getCell( row, col ).containsUnit();

			this.boardRenderer.highlightValidMove( row, col, isCapture );
			this.validMoves.push( { row, col } );
		}
	}

	handleSquarePick( row, col ) {
		if ( !this.selectedUnit ) return;

		const isValid = this.validMoves.some( ( m ) => m.row === row && m.col === col );
		if ( !isValid ) { this.deselect(); return; }

		this.executeMove( this.selectedUnit, row, col );
	}

	// ─── Move execution ───────────────────────────────────────

	// Called for the local player's move.
	async executeMove( unit, destRow, destCol ) {
		this.selectedUnit = null;
		this.validMoves   = [];
		await this._runMoveSequence( unit, destRow, destCol, true );
	}

	// Called when a move arrives from the opponent over the network.
	async applyRemoteMove( unitId, destRow, destCol ) {
		if ( !this.unitRegistry ) return;
		const unit = this.unitRegistry.getUnit( unitId );
		if ( !unit ) {
			console.error( "applyRemoteMove: unknown unitId", unitId );
			return;
		}
		await this._runMoveSequence( unit, destRow, destCol, false );
	}

	// Shared move sequence (local + remote).
	async _runMoveSequence( unit, destRow, destCol, isLocal ) {
		const board      = this.gameManager.getGameState().getBoard();
		const startCoord = board.getCoordinateOfUnit( unit );
		const startRow   = startCoord.getRow();
		const startCol   = startCoord.getColumn();

		const destCell     = board.getCell( destRow, destCol );
		const capturedUnit = destCell.containsUnit() ? destCell.getUnit() : null;

		const wasPawn    = unit.getType().canBePromoted();
		const oppAlign   = Alignment.getOpposite( unit.getAlignment() );
		const homeRow    = HomeRowCalculator.execute( oppAlign, board );
		const willPromote = wasPawn && ( destRow === homeRow );

		this.boardRenderer.clearHighlights();

		// Send to network before animation so the opponent gets it fast
		if ( isLocal && this.networkClient && this.unitRegistry ) {
			const uid = this.unitRegistry.getId( unit );
			if ( uid ) this.networkClient.sendMove( uid, destRow, destCol );
		}

		const movingMesh = this.pieceRenderer.getMeshForUnit( unit );
		await this.animationManager.animateMove( movingMesh, startRow, startCol, destRow, destCol );

		if ( capturedUnit ) {
			const capturedMesh = this.pieceRenderer.getMeshForUnit( capturedUnit );
			if ( capturedMesh ) {
				await this.animationManager.animateCapture( capturedMesh );
			}
			this.pieceRenderer.unitToMeshMap.delete( capturedUnit );
			this.pieceRenderer.meshToUnitMap.delete( capturedMesh );
			this.uiOverlay.addCapturedPiece( capturedUnit );
		}

		this.gameManager.executeMove( unit, destRow, destCol );

		this.pieceRenderer.updatePiecePosition( unit, destRow, destCol );
		this.boardRenderer.highlightLastMove( startRow, startCol, destRow, destCol );

		if ( willPromote ) {
			this._handlePromotionVisual( unit, destRow, destCol );

			// Transfer registry ID from pawn to the new queen
			if ( this.unitRegistry ) {
				const newCell = this.gameManager.getGameState().getBoard().getCell( destRow, destCol );
				if ( newCell.containsUnit() ) {
					const newUnit = newCell.getUnit();
					if ( newUnit !== unit ) this.unitRegistry.transferId( unit, newUnit );
				}
			}
		}

		this.syncBoardState();

		const gameState = this.gameManager.getGameState();
		if ( gameState.isWinnerDecided() ) {
			this.uiOverlay.showGameOver( gameState.getWinner().getAlignment() );
		} else {
			this.uiOverlay.updateTurnIndicator(
				gameState.getActivePlayerAlignment(),
				gameState.getCurrentTurn(),
			);
		}
	}

	_handlePromotionVisual( originalUnit, row, col ) {
		const oldMesh = this.pieceRenderer.getMeshForUnit( originalUnit );
		if ( oldMesh ) {
			this.pieceRenderer.unitToMeshMap.delete( originalUnit );
			this.pieceRenderer.meshToUnitMap.delete( oldMesh );
			oldMesh.dispose();
		}

		const board = this.gameManager.getGameState().getBoard();
		const cell  = board.getCell( row, col );
		if ( cell.containsUnit() ) {
			const promotedUnit = cell.getUnit();
			const newMesh = this.pieceRenderer.createPieceForUnit( promotedUnit, row, col );
			if ( newMesh ) this.animationManager.animatePromotion( newMesh );
		}
	}

	syncBoardState() {
		const board       = this.gameManager.getGameState().getBoard();
		const unitIter    = board.getUnits();
		let   wrapper     = unitIter.next();
		const activeUnits = new Set();

		while ( !wrapper.done ) {
			const unit = wrapper.value;
			activeUnits.add( unit );

			if ( !this.pieceRenderer.getMeshForUnit( unit ) ) {
				const coord = board.getCoordinateOfUnit( unit );
				this.pieceRenderer.createPieceForUnit( unit, coord.getRow(), coord.getColumn() );
			}

			wrapper = unitIter.next();
		}

		for ( const [ unit ] of this.pieceRenderer.unitToMeshMap ) {
			if ( !activeUnits.has( unit ) ) this.pieceRenderer.removePiece( unit );
		}
	}

	deselect() {
		this.selectedUnit = null;
		this.validMoves   = [];
		this.boardRenderer.clearHighlights();
	}

	reset() {
		this.deselect();
		this.removePointerHandler();
	}
}
