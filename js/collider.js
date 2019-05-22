/* eslint-disable max-depth, no-bitwise */
const Bounds = require('./bounds');
const {COLLIDER: {PARTITION_SIZE, EDGE_BUFFER, BITMASKS}} = require('./constants');

module.exports = class Collider {
	constructor() {
		this.moveable = {};
		this.blockedX = {};
		this.blockedY = {};
	}

	static getBodyPartitions(body) {
		const [boundA, boundB] = body.bounds.aabb;
		const lower = {
			x: Math.floor((boundA.x - EDGE_BUFFER) / PARTITION_SIZE),
			y: Math.floor((boundA.y - EDGE_BUFFER) / PARTITION_SIZE)
		};
		const upper = {
			x: Math.floor((boundB.x + EDGE_BUFFER) / PARTITION_SIZE),
			y: Math.floor((boundB.y + EDGE_BUFFER) / PARTITION_SIZE)
		};

		const partitions = [lower];

		if(lower.x != upper.x) {
			partitions.push({x: upper.x, y: lower.y});
		}
		if(lower.y != upper.y) {
			partitions.push({x: lower.x, y: upper.y});
		}
		if(lower.x != upper.x && lower.y != upper.y) {
			partitions.push(upper);
		}

		return partitions;
	}

	static getBuckets(bodies) {
		const buckets = {};

		bodies.forEach((body) => {
			const partitions = this.getBodyPartitions(body);

			partitions.forEach(({x, y}) => {
				const key = `${x}-${y}`;

				if(!buckets[key]) {
					buckets[key] = [];
				}

				buckets[key].push(body);
			});
		});

		return buckets;
	}

	static resolveMovingBody(body) {
		if(!body.velocity.x && !body.velocity.y) {
			return;
		}

		body.position.x += body.velocity.x;
		body.position.y += body.velocity.y;
		body.bounds.update({width: body.width, height: body.height, x: Math.round(body.position.x), y: Math.round(body.position.y)});

		if(body.tethers) {
			body.tethers.eachItem(({tethered, relative}) => {
				tethered.position.x = body.position.x + relative.x;
				tethered.position.y = body.position.y + relative.y;
				tethered.bounds.update({width: tethered.width, height: tethered.height, x: Math.round(tethered.position.x), y: Math.round(tethered.position.y)});
			});
		}
	}

	resolveBlockedXBody(body, blocker) {
		// approach as close as possible to blockage, then reduce speed to zero

		body.velocity.x = 0;

		if(!this.blockedY[body.id]) {
			this.constructor.resolveMovingBody(body);
		}

		// inform each body of collision event
	}

	resolveBlockedYBody(body, blocker) {
		// approach

		body.velocity.y = 0;

		if(!this.blockedX[body.id]) {
			this.constructor.resolveMovingBody(body);
		}

		// inform each body of collision event
	}

	static bodiesCanInteract(bodyA, bodyB) {
		const bitmaskA = BITMASKS[bodyA.bitmask];
		const bitmaskB = BITMASKS[bodyB.bitmask];

		if( (bitmaskB.category & bitmaskA.mask) == bitmaskB.category ) {
			if( (bitmaskA.category & bitmaskB.mask) == bitmaskA.category ) {
				return true;
			}
		}

		return false;
	}

	static bodiesAreMotionless(...bodies) {
		for(let i = 0; i < bodies.length; i++) {
			const body = bodies[i];

			if(body.velocity.x || body.velocity.y) {
				return false;
			}
		}

		return true;
	}

	resolvePartition(bodies) {
		if(bodies.length == 1) {
			const [body] = bodies;

			if(!this.blockedX[body.id] && !this.blockedY[body.id]) {
				this.moveable[body.id] = body;
			}
		} else {
			for(let a = 0; a < bodies.length; a++) {
				const bodyA = bodies[a];
				const newBodyAPositionX = {
					x: bodyA.position.x + bodyA.velocity.x,
					y: bodyA.position.y
				};
				const newBodyAPositionY = {
					x: bodyA.position.x,
					y: bodyA.position.y + bodyA.velocity.y
				};
				const newBodyABoundsX = new Bounds(bodyA.width, bodyA.height, newBodyAPositionX);
				const newBodyABoundsY = new Bounds(bodyA.width, bodyA.height, newBodyAPositionY);
				let clear = true;

				if(bodies[a + 1]) {
					bodyLoopB:
					for(let b = a + 1; b < bodies.length; b++) {
						const bodyB = bodies[b];

						if(!this.constructor.bodiesCanInteract(bodyA, bodyB) || this.constructor.bodiesAreMotionless(bodyA, bodyB)) {
							continue bodyLoopB;
						}

						const newBodyBPosition = {
							x: bodyB.position.x + bodyB.velocity.x,
							y: bodyB.position.y + bodyB.velocity.y
						};
						const newBodyBBounds = new Bounds(bodyB.width, bodyB.height, newBodyBPosition);

						if(newBodyABoundsX.intersect(newBodyBBounds) || newBodyABoundsY.intersect(newBodyBBounds)) {
							clear = false;

							const newBodyBPositionX = {
								x: bodyB.position.x + bodyB.velocity.x,
								y: bodyB.position.y
							};
							const newBodyBPositionY = {
								x: bodyB.position.x,
								y: bodyB.position.y + bodyB.velocity.y
							};
							const newBodyBBoundsX = new Bounds(bodyB.width, bodyB.height, newBodyBPositionX);
							const newBodyBBoundsY = new Bounds(bodyB.width, bodyB.height, newBodyBPositionY);

							if(newBodyABoundsX.intersect(newBodyBBoundsX)) {
								this.blockedX[bodyA.id] = bodyA;
								this.blockedX[bodyB.id] = bodyB;
							}

							if(newBodyABoundsY.intersect(newBodyBBoundsY)) {
								this.blockedY[bodyA.id] = bodyA;
								this.blockedY[bodyB.id] = bodyB;
							}

							if(this.moveable[bodyA.id]) {
								delete this.moveable[bodyA.id];
							}

							if(this.moveable[bodyB.id]) {
								delete this.moveable[bodyB.id];
							}
						}
					}
				}

				if(clear) {
					if(!this.blockedX[bodyA.id] && !this.blockedY[bodyA.id]) {
						this.moveable[bodyA.id] = bodyA;
					}
				}
			}
		}
	}

	resolve(world) {
		const partitions = this.constructor.getBuckets(world.getBodies());

		for(const i in partitions) {
			this.resolvePartition(partitions[i]);
		}

		Object.values(this.moveable).forEach(body => {
			this.constructor.resolveMovingBody(body);
		});
		Object.values(this.blockedX).forEach(body => {
			this.resolveBlockedXBody(body);
		});
		Object.values(this.blockedY).forEach(body => {
			this.resolveBlockedYBody(body);
		});

		this.moveable = {};
		this.blockedX = {};
		this.blockedY = {};
	}
}
