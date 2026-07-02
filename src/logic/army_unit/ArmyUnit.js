


class ArmyUnit {
	constructor( type, alignment, promoted ) {
		this.type = type;
		this.alignment = alignment;
		this.promoted = promoted;
		this.weaknessCounter = 0;
	}
	
	getType() {
		return this.type;
	}
	
	getAlignment() {
		return this.alignment;
	}
	
	switchAlignment() {
		this.alignment = Alignment.getOpposite( this.alignment );
	}
	
	isPromoted() {
		return this.promoted;
	}
	
	isWeak() {
		return ( this.weaknessCounter >= 1 );
	}
	
	getWeaknessCounter() {
		return this.weaknessCounter;
	}
	
	setWeaknessCounter( weaknessCounter ) {
		this.weaknessCounter = weaknessCounter;
	}
	
	decrementWeaknessCounter() {
		--this.weaknessCounter;
	}
}