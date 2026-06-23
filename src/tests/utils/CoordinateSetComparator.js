

class CoordinateSetComparator {
	static execute( set1, set2 ) {
		if ( set1.size != set2.size )
			return false;

		const array1 = Array.from( set1 );
		const array2 = Array.from( set2 );
		
		array1.sort( Coordinate.compare );
		array2.sort( Coordinate.compare );
		
		for ( let i = 0; i < set1.size; ++i ) {
			if ( !Coordinate.areEqual( array1[i], array2[i] ) )
				return false;
		}
		
		return true;
	}
}