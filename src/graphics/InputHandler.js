
class InputHandler {
	constructor( scene, boardRenderer, pieceRenderer, gameManager, animationManager, uiOverlay ) {
		this.scene          = scene;
		this.boardRenderer  = boardRenderer;
		this.pieceRenderer  = pieceRenderer;
		this.gameManager    = gameManager;
		this.animationManager = animationManager;
		this.uiOverlay      = uiOverlay;

		this.selectedUnit        = null;   // board unit selected for move
		this.selectedReserveUnit = null;   // reserve unit selected for deploy
		this.validMoves          = [];     // {row, col} destinations

		// Network — set externally for online games, null for local
		this.localAlignment = null;
		this.networkClient  = null;
		this.unitRegistry   = null;

		this._pointerObserver = null;
		this.setupPointerHandler();

		// Wire reserve clicks from UIOverlay
		this.uiOverlay.onReservePieceClick = ( unit ) => {
			this.handleReservePiecePick( unit );
		};
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

	// ─── Pick handling ────────────────────────────────────────────

	handlePick( pointerInfo ) {
		if ( this.animationManager.getIsAnimating() ) return;

		const gameState = this.gameManager.getGameState();
		if ( gameState.isWinnerDecided() ) return;

		// Online: block input when it is not the local player's turn
		if ( this.localAlignment !== null &&
		     gameState.getActivePlayerAlignment() !== this.localAlignment ) {
			return;
		}

		const pickResult  = pointerInfo.pickInfo;
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
			// Picking an enemy unit while a friendly is selected = capture attempt
			this.handleSquarePick( row, col );
		}
	}

	handleReservePiecePick( unit ) {
		const activeAlignment = this.gameManager.getGameState().getActivePlayerAlignment();
		if ( unit.getAlignment() !== activeAlignment ) return;
		if ( this.gameManager.getGameState().isWinnerDecided() ) return;

		this.deselect();
		this.selectedReserveUnit = unit;
		this.uiOverlay.highlightReserveUnit( unit );
		this.showDeploymentSquares( unit );
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
		const movesIter = this.gameManager.getAvailableMovesForUnit( unit );
		const board     = this.gameManager.getGameState().getBoard();
		this.validMoves = [];

		for ( const move of movesIter ) {
			const row = move.getRow();
			const col = move.getColumn();
			const isCapture = board.getCell( row, col ).containsUnit();

			this.boardRenderer.highlightValidMove( row, col, isCapture );
			this.validMoves.push( { row, col } );
		}
	}

	showDeploymentSquares( unit ) {
		const deplIter = this.gameManager.getAvailableDeploymentsForUnit( unit );
		this.validMoves = [];

		for ( const coord of deplIter ) {
			const row = coord.getRow();
			const col = coord.getColumn();
			this.boardRenderer.highlightDeploySquare( row, col );
			this.validMoves.push( { row, col } );
		}
	}

	handleSquarePick( row, col ) {
		const isValid = this.validMoves.some( ( m ) => m.row === row && m.col === col );

		if ( this.selectedReserveUnit ) {
			if ( !isValid ) { this.deselect(); return; }
			this.executeDeploy( this.selectedReserveUnit, row, col );
			return;
		}

		if ( this.selectedUnit ) {
			if ( !isValid ) { this.deselect(); return; }
			this.executeMove( this.selectedUnit, row, col );
			return;
		}
	}

	// ─── Move execution ───────────────────────────────────────────

	async executeMove( unit, destRow, destCol ) {
		this.selectedUnit        = null;
		this.selectedReserveUnit = null;
		this.validMoves          = [];
		await this._runMoveSequence( unit, destRow, destCol, true );
	}

	async applyRemoteMove( unitId, destRow, destCol ) {
		if ( !this.unitRegistry ) return;
		const unit = this.unitRegistry.getUnit( unitId );
		if ( !unit ) {
			console.error( "applyRemoteMove: unknown unitId", unitId );
			return;
		}
		await this._runMoveSequence( unit, destRow, destCol, false );
	}

