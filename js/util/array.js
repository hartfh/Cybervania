Array.prototype.clone = function() {
	return JSON.parse( JSON.stringify(this) );
};

Array.prototype.getRandom = function() {
	if( this.length == 0 ) {
		return {};
	}

	const randomIndex = Math.floor( Math.random() * this.length );

	return {
		key: randomIndex,
		value: this[randomIndex]
	};
};

Array.prototype.randomize = function() {
	var j, x, i;

	for (i = this.length; i; i--) {
		j = Math.floor( Math.random() * i );
		x = this[i - 1];
		this[i - 1] = this[j];
		this[j] = x;
	}

	return this;
};

Array.prototype.remove = function(value) {
	const index = this.indexOf(value);

	if( index != -1 ) {
		this.splice(index, 1);
	}
};

Object.defineProperty(Array.prototype, 'clone', {enumerable: false});
Object.defineProperty(Array.prototype, 'getRandom', {enumerable: false});
Object.defineProperty(Array.prototype, 'randomize', {enumerable: false});
Object.defineProperty(Array.prototype, 'remove', {enumerable: false});
