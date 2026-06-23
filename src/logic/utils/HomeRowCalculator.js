



class HomeRowCalculator {
	static execute( alignment, board ) {
		switch( alignment )
		{
			case Alignment.FirstPlayer:
				return 0;
			case Alignment.SecondPlayer:
				return board.getRowCount() - 1;
			default:
				throw new Error();
		}
	}
}