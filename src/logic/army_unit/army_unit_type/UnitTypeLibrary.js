


class UnitTypeLibrary {
	constructor() {
		this.types = new Map();
	}
	
	getTypeByName( name ) {
		return this.types.get( name );
	}
	
	addType( type ) {
		this.types.set( type.getName(), type );
	}
}