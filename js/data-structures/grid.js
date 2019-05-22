/* eslint-disable complexity, max-depth, no-shadow, no-undefined */
class Grid {
	constructor(width, height, config = {}) {
		this.width = width;
		this.height = height;
		this.scratch = [];
		this.points = [];
		this.meta = [];
		this.data = [];
		this.pointFilter = false;
		this.wrap = Boolean( config.wrap );
		this.hasMeta = !( config.meta === false );
		this.hasScratch = !( config.scratch === false );
		this.hasData = !( config.data === false );

		// Setup this.points and this.scratch as two-dimensional arrays filled with 0's
		for(let y = 0; y < this.height; y++) {
			const pointRow = [];
			const scratchRow = [];
			const metaRow = [];
			const dataRow = [];

			for(let x = 0; x < this.width; x++) {
				pointRow.push(0);
				scratchRow.push(0);
				dataRow.push(0);
				metaRow.push( this.constructor.createBlankMeta() );
			}

			this.points.push(pointRow);

			if( this.hasScratch ) {
				this.scratch.push(scratchRow);
			}
			if( this.hasMeta ) {
				this.meta.push(metaRow);
			}
			if( this.hasData ) {
				this.data.push(dataRow);
			}
		}
	}

	static createBlankMeta() {
		return {
			edge: false,
			inside: false,
			hex: 0,
			neighbors: {n: false, ne: false, e: false, se: false, s: false, sw: false, w: false, nw: false},
			numNeighbors: 0,
			rotations: 0,
			type: '',
			variation: 0
		};
	}

	// Converts a Grid's points into a string of 1's and 0's.
	serialize() {
		let serialized = '';

		this.eachPoint(point => {
			if( point ) {
				serialized += '1';
			} else {
				serialized += '0';
			}
		});

		return serialized;
	}

	unserialize(serialized) {
		for(let y = 0; y < this.height; y++) {
			for(let x = 0; x < this.width; x++) {
				const index = (y * this.width) + x;

				if( serialized[index] == '1' ) {
					this.setPoint(x, y, 1);
				} else {
					this.setPoint(x, y, 0);
				}
			}
		}

		return this;
	}

	/**
	 * Getter function for this.height and this.width values.
	 *
	 * @method	getDimnensions
	 * @public
	 *
	 * @returns	{object}
	 */
	getDimensions() {
		return {
			height:	this.height,
			width:	this.width
		};
	}

	/**
	 * Checks if a given set of coordinates fall within the grid's bounds. Does not take wrapping into account.
	 *
	 * @method	hasInternalPoint
	 * @public
	 * @param		{integer}		x
	 * @param		{integer}		y
	 * @return	{boolean}
	 */
	hasInternalPoint(x, y) {
		if( x >= 0 && x < this.width ) {
			if( y >= 0 && y < this.height ) {
				return true;
			}
		}

		return false;
	}

	empty() {
		this.eachPoint((point, x, y) => {
			this.setPoint(x, y, 0);
			this.setMetaPoint(x, y, {
				edge: false,
				inside: false,
				hex: 0,
				neighbors: {n: false, ne: false, e: false, se: false, s: false, sw: false, w: false, nw: false},
				numNeighbors: 0,
				rotations: 0,
				type: '',
				variation: 0
			});
		});

		return this;
	}

	addFilter(filter = point => point) {
		this.pointFilter = filter;

		return this;
	}

	clearFilter() {
		this.pointFilter = false;

		return this;
	}

	filterPoint(point, x, y) {
		if( this.pointFilter ) {
			return this.pointFilter(point, x, y);
		}

		return point;
	}