	async _runMoveSequence( unit, destRow, destCol, isLocal ) {
		const board      = this.gameManager.getGameState().getBoard();
		const startCoord = board.getCoordinateOfUnit( unit );
		const startRow   = startCoord.getRow();
		const startCol   = startCoord.getColumn();

		const destCell     = board.getCell( destRow, destCol );
		const capturedUnit = destCell.containsUnit() ? destCell.getUnit() : null;

		const wasPawn    = unit.getType().canBePromoted();
		const oppAlign   = Alignment.getOpposite( unit.getAlignment() );
		const homeRow    = BoardRegionCalculator.getHomeRow( oppAlign, board );
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
		}

		this.gameManager.executeMove( unit, destRow, destCol );

		this.pieceRenderer.updatePiecePosition( unit, destRow, destCol );
		this.boardRenderer.highlightLastMove( startRow, startCol, destRow, destCol );

		if ( willPromote ) {
			this._handlePromotionVisual( unit, destRow, destCol );

			if ( this.unitRegistry ) {
				const newCell = this.gameManager.getGameState().getBoard().getCell( destRow, destCol );
				if ( newCell.containsUnit() ) {
					const newUnit = newCell.getUnit();
					if ( newUnit !== unit ) this.unitRegistry.transferId( unit, newUnit );
				}
			}
		}

		this.syncBoardState();
		this._afterAction();
	}

	// ─── Deploy execution ─────────────────────────────────────────

	async executeDeploy( unit, destRow, destCol ) {
		this.selectedUnit        = null;
		this.selectedReserveUnit = null;
		this.validMoves          = [];
		await this._runDeploySequence( unit, destRow, destCol, true );
	}

	async applyRemoteDeploy( unitId, destRow, destCol ) {
		if ( !this.unitRegistry ) return;
		const unit = this.unitRegistry.getUnit( unitId );
		if ( !unit ) {
			console.error( "applyRemoteDeploy: unknown unitId", unitId );
			return;
		}
		console.log( "applyRemoteDeploy:", unitId, "→", destRow, destCol, "unit:", unit );
		await this._runDeploySequence( unit, destRow, destCol, false );
	}



	async _runDeploySequence( unit, destRow, destCol, isLocal ) {
		console.log( "_runDeploySequence: isLocal=", isLocal, "unit=", unit.getType().getName(),
			"alignment=", unit.getAlignment(), "dest=", destRow, destCol );
		this.boardRenderer.clearHighlights();

		// Send to network before executing so the opponent gets it fast
		if ( isLocal && this.networkClient && this.unitRegistry ) {
			const uid = this.unitRegistry.getId( unit );
			if ( uid ) this.networkClient.sendDeploy( uid, destRow, destCol );
		}

		// Execute the logic (removes from reserve, places on board, sets weakness)
		this.gameManager.executeDeploy( unit, destRow, destCol );

		// Create visual mesh for the newly placed piece
		const mesh = this.pieceRenderer.createPieceForUnit( unit, destRow, destCol );
		if ( mesh ) {
			this.animationManager.animatePromotion( mesh ); // spawn scale-up animation
		}

		this.boardRenderer.highlightLastMove( destRow, destCol, destRow, destCol );

		this.syncBoardState();
		this._afterAction();
	}

	// ─── Post-action sync ─────────────────────────────────────────

	_afterAction() {
		const gameState = this.gameManager.getGameState();
		this.pieceRenderer.updateWeaknessCounters( gameState.getBoard() );
		this.uiOverlay.updateReserve( gameState );
		this.uiOverlay.updateVictoryPoints( gameState );

		if ( gameState.isWinnerDecided() ) {
			this.uiOverlay.showGameOver( gameState.getWinner().getAlignment() );
		} else {
			this.uiOverlay.updateTurnIndicator(
				gameState.getActivePlayerAlignment(),
				gameState.getCurrentTurn(),
			);
		}
	}

	// ─── Promotion ────────────────────────────────────────────────

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

	// ─── Board sync ───────────────────────────────────────────────

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
		this.selectedUnit        = null;
		this.selectedReserveUnit = null;
		this.validMoves          = [];
		this.boardRenderer.clearHighlights();
		this.uiOverlay.clearReserveHighlight();
	}

	reset() {
		this.deselect();
		this.removePointerHandler();
	}
}
