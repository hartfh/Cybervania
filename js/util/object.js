Object.prototype.getRandom = function() {
	const keys = Object.keys(this);

	if( keys.length == 0 ) {
		return {};
	}

	const randomKey = keys[Math.floor( Math.random() * keys.length )];

	return {
		key: randomKey,
		value: this[randomKey]
	};
};

Object.prototype.clone = function() {
	return JSON.parse( JSON.stringify(this) );
};

Object.prototype.deepFreeze = function() {
	// Retrieve the property names defined on obj
	var propNames = Object.getOwnPropertyNames(this);

	// Freeze properties before freezing self
	propNames.forEach(function(name) {
		var prop = this[name];

		// Freeze prop if it is an object
		if (typeof prop == 'object' && prop !== null)
			this.deepFreeze(prop);
	});

	// Freeze self (no-op if already frozen)
	return Object.freeze(this);
};

Object.defineProperty(Object.prototype, 'clone', {enumerable: false});
Object.defineProperty(Object.prototype, 'deepFreeze', {enumerable: false});
Object.defineProperty(Object.prototype, 'getRandom', {enumerable: false});
