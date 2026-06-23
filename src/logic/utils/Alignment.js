

class Alignment {
	
	constructor( name ) {
		this.name = name;
	}
	
	static FirstPlayer = new Alignment( "First Player" );
	static SecondPlayer = new Alignment( "Second Player" );
	
	static getOpposite( alignment ) {
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return Alignment.SecondPlayer;
			case Alignment.SecondPlayer:
				return Alignment.FirstPlayer;
			default:
				throw new Error();
		}
	}
}