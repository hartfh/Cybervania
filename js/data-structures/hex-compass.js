const {HEX_DIRECTIONS} = require('../../data/strings');
const RANGE = HEX_DIRECTIONS.length;

class HexCompass {
	constructor() {
		this.index = 0;
	}
	normalizeIndex(index) {
		let normalized = index;

		if(index >= RANGE) {
			normalized -= RANGE;
		} else if(index < 0) {
			normalized += RANGE;
		}

		return normalized;
	}
	get directions() {
		return HEX_DIRECTIONS;
	}
	get dir() {
		return HEX_DIRECTIONS[this.index];
	}
	set dir(direction) {
		if( HEX_DIRECTIONS.includes(direction) ) {
			this.index = HEX_DIRECTIONS.indexOf(direction);
		}
	}
	get adjacent() {
		const left = HEX_DIRECTIONS[this.normalizeIndex(this.index - 1)];
		const right = HEX_DIRECTIONS[this.normalizeIndex(this.index + 1)];

		return {left, right};
	}
	get opposite() {
		return HEX_DIRECTIONS[this.normalizeIndex(this.index + RANGE / 2)];
	}
	get back() {
		const halfRange = RANGE / 2;

		return [
			HEX_DIRECTIONS[this.normalizeIndex(this.index + halfRange - 1)],
			HEX_DIRECTIONS[this.normalizeIndex(this.index + halfRange)],
			HEX_DIRECTIONS[this.normalizeIndex(this.index + halfRange + 1)]
		];
	}
	get forward() {
		const {left, right} = this.adjacent;

		return [left, HEX_DIRECTIONS[this.index], right];
	}
	get left() {
		const {left} = this.adjacent;

		return left;
	}
	get right() {
		const {right} = this.adjacent;

		return right;
	}
	rotate(rotations = 1) {
		const adj = rotations > 0 ? 1 : -1;

		for(let i = 0, numRotations = Math.abs(rotations); i < numRotations; i++) {
			this.index += adj;

			if( this.index == HEX_DIRECTIONS.length ) {
				this.index = 0;
			}
			if( this.index < 0 ) {
				this.index = HEX_DIRECTIONS.length - 1;
			}
		}

		return this;
	}
	randomize() {
		this.index = Math.floor( Math.random() * RANGE );

		return this;
	}
}

module.exports = HexCompass;
