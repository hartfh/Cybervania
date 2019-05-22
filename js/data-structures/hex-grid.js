const HexCompass = require('./hex-compass');
const {HEX_DIRECTIONS} = require('../../data/strings');
//const NEIGHBORS_DIRS = ['n', 'ne', 'se', 's', 'sw', 'nw'];


class HexGrid {
	constructor(width, height, config = {}, createDataExemplar = () => {}) {
		this.width = width;
		this.height = height;
		this.scratch = [];
		this.points = [];
		this.meta = [];
		this.data = [];
		this.pointFilter = false;
		this.wrapX = Boolean( config.wrapX );
		this.wrapY = Boolean( config.wrapY );
		this.hasMeta = !( config.meta === false );
		this.hasScratch = !( config.scratch === false );
		this.hasData = !( config.data === false );

		// Setup this.points/scratch/meta/data as two-dimensional arrays
		for(let y = 0; y < this.height; y++) {
			const pointRow = [];
			const scratchRow = [];
			const metaRow = [];
			const dataRow = [];

			for(let x = 0; x < this.width; x++) {
				pointRow.push(0);
				scratchRow.push(0);
				dataRow.push( createDataExemplar() );
				metaRow.push( this.constructor.createBlankMeta(x, y) );
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

		this.eachPoint((point, x, y) => {
			const xMod = x % 2;
			const even = (xMod == 0);
			const odd = (xMod == 1);

			if(even) {
				this.setMetaPoint(x, y, {offset: true});
			}

			// s
			if( y < this.height - 1 ) {
				const coords = this.getDirectionCoords(x, y, HEX_DIRECTIONS[3], true);

				this.setMetaPoint(x, y, {
					[HEX_DIRECTIONS[3]]: this.normalize(coords.x, coords.y)
				});
			}

			// n
			if( y > 0 ) {
				const coords = this.getDirectionCoords(x, y, HEX_DIRECTIONS[0], true);

				this.setMetaPoint(x, y, {
					[HEX_DIRECTIONS[0]]: this.normalize(coords.x, coords.y)
				});
			}

			// nw
			if( y > 0 || even ) {
				const coords = this.getDirectionCoords(x, y, HEX_DIRECTIONS[5], even);

				this.setMetaPoint(x, y, {
					[HEX_DIRECTIONS[5]]: this.normalize(coords.x, coords.y)
				});
			}
			// sw
			if( y < this.height - 1 || odd ) {
				const coords = this.getDirectionCoords(x, y, HEX_DIRECTIONS[4], even);

				this.setMetaPoint(x, y, {
					[HEX_DIRECTIONS[4]]: this.normalize(coords.x, coords.y)
				});
			}

			// ne
			if( y > 0 || even ) {
				const coords = this.getDirectionCoords(x, y, HEX_DIRECTIONS[1], even);

				this.setMetaPoint(x, y, {
					[HEX_DIRECTIONS[1]]: this.normalize(coords.x, coords.y)
				});
			}
			// se
			if( y < this.height - 1 || odd ) {
				const coords = this.getDirectionCoords(x, y, HEX_DIRECTIONS[2], even);

				this.setMetaPoint(x, y, {
					[HEX_DIRECTIONS[2]]: this.normalize(coords.x, coords.y)
				});
			}
		});
	}

	getDirectionCoords(x, y, direction, offset) {
		let trueOffset;
		let dirX;
		let dirY;

		if(offset === true || offset === false) {
			trueOffset = offset;
		} else {
			trueOffset = this.getMetaPoint(x, y).offset;
		}

		if(trueOffset) {
			switch(direction) {
				// north
				case HEX_DIRECTIONS[0]:
					dirX = x;
					dirY = y - 1;
					break;
				// northeast
				case HEX_DIRECTIONS[1]:
					dirX = x + 1;
					dirY = y;
					break;
				// southeast
				case HEX_DIRECTIONS[2]:
					dirX = x + 1;
					dirY = y + 1;
					break;
				// south
				case HEX_DIRECTIONS[3]:
					dirX = x;
					dirY = y + 1;
					break;
				// southwest
				case HEX_DIRECTIONS[4]:
					dirX = x - 1;
					dirY = y + 1;
					break;
				// northwest
				case HEX_DIRECTIONS[5]:
					dirX = x - 1;
					dirY = y;
					break;
				default:
					break;
			}
		} else {
			switch(direction) {
				// north
				case HEX_DIRECTIONS[0]:
					dirX = x;
					dirY = y - 1;
					break;
				// northeast
				case HEX_DIRECTIONS[1]:
					dirX = x + 1;
					dirY = y - 1;
					break;
				// southeast
				case HEX_DIRECTIONS[2]:
					dirX = x + 1;
					dirY = y;
					break;
				// south
				case HEX_DIRECTIONS[3]:
					dirX = x;
					dirY = y + 1;
					break;
				// southwest
				case HEX_DIRECTIONS[4]:
					dirX = x - 1;
					dirY = y;
					break;
				// northwest
				case HEX_DIRECTIONS[5]:
					dirX = x - 1;
					dirY = y - 1;
					break;
				default:
					break;
			}
		}

		return {
			x: dirX,
			y: dirY
		};
	}

	static createBlankMeta(x = false, y = false) {
		return {
			edge: false,
			inside: false,
			//hex: 0,
			n: false,
			ne: false,
			se: false,
			s: false,
			sw: false,
			nw: false,
			numNeighbors: 0,
			offset: false,
			//rotations: 0,
			type: '',
			//variation: 0,
			x,
			y
		};
	}

	getDimensions() {
		return {
			height:	this.height,
			width:	this.width
		};
	}

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
			this.setMetaPoint(x, y, this.constructor.createBlankMeta());
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

		return this;
	}

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

	eachPointRandom(callback, minBound = {x: 0, y: 0}, maxBound = {x: this.width - 1, y: this.height - 1}, clearFilter = true) {
		const allPoints = [];
		const normMinBound = this.normalize(minBound.x, minBound.y);
		const normMaxBound = this.normalize(maxBound.x, maxBound.y);

		this.eachPointWithin(normMinBound, normMaxBound, (point, x, y) => {
			allPoints.push({x, y});
		});

		allPoints.randomize();

		for(let i = 0, len = allPoints.length; i < len; i++) {
			const {x, y} = allPoints[i];
			const point = this.filterPoint(this.getPoint(x, y), x, y);

			if( callback(point, x, y, this) ) {
				return;
			}
		}


		if( clearFilter && this.pointFilter ) {
			this.pointFilter = false;
		}
	}

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

	static getNeighbors(x, y) {

	}

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

	withPoints(points = [], callback) {
		for(const coord of points) {
			const point = this.getPoint(coord.x, coord.y);

			if( callback(point, coord.x, coord.y, this) ) {
				return;
			}
		}
	}

	copyToScratch() {
		this.eachPoint((point, x, y) => {
			this.setScratchPoint(x, y, point);
		}, false);

		return this;
	}

	copyFromScratch() {
		this.eachScratchPoint((point, x, y) => {
			this.setPoint(x, y, point);
		}, false);

		return this;
	}

	normalize(initX, initY) {
		let x = initX;
		let y = initY;

		if( typeof(x) != 'number' ) {
			throw new Error('Grid x-coordinate must be an integer');
		}
		if( typeof(y) != 'number' ) {
			throw new Error('Grid y-coordinate must be an integer');
		}

		let outOfBoundsX;
		let outOfBoundsY;

		// Offset each value by grid width/height until value is within grid boundaries.
		while( x < 0 ) {
			x += this.width;
			outOfBoundsX = true;
		}
		while( x >= this.width ) {
			x -= this.width;
			outOfBoundsX = true;
		}
		while( y < 0 ) {
			y += this.height;
			outOfBoundsY = true;
		}
		while( y >= this.height ) {
			y -= this.height;
			outOfBoundsY = true;
		}

		// Check if coordinate falls outside grid and wrapping has not been enabled
		if( outOfBoundsX && !this.wrapX ) {
			return false;
		}
		if( outOfBoundsY && !this.wrapY ) {
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

	getRandomPoint(minBound = {x: 0, y: 0}, maxBound = {x: this.width - 1, y: this.height - 1}) {
		const normMinBound = this.normalize(minBound.x, minBound.y);
		const normMaxBound = this.normalize(maxBound.x, maxBound.y);
		const randX = normMinBound.x + Math.floor( Math.random() * (normMaxBound.x - normMinBound.x) );
		const randY = normMinBound.y + Math.floor( Math.random() * (normMaxBound.y - normMinBound.y) );
		const randPoint = {
			x: randX,
			y: randY,
			value: this.getPoint(randX, randY)
		};

		return randPoint;
	}

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

	setMetaPoint(x, y, values) {
		if( !this.hasMeta ) {
			return;
		}

		const normalized = this.normalize(x, y);

		if( normalized ) {
			const metaValues = this.meta[normalized.y][normalized.x];

			this.meta[normalized.y][normalized.x] = {
				...metaValues,
				...values
			};
		}
	}

	setDataPoint(x, y, values) {
		if( !this.hasData ) {
			return;
		}

		const normalized = this.normalize(x, y);

		if( normalized ) {
			const dataValues = this.data[normalized.y][normalized.x];

			this.data[normalized.y][normalized.x] = {
				...dataValues,
				...values
			};
		}
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

	setMetaRelationships() {
		this.eachPoint((point, x, y) => {
			let count = 0;
			const metaPoint = this.getMetaPoint(x, y);

			HEX_DIRECTIONS.forEach(dir => {
				const nghbrCoords = metaPoint[dir];

				if(nghbrCoords) {
					let nghbrPoint = this.getPoint(nghbrCoords.x, nghbrCoords.y);

					nghbrPoint = this.filterPoint(nghbrPoint, nghbrCoords.x, nghbrCoords.y);

					if( nghbrPoint ) {
						count++;
					}
				}
			});

			this.setMetaPoint(x, y, {
				edge: (point && count !== 6),
				inside: (point && count === 6),
				numNeighbors: count
			});
		}, false);

		return this;
	}

	refresh() {
		this.setMetaRelationships();

		return this;
	}

	grow(chance = 50, additionalTest, alternateOperation) {
		const percentChance = chance / 100;

		this.copyToScratch();

		this.eachScratchPoint((scratchPoint, x, y) => {
			if( scratchPoint ) {
				const metaPoint = this.getMetaPoint(x, y);

				// Only expand edge points
				if( metaPoint.edge ) {
					// Set neighbors as true
					HEX_DIRECTIONS.forEach(dir => {
						const nghbrCoords = metaPoint[dir];

						if( nghbrCoords && Math.random() < percentChance ) {
							if((additionalTest && additionalTest(nghbrCoords.x, nghbrCoords.y, this)) || !additionalTest) {
								if( alternateOperation ) {
									alternateOperation(nghbrCoords.x, nghbrCoords.y, this);
								} else {
									this.setPoint(nghbrCoords.x, nghbrCoords.y, 1);
								}
							}
						}
					});
				}
			}
		}, false);

		return this;
	}

	erode() {

	}

	fill(minNeighbors = 6) {
		this.eachMetaPoint((metaPoint, x, y) => {
			if( metaPoint.numNeighbors >= minNeighbors ) {
				this.setPoint(x, y, 1);
			}
		});

		return this;
	}

	winnow(minNeighbors = 1) {
		this.eachMetaPoint((metaPoint, x, y) => {
			if( metaPoint.numNeighbors < minNeighbors ) {
				this.setPoint(x, y, 0);
			}
		});

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

	getBlobShape(startX, startY, maxLength = 20) {
		const visited = {};
		const compass = new HexCompass();
		let length = 1;
		let currentX = startX;
		let currentY = startY;

		compass.randomize();

		let randomDirs = [...compass.back.randomize(), ...compass.forward.randomize()];

		visited[`${startX}-${startY}`] = true;

		const path = [];

		mainLoop:
		while( length < maxLength ) {
			let pointSet = false;
			const metaPoint = this.getMetaPoint(currentX, currentY);

			dirLoop:
			for(let i = 0; i < randomDirs.length; i++) {
				const dir = randomDirs[i];
				const nghbr = metaPoint[dir];
				const key = `${nghbr.x}-${nghbr.y}`;

				if( this.hasInternalPoint(nghbr.x, nghbr.y) && !visited[key] ) {
					//this.setPoint(nghbr.x, nghbr.y, 1);

					pointSet = true;
					visited[key] = true;
					currentX = nghbr.x;
					currentY = nghbr.y;
					compass.dir = dir;
					//randomDirs = [...compass.back.randomize(), ...compass.forward.randomize()];

					if( Math.random() > 0.9 ) {
						randomDirs = compass.directions;
					}

					if( Math.random() > 0.22 ) {
						randomDirs = [...randomDirs.slice(1), randomDirs[0]];
					}

					path.push({x: currentX, y: currentY});

					length++;

					break dirLoop;
				}
			}

			if(!pointSet) {
				const prevPoint = path.pop();

				if( prevPoint ) {
					currentX = prevPoint.x;
					currentY = prevPoint.y;
				} else {
					break mainLoop;
				}
			}
		}

		return Object.keys(visited).map(coords => {
			const [x, y] = coords.split('-');

			return {
				x: parseInt(x),
				y: parseInt(y)
			};
		});
	}

	getRing(centerX, centerY, radius = 1) {
		const points = [];
		const compass = new HexCompass();
		const centerMetaPoint = this.getMetaPoint(centerX, centerY);
		let offset = centerMetaPoint.offset;
		const centerOffset = offset;
		let current;

		HEX_DIRECTIONS.forEach(dir => {
			compass.dir = dir;
			current = {
				x: centerX,
				y: centerY
			};
			offset = centerOffset;

			for(let i = 0; i < radius; i++) {
				const nextCoords = this.getDirectionCoords(current.x, current.y, compass.dir, offset);

				if(i === radius - 1) {
					points.push(nextCoords);
				}
				if(nextCoords.x !== current.x) {
					offset = !offset;
				}

				current = {
					x: nextCoords.x,
					y: nextCoords.y
				};
			}

			compass.rotate(2);

			for(let i = 0; i < radius - 1; i++) {
				const nextCoords = this.getDirectionCoords(current.x, current.y, compass.dir, offset);

				points.push(nextCoords);

				if(nextCoords.x !== current.x) {
					offset = !offset;
				}

				current = {
					x: nextCoords.x,
					y: nextCoords.y
				};
			}
		});

		return points;
	}

	castRays(x, y, test) {
		const rays = HEX_DIRECTIONS.reduce((aggregator, dir) => {
			aggregator[dir] = [];

			return aggregator;
		}, {});

		HEX_DIRECTIONS.forEach(dir => {
			let currentPoint = {x, y};

			rayLoop:
			while(true) {
				const metaPoint = this.getMetaPoint(currentPoint.x, currentPoint.y);
				const nextPointCoords = metaPoint[dir];

				if( !nextPointCoords || !test || !test(nextPointCoords.x, nextPointCoords.y) ) {
					break rayLoop;
				}

				rays[dir].push({x: nextPointCoords.x, y: nextPointCoords.y});

				currentPoint = nextPointCoords;
				if(rays[dir].length > 320) {
					console.log("WHILE LOOP FAILURE at source point", x, y);
					break rayLoop;
				}
			}
		});

		return rays;
	}

	getWindingPath(startX, startY, {maxLength = 30, startDir}) {
		const visited = {};
		const compass = new HexCompass();
		let length = 1;
		let currentX = startX;
		let currentY = startY;

		if(startDir) {
			compass.dir = startDir;
		} else {
			compass.randomize();
		}

		let randomDirs = compass.forward.randomize();

		visited[`${startX}-${startY}`] = true;

		const path = [];

		mainLoop:
		while( length < maxLength ) {
			let pointSet = false;
			const metaPoint = this.getMetaPoint(currentX, currentY);

			dirLoop:
			for(let i = 0; i < randomDirs.length; i++) {
				const dir = randomDirs[i];
				const nghbr = metaPoint[dir];
				const key = `${nghbr.x}-${nghbr.y}`;

				if( this.hasInternalPoint(nghbr.x, nghbr.y) && !visited[key] ) {
					//this.setPoint(nghbr.x, nghbr.y, 1);

					pointSet = true;
					visited[key] = true;
					currentX = nghbr.x;
					currentY = nghbr.y;
					//compass.dir = dir;
					//randomDirs = compass.forward.randomize();
					if(Math.random() > 0.9) {
						//randomDirs = [...compass.back.randomize(), ...compass.forward.randomize()];
						randomDirs = compass.back.randomize();
					} else {
						if(Math.random() > 0.5) {
							randomDirs.randomize();
						} else {
							randomDirs = compass.forward.randomize();
						}
					}

					path.push({x: currentX, y: currentY});

					length++;

					break dirLoop;
				}
			}

			if(!pointSet) {
				const prevPoint = path.pop();

				if( prevPoint ) {
					currentX = prevPoint.x;
					currentY = prevPoint.y;
				} else {
					break mainLoop;
				}
			}
		}

		return Object.keys(visited).map(coords => {
			const [x, y] = coords.split('-');

			return {
				x: parseInt(x),
				y: parseInt(y)
			};
		});
	}
}

module.exports = HexGrid;
