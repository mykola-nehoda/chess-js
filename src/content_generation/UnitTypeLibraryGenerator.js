

class UnitTypeLibraryGenerator {
	static execute() {
		const generatedLibrary = new UnitTypeLibrary();
		generatedLibrary.addType( new PawnUnitType() );
		generatedLibrary.addType( new KnightUnitType() );
		generatedLibrary.addType( new BishopUnitType() );
		generatedLibrary.addType( new RookUnitType() );
		generatedLibrary.addType( new QueenUnitType() );
		generatedLibrary.addType( new KingUnitType() );
		
		return generatedLibrary;
	}
}