	/**
	 * Iterates over each item in this.points and passes them to a callback function.
	 *
	 * @method	eachPoint
	 * @public
	 * @param		{function}	callback		A callback function
	 */
	eachPoint(callback, clearFilter = true) {
		for(let y = 0; y < this.height; y++) {
			for(let x = 0; x < this.width; x++) {
				let point = this.points[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	eachPointRandom(callback, clearFilter = true) {
		const randXIndices = [];
		const randYIndices = [];

		for(let x = 0; x < this.width; x++) {
			randXIndices.push(x);
		}
		for(let y = 0; y < this.height; y++) {
			randYIndices.push(y);
		}

		randXIndices.randomize();
		randYIndices.randomize();

		for(let x = 0; x < this.width; x++) {
			for(let y = 0; y < this.height; y++) {
				const xTrue = randXIndices[x];
				const yTrue = randYIndices[y];

				let point = this.points[yTrue][xTrue];

				point = this.filterPoint(point, x, y);

				if( callback(point, xTrue, yTrue, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	/**
	 * Iterates over each item in this.points in reverse order and passes them to a callback function.
	 *
	 * @method	eachPointReverse
	 * @public
	 * @param		{function}	callback		A callback function
	 */
	eachPointReverse(callback, clearFilter = true) {
		for(let y = this.height - 1; y >= 0; y--) {
			for(let x = this.width - 1; x >= 0; x--) {
				let point = this.points[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	static getOrdinalNeighbors(x, y) {
		const points = [];
		const coords = [
			{x: 0, y: -1},
			{x: 1, y: 0},
			{x: 0, y: 1},
			{x: -1, y: 0}
		];

		for(const coord of coords) {
			points.push({
				x: x + coord.x,
				y: y + coord.y
			});
		}

		return points;
	}

	static getDiagonalNeighbors(x, y) {
		const points = [];
		const coords = [
			{x: 1, y: -1},
			{x: 1, y: 1},
			{x: -1, y: 1},
			{x: -1, y: -1}
		];

		for(const coord of coords) {
			points.push({
				x: x + coord.x,
				y: y + coord.y
			});
		}

		return points;
	}

	getNeighbors(x, y) {
		const diagonal = this.constructor.getDiagonalNeighbors(x, y);
		const ordinal = this.constructor.getOrdinalNeighbors(x, y);

		// Returned order: [ne, se, sw, nw, n, e, s, w]
		return [...diagonal, ...ordinal];
	}

	/**
	 * Iterates over an array of supplied point coordinates and applies a callback to each.
	 *
	 * @method	withPoints
	 * @public
	 * @param		{array}		points		An array of point objects
	 * @param		{function}	callback		A callback function
	 */
	withPoints(points = [], callback) {
		for(const coord of points) {
			const point = this.getPoint(coord.x, coord.y);

			if( callback(point, coord.x, coord.y, this) ) {
				return;
			}
		}
	}

	/**
	 * Iterates over each item in this.points within a bounded region and passes them to a callback function.
	 *
	 * @method	eachPointWithin
	 * @public
	 * @param		{object}		minBound		First bounding point
	 * @param		{object}		maxBound		Second bounding point
	 * @param		{function}	callback		A callback function
	 */
	eachPointWithin(minBound, maxBound, callback, clearFilter = true) {
		const bounds = this.normalizeBounds({min: minBound, max: maxBound});

		for(let {x} = bounds.min; x <= bounds.max.x; x++) {
			for(let {y} = bounds.min; y <= bounds.max.y; y++) {
				let point = this.points[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	/**
	 * Iterates over each edge item in this.points and passes them to a callback function.
	 *
	 * @method	eachEdgePoint
	 * @public
	 * @param		{function}	callback		A callback function
	 */
	eachEdgePoint(callback, clearFilter = true) {
		// North edge
		for(let x = 0, y = 0; x < this.width; x++) {
			let point = this.points[y][x];

			point = this.filterPoint(point, x, y);

			callback(point, x, y, this);
		}

		// West edge
		for(let x = 0, y = 0; y < this.height; y++) {
			let point = this.points[y][x];

			point = this.filterPoint(point, x, y);

			callback(point, x, y, this);
		}

		// South edge
		for(let x = 0, y = this.height - 1; x < this.width; x++) {
			let point = this.points[y][x];

			point = this.filterPoint(point, x, y);

			callback(point, x, y, this);
		}

		// West edge
		for(let x = this.width - 1, y = 0; y < this.height; y++) {
			let point = this.points[y][x];

			point = this.filterPoint(point, x, y);

			callback(point, x, y, this);
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	/**
	 * Iterate through each item in this.scratch and pass them to a callback function.
	 *
	 * @method	eachScratchPoint
	 * @public
	 * @param		{function}	callback		A callback function
	 */
	eachScratchPoint(callback, clearFilter = true) {
		if( !this.hasScratch ) {
			return;
		}

		for(let y = 0; y < this.height; y++) {
			for(let x = 0; x < this.width; x++) {
				const point = this.scratch[y][x];

				//point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	/**
	 * Iterate through each item in this.meta and pass them to a callback function.
	 *
	 * @method	eachScratchPoint
	 * @public
	 * @param		{function}	callback		A callback function
	 */
	eachMetaPoint(callback, clearFilter = true) {
		if( !this.hasMeta ) {
			return;
		}

		for(let y = 0; y < this.height; y++) {
			for(let x = 0; x < this.width; x++) {
				let point = this.meta[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	eachMetaPointReverse(callback, clearFilter = true) {
		for(let y = this.height - 1; y >= 0; y--) {
			for(let x = this.width - 1; x >= 0; x--) {
				let point = this.meta[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	/**
	 * Iterate through each item in this.data and pass them to a callback function.
	 *
	 * @method	eachDataPoint
	 * @public
	 * @param		{function}	callback		A callback function
	 */
	eachDataPoint(callback, clearFilter = true) {
		if( !this.hasData ) {
			return;
		}

		for(let y = 0; y < this.height; y++) {
			for(let x = 0; x < this.width; x++) {
				let point = this.data[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	eachDataPointReverse(callback, clearFilter = true) {
		for(let y = this.height - 1; y >= 0; y--) {
			for(let x = this.width - 1; x >= 0; x--) {
				let point = this.data[y][x];

				point = this.filterPoint(point, x, y);

				if( callback(point, x, y, this) ) {
					return;
				}
			}
		}

		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

	/**
	 * Copy values from this.points to this.scratchPoints.
	 *
	 * @method	copyToScratch
	 * @public
	 */
	copyToScratch() {
		this.eachPoint((point, x, y) => {
			this.setScratchPoint(x, y, point);
		}, false);

		return this;
	}

	/**
	 * Copy values from this.scratchPoints to this.points.
	 *
	 * @method	copyFromScratch
	 * @public
	 */
	copyFromScratch() {
		this.eachScratchPoint((point, x, y) => {
			this.setPoint(x, y, point);
		}, false);

		return this;
	}

	/**
	 * Convert x- and y-coordinates into values that occur within the grid boundaries.
	 *
	 * @method	normalize
	 * @public
	 * @param		{integer}		x
	 * @param		{integer}		y
	 * @return		{object}
	 */
	normalize(initX, initY) {
		let x = initX;
		let y = initY;

		if( typeof(x) != 'number' ) {
			throw new Error('Grid x-coordinate must be an integer');
		}
		if( typeof(y) != 'number' ) {
			throw new Error('Grid y-coordinate must be an integer');
		}

		let outOfBounds = false;

		// Offset each value by grid width/height until value is within grid boundaries.
		while( x < 0 ) {
			x += this.width;
			outOfBounds = true;
		}
		while( x >= this.width ) {
			x -= this.width;
			outOfBounds = true;
		}
		while( y < 0 ) {
			y += this.height;
			outOfBounds = true;
		}
		while( y >= this.height ) {
			//return false;
			y -= this.height;
			outOfBounds = true;
		}

		// Check if coordinate falls outside grid and this.wrap has not been enabled
		if( outOfBounds && !this.wrap ) {
			return false;
		}

		return {x, y};
	}

	normalizeBounds(bounds) {
		const normMinBounds = this.normalize(bounds.min.x, bounds.min.y) || {x: 0, y: 0};
		const normMaxBounds = this.normalize(bounds.max.x, bounds.max.y) || {x: this.width - 1, y: this.height - 1};

		return {
			min:	normMinBounds,
			max:	normMaxBounds
		};
	}

	getPoints() {
		return this.points;
	}

	getMetaPoints() {
		return this.meta;
	}

	getDataPoints() {
		return this.data;
	}

	/**
	 * Get value at coordinates (x, y) from this.points.
	 *
	 * @method	getPoint
	 * @public
	 * @return	{integer}
	 */
	getPoint(x, y, applyFilter = false) {
		const coords = this.normalize(x, y);
		let point;

		if( coords ) {
			point = this.points[coords.y][coords.x];

			if( applyFilter ) {
				point = this.filterPoint(point, coords.x, coords.y);
			}
		}

		return point;
	}

	/**
	 * Get a random point. Optional min and max bound parameters.
	 *
	 * @method	getRandomPoint
	 * @public
	 * @param		{object}		minBound		Minimum normalized bounds
	 * @param		{object}		maxBound		Maximum normalized bounds
	 * @return	{object}					An object containing the x- and y-coordinates of the point, as well as its value
	 */
	getRandomPoint(minBound = {x: 0, y: 0}, maxBound = {x: this.width - 1, y: this.height - 1}) {
		const normMinBound	= this.normalize(minBound.x, minBound.y);
		const normMaxBound	= this.normalize(maxBound.x, maxBound.y);
		const randX		= normMinBound.x + Math.floor( Math.random() * (normMaxBound.x - normMinBound.x) );
		const randY		= normMinBound.y + Math.floor( Math.random() * (normMaxBound.y - normMinBound.y) );
		const randPoint	= {
			x: randX,
			y: randY,
			value: this.getPoint(randX, randY)
		};

		return randPoint;
	}

	/**
	 * Get value at coordinates (x, y) from this.scratch
	 *
	 * @method	getScratchPoint
	 * @public
	 * @return	{integer}
	 */
	getScratchPoint(x, y) {
		if( !this.hasScratch ) {
			return;
		}

		const coords = this.normalize(x, y);

		if( coords ) {
			return this.scratch[coords.y][coords.x];
		}

		return false;
	}

	/**
	 * Get metavalue at coordinates (x, y) from this.meta
	 *
	 * @method	getMetaPoint
	 * @public
	 * @return	{object}
	 */
	getMetaPoint(x, y, applyFilter = false) {
		if( !this.hasMeta ) {
			return;
		}

		const coords = this.normalize(x, y);

		if( coords ) {
			var meta = this.meta[coords.y][coords.x];

			// NOTE: meta filters not yet implemented
			/*
			if( applyFilter ) {
				meta = this.filterPoint(meta, coords.x, coords.y);
			}
			*/

			return meta;
		}

		return false;
	}

	/**
	 * Get value at coordinates (x, y) from this.data
	 *
	 * @method	getDataPoint
	 * @public
	 * @return	{object}
	 */
	getDataPoint(x, y) {
		if( !this.hasData ) {
			return;
		}

		const coords = this.normalize(x, y);

		if( coords ) {
			return this.data[coords.y][coords.x];
		}

		return false;
	}

	setPoint(x, y, value) {
		var normalized = this.normalize(x, y);

		if( normalized ) {
			this.points[normalized.y][normalized.x] = value;
		}
	}

	setScratchPoint(x, y, value) {
		if( !this.hasScratch ) {
			return;
		}

		const normalized = this.normalize(x, y);

		if( normalized ) {
			this.scratch[normalized.y][normalized.x] = value;
		}
	}

	setMetaPoint(x, y, value) {
		if( !this.hasMeta ) {
			return;
		}

		const normalized = this.normalize(x, y);

		if( normalized ) {
			this.meta[normalized.y][normalized.x] = value;
		}
	}

	setDataPoint(x, y, value) {
		if( !this.hasData ) {
			return;
		}

		const normalized = this.normalize(x, y);

		if( normalized ) {
			this.data[normalized.y][normalized.x] = value;
		}
	}

	/**
	 * Sets a value for a metaPoint property.
	 *
	 * @method	updateMetaProp
	 * @public
	 * @param		{integer}		x		X-coordinate
	 * @param		{integer}		y		Y-coordinate
	 * @param		{string}		prop		A metaPoint object property
	 * @param		{object}		value	Value to set
	 */
	updateMetaProp(x, y, prop, value) {
		const normalized = this.normalize(x, y);

		if( normalized ) {
			this.meta[normalized.y][normalized.x][prop] = value;
		}
	}

	/**
	 * Adds a value into a metaPoint property array.
	 *
	 * @method	pushMetaProp
	 * @public
	 * @param		{integer}		x		X-coordinate
	 * @param		{integer}		y		Y-coordinate
	 * @param		{string}		prop		A metaPoint object property
	 * @param		{object}		value	Value to add to array
	 */
	pushMetaProp(x, y, prop, value) {
		const normalized = this.normalize(x, y);

		if( normalized ) {
			this.meta[normalized.y][normalized.x][prop].push(value);
		}
	}

	static hexToType(hexArg, emptyTypes = false) {
		let north = false;
		let south = false;
		let east = false;
		let west = false;
		let nw = false;
		let ne = false;
		let se = false;
		let sw = false;
		let center	= false;
		let count		= 0;
		let corners	= 0;
		let edges		= 0;
		let rotations	= 0;
		let type = 'empty';
		let hex = hexArg;

		if( hex == 0 ) {
			return {type, rotations};
		}
		if( hex >= 256 ) {
			hex -= 256;
			center = true;
		}
		if( hex >= 128 ) {
			hex -= 128;
			ne = true;
			count++;
			corners++;
		}
		if( hex >= 64 ) {
			hex -= 64;
			se = true;
			count++;
			corners++;
		}
		if( hex >= 32 ) {
			hex -= 32;
			sw = true;
			count++;
			corners++;
		}
		if( hex >= 16 ) {
			hex -= 16;
			nw = true;
			count++;
			corners++;
		}
		if( hex >= 8 ) {
			hex -= 8;
			north = true;
			count++;
			edges++;
		}
		if( hex >= 4 ) {
			hex -= 4;
			east = true;
			count++;
			edges++;
		}
		if( hex >= 2 ) {
			hex -= 2;
			south = true;
			count++;
			edges++;
		}
		if( hex >= 1 ) {
			hex -= 1;
			west = true;
			count++;
			edges++;
		}

		if( !center ) {
			if( edges == 1 ) {
				type = 'shore';

				if( north ) {
					// no rotation
				} else if( east ) {
					rotations += 1;
				} else if( south ) {
					rotations += 2;
				} else if( west ) {
					rotations += 3;
				}
			} else if( edges == 2 ) {
				if( north && south || east && west ) {
					type = 'channel';

					if( north ) {
						// no rotations
					} else {
						rotations += 1;
					}
				} else {
					type = 'riverbend';

					if( west && north ) {
						// no rotations
					} else if( north && east ) {
						rotations += 1;
					} else if( east && south ) {
						rotations += 2;
					} else if( south && west ) {
						rotations += 3;
					}
				}
			} else if( edges == 3 ) {
				type = 'cove';

				if( !north ) {
					// no rotation
				} else if( !east ) {
					rotations += 1;
				} else if( !south ) {
					rotations += 2;
				} else if( !west ) {
					rotations += 3;
				}
			} else {
				type = 'lake';
			}

			return {type, rotations};
		}

		if( edges == 0 || corners == count ) {
			type = 'island';

			return {type, rotations};
		}

		if( edges == 1 ) {
			type = 'end';

			if( north ) {
				// no rotations
			} else if( east ) {
				rotations += 1;
			} else if( south ) {
				rotations += 2;
			} else if( west ) {
				rotations += 3;
			}
		} else if( edges == 2 ) {
			if( north && south || east && west ) {
				type = 'pipe';

				if( east ) {
					rotations += 1;
				}
			} else {
				type = 'elbow';

				if( north && west ) {
					// no rotations

					if( nw ) {
						type = 'corner';

						if( ne && sw ) {
							//type = 'diagonal';
						}
					}
				} else if( north && east ) {
					rotations += 1;

					if( ne ) {
						type = 'corner';

						if( nw && se ) {
							//type = 'diagonal';
						}
					}
				} else if( east && south ) {
					rotations += 2;

					if( se ) {
						type = 'corner';

						if( ne && sw ) {
							//type = 'diagonal';
						}
					}
				} else {
					rotations += 3;

					if( sw ) {
						type = 'corner';

						if( nw && se ) {
							//type = 'diagonal';
						}
					}
				}
			}
		} else if( edges == 3 ) {
			if( corners == 0 ) {
				type = 'tee';
			} else if( corners == 1 || corners == 2 || corners == 3 ) {
				type = 'tee';

				if( !south ) {
					if( nw ) {
						type = 'kayleft';
					}
					if( ne ) {
						type = 'kayright';
					}
					if( nw && ne ) {
						type = 'edge';
					}
				}
				if( !west ) {
					if( ne ) {
						type = 'kayleft';
					}
					if( se ) {
						type = 'kayright';
					}
					if( ne && se ) {
						type = 'edge';
					}
				}
				if( !north ) {
					if( se ) {
						type = 'kayleft';
					}
					if( sw ) {
						type = 'kayright';
					}
					if( se && sw ) {
						type = 'edge';
					}
				}
				if( !east ) {
					if( sw ) {
						type = 'kayleft';
					}
					if( nw ) {
						type = 'kayright';
					}
					if( sw && nw ) {
						type = 'edge';
					}
				}
			} else if( corners == 4 ) {
				type = 'edge';
			}

			if( !north ) {
				rotations += 2;
			} else if( !east ) {
				rotations += 3;
			} else if( !south ) {
				// no rotations
			} else if( !west ) {
				rotations += 1;
			}
		} else if( edges == 4 ) {
			if( corners == 0 ) {
				type = 'cross';
			} else if( corners == 1 ) {
				type = 'wye';

				if( ne ) {
					rotations += 1;
				} else if( se ) {
					rotations += 2;
				} else if( sw ) {
					rotations += 3;
				}
			} else if( corners == 2 ) {
				if( (nw && se) || (ne && sw) ) {
					type = 'eight';

					if( ne ) {
						rotations += 1;
					}
				} else {
					type = 'edgetee';

					if( nw && ne ) {
						// no rotations
					} else if( ne && se ) {
						rotations += 1;
					} else if( sw && se ) {
						rotations += 2;
					} else if( nw && sw ) {
						rotations += 3;
					}
				}
			} else if( corners == 3 ) {
				type = 'bend';

				if( !se ) {
					// no rotations
				} else if( !sw ) {
					rotations += 1;
				} else if( !nw ) {
					rotations += 2;
				} else {
					rotations += 3;
				}
			} else if( corners == 4 ) {
				type = 'inside';
			}
		}

		return {type, rotations};
	}

	/**
	 * Shifts all points by x and y amounts.
	 *
	 * @method	translate
	 * @public
	 *
	 * @param		{integer}		xOffset		Amount to shift along x-axis
	 * @param		{integer}		yOffset		Amount to shift along y-axis
	 * @return	{Grid}
	 */
	translate(xOffset = 0, yOffset = 0) {
		this.copyToScratch().empty().eachScratchPoint((scratchPoint, x, y) => {
			if( scratchPoint ) {
				this.setPoint(x + xOffset, y + yOffset, 1);
			}
		});

		return this;
	}

	/**
	 * Mirrors the grid's points along a vertical axis.
	 *
	 * @method	flipHorizontally
	 * @public
	 */
	flipHorizontally() {
		this.copyToScratch();

		this.eachScratchPoint((point, x, y) => {
			var newX = this.width - x - 1;

			this.setPoint(newX, y, point);
		});

		return this;
	}

	/**
	 * Mirrors the grid's points along a horizontal axis.
	 *
	 * @method	flipVertically
	 * @public
	 */
	flipVertically() {
		this.copyToScratch();

		this.eachScratchPoint((point, x, y) => {
			var newY = this.height - y - 1;

			this.setPoint(x, newY, point);
		});

		return this;
	}

	invert() {
		this.copyToScratch();

		this.eachScratchPoint((point, x, y) => {
			var inverted = 0;

			if( !point ) {
				inverted = 1;
			}

			this.setPoint(x, y, inverted);
		});

		return this;
	}

	/**
	 * Rotate the entire grid 90 degrees clockwise.
	 *
	 * @method	rotate
	 * @public
	 */
	rotate() {
		this.copyToScratch();

		this.eachScratchPoint((point, x, y) => {
			const start	= {x, y};
			const end	= {x: 0, y: 0};
			const pivot	= {
				x: (this.width + 1) / 2,
				y: (this.height + 1) / 2
			};

			start.x += 1;
			start.y += 1;

			start.x -= pivot.x;
			start.y -= pivot.y;

			end.x = -1 * start.y;
			end.y = start.x

			end.x += pivot.x;
			end.y += pivot.y;

			end.x -= 1;
			end.y -= 1;

			this.setPoint(end.x, end.y, point);
		});

		return this;
	}

	findExtremes() {
		let unset		= true;
		let xLowest		= false;
		let yLowest		= false;
		let xHighest	= false;
		let yHighest	= false;

		this.eachPoint((point, x, y) => {
			if( point ) {
				if( unset ) {
					xLowest = x;
					yLowest = y;
					xHighest = x;
					yHighest = y;
					unset = false;
				} else {
					if( x < xLowest ) {
						xLowest = x;
					}
					if( y < yLowest ) {
						yLowest = y;
					}
					if( x > xHighest ) {
						xHighest = x;
					}
					if( y > yHighest ) {
						yHighest = y;
					}
				}
			}
		});

		return {
			lowest:	{x: xLowest, y: yLowest},
			highest:	{x: xHighest, y: yHighest}
		};
	}

	// Set each point's value based on its number of neighbors and where those neighbors lie
	setHexValues(filterRule = false, clearFilter = true, emptyTypes = false) {
		this.eachPoint((point, x, y) => {
			let value			= 0;
			let numNeighbors	= 0;
			let numCorners		= 0;
			const neighbors	= {n: false, ne: false, e: false, se: false, s: false, sw: false, w: false, nw: false};
			let edge				= false;
			let inside			= false;
			const filterPoints	= (this.pointFilter);

			// Self
			if( point ) {
				value += 256;
			}
			// NE
			if( this.getPoint(x + 1, y - 1, filterPoints) ) {
				value += 128;
				numNeighbors++;
				numCorners++;
				neighbors.ne = true;
			}
			// SE
			if( this.getPoint(x + 1, y + 1, filterPoints) ) {
				value += 64;
				numNeighbors++;
				numCorners++;
				neighbors.se = true;
			}
			// SW
			if( this.getPoint(x - 1, y + 1, filterPoints) ) {
				value += 32;
				numNeighbors++;
				numCorners++;
				neighbors.sw = true;
			}
			// NW
			if( this.getPoint(x - 1, y - 1, filterPoints) ) {
				value += 16;
				numNeighbors++;
				numCorners++;
				neighbors.nw = true;
			}
			// N
			if( this.getPoint(x, y - 1, filterPoints) ) {
				value += 8;
				numNeighbors++;
				neighbors.n = true;
			}
			// E
			if( this.getPoint(x + 1, y, filterPoints) ) {
				value += 4;
				numNeighbors++;
				neighbors.e = true;
			}
			// S
			if( this.getPoint(x, y + 1, filterPoints) ) {
				value += 2;
				numNeighbors++;
				neighbors.s = true;
			}
			// W
			if( this.getPoint(x - 1, y, filterPoints) ) {
				value += 1;
				numNeighbors++;
				neighbors.w = true;
			}

			// Inside
			if( value == 511) {
				inside = true;
			}

			// Edge
			if( value >= 256 && value < 511 ) {
				edge = true;

				if( numNeighbors == 6 && numCorners == 2 ) {
					edge		= false;
					inside	= true;
				}
				if( numNeighbors == 7 && numCorners == 3 ) {
					edge		= false;
					inside	= true;
				}
			}

			let data = this.constructor.hexToType(value, emptyTypes);

			// Apply filtering rule to filled points
			if( point && filterRule ) {
				data = this.constructor.applyHexFilter(filterRule, data);
			}

			this.updateMetaProp(x, y, 'hex', value);
			this.updateMetaProp(x, y, 'numNeighbors', numNeighbors);
			this.updateMetaProp(x, y, 'neighbors', neighbors);
			this.updateMetaProp(x, y, 'edge', edge);
			this.updateMetaProp(x, y, 'inside', inside);
			this.updateMetaProp(x, y, 'rotations', data.rotations);
			this.updateMetaProp(x, y, 'type', data.type);
			//this.updateMetaProp(x, y, 'depth', 0);
		}, clearFilter);

		return this;
	}

	// Replace neighbor boolean values with hex/integer values
	setHexRelationships() {
		const nghbrOrder = ['ne', 'se', 'sw', 'nw', 'n', 'e', 's', 'w'];

		this.eachPoint((point, x, y) => {
			if( point ) {
				const metaPoint	= this.getMetaPoint(x, y);
				const neighbors	= this.getNeighbors(x, y);
				let index		= 0;

				this.withPoints(neighbors, (point, nx, ny) => {
					if( point ) {
						const neighborMeta = this.getMetaPoint(nx, ny);
						const direction = nghbrOrder[index];

						metaPoint.neighbors[direction] = neighborMeta.type;
					}

					index++;
				});

				this.setMetaPoint(x, y, metaPoint);
			}
		}, false);

		return this;
	}

	/*
	applyVariations(tileset) {
		this.eachPoint((point, x, y) => {
			if( point ) {
				var metaPoint	= this.getMetaPoint(x, y);
				var possible	= Tilesets[tileset][metaPoint.type][metaPoint.rotations];
				var variation	= Math.floor( Math.random() * possible );

				this.updateMetaProp(x, y, 'variation', variation);
			}
		});

		return this;
	}
	*/

	/**
	 * Adjusted a point's "type" and "rotation" metavalues according to a filtering rule.
	 *
	 * @method	applyHexFilter
	 * @private
	 * @param		{object}		hexData		Point data object containing "type" and "rotation" properties
	 * @return	{object}
	 */
	static applyHexFilter(filter, hexData) {
		const filteredRule	= filter.rules[hexData.type];
		const whitelisted		= (filter.whitelist.indexOf(hexData.type) != -1);

		// If "type" is on the whitelist or no matching filter was found from the table, send back the original data untouched
		if( whitelisted || !filter ) {
			return hexData;
		}

		// If no defined specific rule, fallback to the filter's default
		if( !filteredRule ) {
			return filter.default;
		}

		return filteredRule[hexData.rotations];
	}

	growPoints(greedy = false, chance = 50) {
		const percentChance = chance / 100;

		this.copyToScratch();

		this.eachScratchPoint((scratchPoint, x, y) => {
			if( scratchPoint ) {
				const metaPoint = this.getMetaPoint(x, y);

				// Copy over scratch data
				this.setPoint(x, y, 1);

				// Only expand edge points
				if( metaPoint.edge ) {
					// Set the ordinal direction neighbors as true
					var args = [
						{
							x: x - 1,
							y
						},
						{
							x: x + 1,
							y
						},
						{
							x,
							y: y - 1
						},
						{
							x,
							y: y + 1
						}
					];

					for(const arg of args) {
						if( Math.random() < percentChance ) {
							this.setPoint(arg.x, arg.y, 1);
						}
					}

					if( greedy ) {
						// Set the diagonal direction neighbors as true
						this.setPoint(x - 1, y - 1, 1);
						this.setPoint(x - 1, y + 1, 1);
						this.setPoint(x + 1, y - 1, 1);
						this.setPoint(x + 1, y + 1, 1);
					}
				}
			}
		}, false);

		this.setHexValues(false, false);

		return this;
	}

	erodePoints(chance = 50) {
		const percentChance = chance / 100;

		this.copyToScratch();

		this.eachScratchPoint((scratchPoint, x, y) => {
			if( scratchPoint ) {
				var metaPoint = this.getMetaPoint(x, y);

				// Only retain inside points from scratch
				if( metaPoint.inside ) {
					this.setPoint(x, y, 1);
				}
				if( metaPoint.edge && Math.random() < percentChance ) {
					this.setPoint(x, y, 0);
				}
			}
		});

		this.setHexValues();

		return this;
	}

	/**
	 * Expands filled edge points into neighboring cells. Requires that hex values be set.
	 *
	 * @method	expandPoints
	 * @public
	 *
	 * @param		{boolean}		greedy	If true, all eight neighboring cells are modified rather than just the cardinal four
	 */
	expandPoints(greedy = false, size = 1) {
		this.copyToScratch();

		this.eachScratchPoint((scratchPoint, x, y) => {
			if( scratchPoint ) {
				const metaPoint = this.getMetaPoint(x, y);

				// Copy over scratch data
				this.setPoint(x, y, 1);

				// Only expand edge points
				if( metaPoint.edge ) {
					if( greedy ) {
						// Create a shape of points around the primary point to expand into
						let shape;

						// Modify the shape of the expansion region depending on size
						if( size == 1 ) {
							shape = this.getRectangle({x: x - 1, y: y - 1}, {x: x + 1, y: y + 1});
						} else {
							shape = this.constructor.getCircle({x, y}, size);
						}

						this.withPoints(shape, (point, x, y) => {
							this.setPoint(x, y, 1);
						});
					} else {
						// Set the cardinal direction neighbors as true
						const args = [
							{
								x: x - 1,
								y
							},
							{
								x: x + 1,
								y
							},
							{
								x,
								y: y - 1
							},
							{
								x,
								y: y + 1
							}
						];

						for(const arg of args) {
							this.setPoint(arg.x, arg.y, 1);
						}
					}
				}
			}
		});

		this.setHexValues();

		return this;
	}

	/**
	 * Strips filled edge points. Requires that hex values be set.
	 *
	 * @method	shrinkPoints
	 * @public
	 */
	shrinkPoints() {
		this.copyToScratch();

		this.eachScratchPoint((scratchPoint, x, y) => {
			if( scratchPoint ) {
				const metaPoint = this.getMetaPoint(x, y);

				// Only retain inside points from scratch
				if( metaPoint.inside ) {
					this.setPoint(x, y, 1);
				}
			}
		});

		this.setHexValues();

		return this;
	}

	/**
	 * Copies over points values into a new grid.
	 *
	 * @method	clone
	 * @public
	 * @return 	{Grid}
	 */
	clone() {
		const clone = new Grid(this.width, this.height, this.wrap);

		this.eachPoint((point, x, y) => {
			if( point ) {
				clone.setPoint(x, y, 1);
			}
		});

		return clone;
	}

	resize(negativeDir = {x: 0, y: 0}, positiveDir = {x: 0, y: 0}, pointDefault = 0, dataDefaultFunc = function() {}) {
		// Adjust in X-direction
		for(let y = 0; y < this.height; y++) {
			for(let i = 0, diff = Math.abs(positiveDir.x); i < diff; i++) {
				if( positiveDir.x > 0 ) {
					this.points[y].push(pointDefault);

					if( this.hasScratch ) {
						this.scratch[y].push(0);
					}
					if( this.hasData ) {
						this.data[y].push( dataDefaultFunc(this.width + i, y) );
					}
					if( this.hasMeta ) {
						this.meta[y].push( this.constructor.createBlankMeta() );
					}
				} else {
					this.points[y].pop();

					if( this.hasScratch ) {
						this.scratch[y].pop();
					}
					if( this.hasData ) {
						this.data[y].pop();
					}
					if( this.hasMeta ) {
						this.meta[y].pop();
					}
				}
			}
		}

		this.width += (negativeDir.x + positiveDir.x);
		this.height += (negativeDir.y + positiveDir.y);

		// Adjust in Y-direction

		/*
		for negativeDir.y
		+y: unshift rows
		-y: shift rows
		*/

		for(let i = 0, diff = Math.abs(positiveDir.y); i < diff; i++) {
			if( positiveDir.y > 0 ) {
				const pointRow	= [];
				const scratchRow	= [];
				const metaRow	= [];
				const dataRow	= [];

				for(let x = 0; x < this.width; x++) {
					pointRow.push(pointDefault);
					scratchRow.push(0);
					dataRow.push( dataDefaultFunc(x, this.height + i) );
					metaRow.push( this.constructor.createBlankMeta() );
				}

				this.points.push(pointRow);

				if( this.hasScratch ) {
					this.scratch.push(scratchRow);
				}
				if( this.hasMeta ) {
					this.meta.push(metaRow);
				}
				if( this.hasData ) {
					this.data.push(dataRow);
				}
			} else {
				this.points.pop();

				if( this.hasScratch ) {
					this.scratch.pop();
				}
				if( this.hasMeta ) {
					this.meta.pop();
				}
				if( this.hasData ) {
					this.data.pop();
				}
			}
		}
	}

	subtractGrid(gridObj, offset = {x: 0, y: 0}) {
		// Reset point and meta values
		gridObj.eachPoint((point, x, y) => {
			const adjX = x + offset.x;
			const adjY = y + offset.y;

			if( point ) {
				this.setPoint(adjX, adjY, 0);
			}
			if( this.hasMeta ) {
				this.setMetaPoint(adjX, adjY, this.constructor.createBlankMeta());
			}
			if( this.hasScratch ) {
				this.setScratchPoint(adjX, adjY, 0);
			}
			if( this.hasData ) {
				this.setDataPoint(adjX, adjY, undefined);
			}
		});

		return this;
	}

	/**
	 * Merges another grid's points into this one's.
	 *
	 * @method	absorbGrid
	 * @public
	 * @param		{Grid}	gridObj	A Grid object
	 * @param		{object}	offset	A point object
	 */
	absorbGrid(gridObj, offset = {x: 0, y: 0}) {
		// Copy over point values
		gridObj.eachPoint((point, x, y) => {
			if( point ) {
				const adjX = x + offset.x;
				const adjY = y + offset.y;

				this.setPoint(adjX, adjY, point);
			}
		});

		if( this.hasMeta ) {
			// Copy over metapoint values
			gridObj.eachMetaPoint((metapoint, x, y) => {
				const adjX = x + offset.x;
				const adjY = y + offset.y;

				// Clone the meta point object
				for(const prop in metapoint) {
					const value = metapoint[prop];

					this.updateMetaProp(adjX, adjY, prop, value);
				}
			});
		}

		if( this.hasScratch ) {
			// Copy over scratch values
			gridObj.eachScratchPoint((scratchpoint, x, y) => {
				if( scratchpoint ) {
					const adjX = x + offset.x;
					const adjY = y + offset.y;

					this.setScratchPoint(adjX, adjY, scratchpoint);
				}
			});
		}

		if( this.hasData ) {
			// Copy over datapoint values
			gridObj.eachDataPoint((datapoint, x, y) => {
				const adjX = x + offset.x;
				const adjY = y + offset.y;

				const clonedData = datapoint.clone();

				this.setDataPoint(adjX, adjY, clonedData);
			});
		}

		return this;
	}

	populate(percent = 50) {
		let chance = (1 - (percent / 100)) || 0.5;

		if( percent == 100 ) {
			chance = 0;
		}

		this.eachPoint((point, x, y) => {
			if( Math.random() > chance ) {
				this.setPoint(x, y, 1);
			}
		});

		return this;
	}

	depopulate(percent = 50) {
		let chance = (1 - (percent / 100)) || 0.5;

		if( percent == 100 ) {
			chance = 0;
		}

		this.eachPoint((point, x, y) => {
			if( Math.random() > chance ) {
				this.setPoint(x, y, 0);
			}
		});

		return this;
	}

	//strictMode = false
	fill(minNeighbors = 8) {
		this.eachMetaPoint((metapoint, x, y) => {
			if( metapoint.numNeighbors >= minNeighbors ) {
				this.setPoint(x, y, 1);
			}
		});

		return this;
	}

	/**
	 * Set any points that don't meet the minimum neighbor threshold to zero.
	 *
	 * @method	winnow
	 * @public
	 * @param		{integer}		minNeighbors		Minimum number of non-zero neighbors a point must have to retain its value.
	 * @param		{boolean}		strictMode			If set to true, counting will ignore diagonal neighbors
	 */
	winnow(minNeighbors, strictMode = false) {
		this.copyToScratch();

		this.eachScratchPoint((point, x, y) => {
			if( !point ) {
				return;
			}

			let count = 0;

			// Get all eight of point's neighbor points
			for(let i = -1; i < 2; i++) {
				yLoop:
				for(let j = -1; j < 2; j++) {
					if( i == 0 && j == 0) {
						continue yLoop;
					}
					if( strictMode ) {
						if( i == j ) {
							continue yLoop;
						}
						if( i + j == 0 ) {
							continue yLoop;
						}
					}

					const neighbor = this.getScratchPoint(x + i, y + j);

					// Count any neighbor points with non-zero values
					if( neighbor != 0 ) {
						count++;
					}
				}
			}

			// Zero the point if it doesn't meet minimum threshold
			if( count < minNeighbors ) {
				this.setPoint(x, y, 0);
			}
		});

		return this;
	}

	/**
	 * Checks if all supplied points match a specified metavalue.
	 *
	 * @method	pointsHaveMetaValue
	 * @public
	 * @param		{array}	points	An array of point objects
	 * @param		{string}	prop		A metapoint property
	 * @param		{string}	value	A metapoint value
	 * @return	{boolean}			Returns true if all metavalues match
	 */
	pointsHaveMetaValue(points, prop, value) {
		for(const point of points) {
			const metapoint = this.getMetaPoint(point.x, point.y);
			const metavalue = metapoint[prop];

			if( metavalue != value ) {
				return false;
			}
		}

		return true;
	}

	getEdge() {
		const points = [];

		this.eachMetaPoint((metapoint, x, y) => {
			if( metapoint.edge ) {
				points.push({x, y});
			}
		});

		return points;
	}

	getInside() {
		const points = [];

		this.eachMetaPoint((metapoint, x, y) => {
			if( metapoint.inside ) {
				points.push({x, y});
			}
		});

		return points;
	}

	static getLine(startPoint, endPoint) {
		const points = [];
		let slope = (endPoint.y - startPoint.y) / (endPoint.x - startPoint.x);
		let start;
		let end;

		if( startPoint.x == endPoint.x && startPoint.y == endPoint.y ) {
			return [];
		}

		if( Math.abs(slope) > 1 ) {
			slope = (endPoint.x - startPoint.x) / (endPoint.y - startPoint.y);

			if( startPoint.y < endPoint.y ) {
				start	= startPoint;
				end	= endPoint;
			} else {
				start	= endPoint;
				end	= startPoint;
			}

			const offset = start.x - slope * start.y;

			for(let {y} = start; y <= end.y; y++) {
				const x = Math.round(slope * y + offset);

				points.push({x, y});
			}
		} else {
			if( startPoint.x < endPoint.x ) {
				start	= startPoint;
				end	= endPoint;
			} else {
				start	= endPoint;
				end	= startPoint;
			}

			const offset = start.y - slope * start.x;

			for(let {x} = start; x <= end.x; x++) {
				const y = Math.round(slope * x + offset);

				points.push({x, y});
			}
		}

		return points;
	}

	getRectangle(pointOne, pointTwo) {
		const points = [];

		if( pointOne.x == pointTwo.x && pointOne.y == pointTwo.y ) {
			return [{x: pointOne.x, y: pointOne.y}];
		}

		const minBound = {
			x:	(pointTwo.x > pointOne.x ) ? pointOne.x : pointTwo.x,
			y:	(pointTwo.y > pointOne.y ) ? pointOne.y : pointTwo.y
		};

		const maxBound = {
			x:	(pointTwo.x < pointOne.x ) ? pointOne.x : pointTwo.x,
			y:	(pointTwo.y < pointOne.y ) ? pointOne.y : pointTwo.y
		};

		const bounds = this.normalizeBounds({min: minBound, max: maxBound});

		for(let {x} = bounds.min; x <= bounds.max.x; x++) {
			for(let {y} = bounds.min; y <= bounds.max.y; y++) {
				points.push({x, y});
			}
		}

		return points;
	}

	seedLoop(rawWidth, rawHeight, rawStart) {
		const start = rawStart || this.getRandomPoint();
		let width = rawWidth || ( Math.ceil(Math.random() * 60) + 9 );
		let height = rawHeight || ( Math.ceil(Math.random() * 60) + 9 );

		// North edge
		for(let x = 0, y = 0; x < width; x++) {
			if( this.getPoint(start.x + x, start.y + y) == undefined ) {
				width = x;
				break;
			}

			this.setPoint(start.x + x, start.y + y, 1);
		}

		// West edge
		for(let x = 0, y = 0; y < height; y++) {
			if( this.getPoint(start.x + x, start.y + y) == undefined ) {
				height = y;
				break;
			}

			this.setPoint(start.x + x, start.y + y, 1);
		}

		// South edge
		for(let x = 0, y = height - 1; x < width; x++) {
			if( this.getPoint(start.x + x, start.y + y) == undefined ) {
				break;
			}

			this.setPoint(start.x + x, start.y + y, 1);
		}

		// West edge
		for(let x = width - 1, y = 0; y < height; y++) {
			if( typeof(this.getPoint(start.x + x, start.y + y)) == 'undefined' ) {
				break;
			}

			this.setPoint(start.x + x, start.y + y, 1);
		}
	}

	static getCircle(origin, radius, type = 'all') {
		const points		= [];
		const offsetPoints	= [];

		// Check against "type" argument to see if point should be included. Optionally check for duplicate points
		const shouldIncludePoint = function(point, checkDupes = false) {
			if( point.type == type || type == 'all' ) {
				if( checkDupes ) {
					for(const testPoint of points) {
						if( testPoint.x == point.x && testPoint.y == point.y ) {
							return false;
						}
					}
				}

				return true;
			}

			return false;
		};

		// Get edge points on one 45 deg arc
		for(let i = 0; i < radius; i++) {
			const edgePoint = {type: 'edge'};
			let j = Math.sqrt( (radius * radius) - (i * i) );

			j = Math.round(j);

			if( !isNaN(j) ) {
				edgePoint.x = i;
				edgePoint.y = j;

				if( shouldIncludePoint(edgePoint) ) {
					points.push(edgePoint);
				}
			}
		}

		// Mirror the points into a 90 degree arc
		for(const index in points) {
			const point = points[index];
			const mirrorPoint = {type: 'edge'};

			// Skip any points that will turn out the same after being mirrored
			if( point.x == point.y ) {
				continue;
			}

			mirrorPoint.x = point.y;
			mirrorPoint.y = point.x;

			if( shouldIncludePoint(mirrorPoint, true) ) {
				points.push(mirrorPoint);
			}
		}

		// Add all points inside the arc
		let previousX;

		for(const index in points) {
			const point = points[index];

			// Ensure that the Y values don't repeat to avoid duplicate points
			if(point.x == previousX) {
				continue;
			}

			for(let insideY = point.y - 1; insideY > -1; insideY--) {
				const insidePoint = {type: 'interior'};

				insidePoint.x = point.x;
				insidePoint.y = insideY;

				if( shouldIncludePoint(insidePoint, true) ) {
					points.push(insidePoint);
				}
			}

			previousX = point.x;
		}

		// Mirror points about Y-axis
		for(const index in points) {
			const point = points[index];
			const mirrorPoint = {};

			if( point.x != 0 ) {
				mirrorPoint.x = -1 * point.x;
				mirrorPoint.y = point.y;
				mirrorPoint.type = point.type;

				if( shouldIncludePoint(mirrorPoint) ) {
					points.push(mirrorPoint);
				}
			}
		}

		// Mirror points about X-axis
		for(const index in points) {
			const point = points[index];
			const mirrorPoint = {};

			if( point.y != 0 ) {
				mirrorPoint.x = point.x;
				mirrorPoint.y = -1 * point.y;
				mirrorPoint.type = point.type;

				if( shouldIncludePoint(mirrorPoint) ) {
					points.push(mirrorPoint);
				}
			}
		}

		// Apply offset to points based on origin
		for(const index in points) {
			const point = points[index];
			const offsetPoint = {};

			offsetPoint.x = point.x + origin.x;
			offsetPoint.y = point.y + origin.y;

			offsetPoints.push(offsetPoint);
		}

		return offsetPoints;
	}

	getVectorPath() {
		let points = [];

		points = points.concat( this.getHull() );
		points = points.concat( this.getInterior() );

		return points;
	}

	getLeftMostPoint() {
		let startPoint = false;

		this.eachPoint((point, x, y) => {
			if( point ) {
				if( !startPoint ) {
					startPoint = {x, y};
				} else if(x < startPoint.x) {
					startPoint.x = x;
					startPoint.y = y;
				}
			}
		});

		return startPoint;
	}

	getHull() {
		const self = this;
		const startPoint	= this.getLeftMostPoint();
		const hullPoints	= [];
		const visited	= {};
		const dirs		= [
			{dir: 'e',	x: 1,	y: 0},
			//{dir: 'se',	x: 1,	y: 1},
			{dir: 's',	x: 0,	y: 1},
			//{dir: 'sw',	x: -1,	y: 1},
			{dir: 'w',	x: -1,	y: 0},
			//{dir: 'nw',	x: -1,	y: -1},
			{dir: 'n',	x: 0,	y: -1}
			//{dir: 'ne',	x: 1,	y: -1}
		];

		if( !startPoint ) {
			return [];
		}

		function hullBranch(sourcePoint) {
			const sourceMeta		= self.getMetaPoint(sourcePoint.x, sourcePoint.y);
			const visitedIndex	= sourcePoint.x + ',' + sourcePoint.y;

			if( sourceMeta.edge ) {
				if( !visited.hasOwnProperty(visitedIndex) ) {
					hullPoints.push({x: sourcePoint.x, y: sourcePoint.y});
					visited[visitedIndex] = true;

					for(var direction of dirs) {
						if( sourceMeta.neighbors[direction.dir] ) {
							var branchPoint = {
								x:	sourcePoint.x + direction.x,
								y:	sourcePoint.y + direction.y
							};

							hullBranch(branchPoint);
						}
					}
				}
			}
		}

		hullBranch(startPoint);

		return hullPoints;
	}

	getInterior() {
		const interiorPoints = [];

		this.eachPoint((point, x, y) => {
			if( point ) {
				const meta = this.getMetaPoint(x, y);

				if( meta.inside ) {
					interiorPoints.push({x, y});
				}
			}
		});

		return interiorPoints;
	}

	findSpace(width, height) {
		const testWidth	= width - 1;
		const testHeight	= height - 1;
		let freePoints	= false;

		this.eachPointRandom((point, x, y) => {
			if( point ) {
				const subRectangle	= this.getRectangle({x, y}, {x: x + testWidth, y: y + testHeight});
				let subIsFree		= true;

				// Check that all points in the rectangle are set
				this.withPoints(subRectangle, subPoint => {
					// If point is not set, area is not usable
					if( !subPoint ) {
						subIsFree = false;

						return true;
					}
				});

				// If freePoints found, break outer eachPoint loop
				if( subIsFree ) {
					freePoints = {
						starter:	{x, y},
						points:	subRectangle
					};

					return true;
				}
			}
		});

		return freePoints;
	}

	pathfind(start, end, bounds = false, noDiagonals = false) {
		let pathPoints	= [];
		let pathFound	= false;
		let grid;

		if( bounds ) {
			const subWidth	= bounds.max.x - bounds.min.x + 1;
			const subHeight	= bounds.max.y - bounds.min.y + 1;

			grid = new Grid(subWidth, subHeight);

			this.eachPointWithin(bounds.min, bounds.max, (point, x, y) => {
				if( point ) {
					grid.setPoint(x - bounds.min.x, y - bounds.min.y, 1);
				}
			});

			start.x -= bounds.min.x;
			start.y -= bounds.min.y;
			end.x -= bounds.min.x;
			end.y -= bounds.min.y;
		} else {
			grid = this.clone();
		}

		grid.invert().setHexValues();

		const directionCoords = {
			'n': {coords: {x: 0, y: -1}, diagonal: false, adjacent: ['nw', 'ne']},
			'e': {coords: {x: 1, y: 0}, diagonal: false, adjacent: ['ne', 'se']},
			's': {coords: {x: 0, y: 1}, diagonal: false, adjacent: ['sw', 'se']},
			'w': {coords: {x: -1, y: 0}, diagonal: false, adjacent: ['nw', 'sw']},
			'ne': {coords: {x: 1, y: -1}, diagonal: true, adjacent: ['n', 'e']},
			'se': {coords: {x: 1, y: 1}, diagonal: true, adjacent: ['s', 'e']},
			'sw': {coords: {x: -1, y: 1}, diagonal: true, adjacent: ['s', 'w']},
			'nw': {coords: {x: -1, y: -1}, diagonal: true, adjacent: ['n', 'w']}
		};

		/*
		function isNonSquareDirection(dir) {
			if( dir == 'ne' || dir == 'nw' || dir == 'se' || dir == 'sw' ) {
				return true;
			}

			return false;
		}
		*/

		function setAdjacentStepValues(basePoints, endPoint, step = 2) {
			let usableBasePoints = basePoints;

			if( step == 2 ) {
				grid.setPoint(usableBasePoints.x, usableBasePoints.y, 2);

				usableBasePoints = [usableBasePoints];
			}

			const nextBasePoints = [];

			for(const basePoint of usableBasePoints) {
				const meta = grid.getMetaPoint(basePoint.x, basePoint.y);

				for(const dir in meta.neighbors) {

					/*
					if( noDiagonals && isNonSquareDirection(dir) ) {
						continue;
					}
					*/

					const dirValue = meta.neighbors[dir];

					if( dirValue ) {
						const neighbor		= {x: basePoint.x + directionCoords[dir].coords.x, y: basePoint.y + directionCoords[dir].coords.y};
						const neighborValue	= grid.getPoint(neighbor.x, neighbor.y);

						if( neighbor.x == endPoint.x && neighbor.y == endPoint.y ) {
							pathFound = true; // end point has been reached
						}

						// If neighbor is diagonal, check adjacent non-diagonal neigbors to see if they are traversable.
						// A diagonal is only considered a valid path if all three spaces are free.
						if( directionCoords[dir].diagonal ) { // && !noDiagonals
							let diagAvailable = true;

							// For each of adjacenet neighbors
							for(const adjacentDir of directionCoords[dir].adjacent) {
								const adjNeighbor		= {x: basePoint.x + directionCoords[adjacentDir].coords.x, y: basePoint.y + directionCoords[adjacentDir].coords.y};
								const adjNeighborValue	= grid.getPoint(adjNeighbor.x, adjNeighbor.y);

								// If adjacenet neighbor is non-traversable, diagonal is not a valid option
								if( !adjNeighborValue ) {
									diagAvailable = false;
									break;
								}
							}

							if( !diagAvailable ) {
								pathFound = false;
								continue;
							}
						}

						if( neighborValue == 1 ) {
							grid.setPoint(neighbor.x, neighbor.y, step + 1);

							nextBasePoints.push(neighbor);
						}
					}
				}
			}

			// Recurse if the routine hasn't deadended without having hit the end point
			if( nextBasePoints.length > 0 && !pathFound ) {
				setAdjacentStepValues(nextBasePoints, endPoint, step + 1);
			}
		}

		// Supply points in reverse order, since at conclusion the path will be created from end to start
		setAdjacentStepValues(start, end);

		if( !pathFound ) {
			return false;
		}

		function assembleShortestPathPoints(grid, currentPoint, endPoint, path = []) {
			const point			= grid.getPoint(currentPoint.x, currentPoint.y);
			const meta			= grid.getMetaPoint(currentPoint.x, currentPoint.y);
			const possiblePoints	= [];
			let finished		= false;

			for(var dir in meta.neighbors) {

				/*
				if( noDiagonals && isNonSquareDirection(dir) ) {
					continue;
				}
				*/

				const dirValue = meta.neighbors[dir];

				if( dirValue ) {
					const neighbor		= {x: currentPoint.x + directionCoords[dir].coords.x, y: currentPoint.y + directionCoords[dir].coords.y};
					const neighborValue	= grid.getPoint(neighbor.x, neighbor.y);

					if( neighborValue == point - 1 ) {
						possiblePoints.push(neighbor);
					}
				}
			}

			if( possiblePoints.length == 0 ) {
				return path;
			}

			const randIndex = Math.floor( Math.random() * possiblePoints.length );
			const randPoint = possiblePoints[randIndex];

			if( randPoint.x == endPoint.x && randPoint.y == endPoint.y ) {
				finished = true;
			}

			path.push(randPoint);

			if( !finished ) {
				assembleShortestPathPoints(grid, randPoint, endPoint, path);
			}

			return path;
		}

		pathPoints = assembleShortestPathPoints(grid, end, start, [end]);

		// Offset points by min bounds
		if( bounds && pathPoints ) {
			for(const point of pathPoints) {
				point.x += bounds.min.x;
				point.y += bounds.min.y;
			}
		}

		return pathPoints;
	}
}

module.exports = Grid;
