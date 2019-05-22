module.exports = class Bounds {
	constructor(width, height, position) {
		const {x, y} = position;

		this.aabb = this.constructor.calcAABB({width, height, x, y});
	}

	static calcAABB({width, height, x, y}) {
		const topLeft = {x, y};
		const bottomRight = {
			x: topLeft.x + width,
			y: topLeft.y + height
		};

		return [topLeft, bottomRight];
	}

	update(args) {
		this.aabb = this.constructor.calcAABB(args);
	}

	encompass(point) {
		const [a, b] = this.aabb;

		if(point.x >= a.x && point.x <= b.x) {
			if(point.y >= a.y && point.y <= b.y) {
				return true;
			}
		}

		return false;
	}

	chamferedRegion(point, chamfer) {
		const [a, b] = this.aabb;
		const intrusion1 = {
			x: point.x - a.x,
			y: point.y - a.y
		};
		const intrusion2 = {
			x: b.x - point.x,
			y: point.y - a.y
		};
		const intrusion3 = {
			x: b.x - point.x,
			y: b.y - point.y
		};
		const intrusion4 = {
			x: point.x - a.x,
			y: b.y - point.y
		};

		if( intrusion1.x + intrusion1.y < chamfer ) {
			return true;
		}
		if( intrusion2.x + intrusion2.y < chamfer ) {
			return true;
		}
		if( intrusion3.x + intrusion3.y < chamfer ) {
			return true;
		}
		if( intrusion4.x + intrusion4.y < chamfer ) {
			return true;
		}

		return false;
	}

	intersect(otherBounds) {
		const [aOne, bOne] = this.aabb;
		const [aTwo, bTwo] = otherBounds.aabb;

		if((aTwo.x >= aOne.x && aTwo.x <= bOne.x) || (aOne.x >= aTwo.x && aOne.x <= bTwo.x)) {
			if((aTwo.y >= aOne.y && aTwo.y <= bOne.y) || (aOne.y >= aTwo.y && aOne.y <= bTwo.y)) {
				return true;
			}
		}

		return false;
	}
};
