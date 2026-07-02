


class AlignmentDirectionCalculator {
	static execute( alignment ) {
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return 1;
			case Alignment.SecondPlayer:
				return -1;
			default:
				throw new Error();
		}
	}
}
