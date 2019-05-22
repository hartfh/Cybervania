const {getGameData} = require('../data/game-data');

module.exports = class Renderer {
	static clearCanvas(elem, ctx) {
		ctx.globalCompositeOperation = 'source-in';
		ctx.fillStyle = 'transparent';
		ctx.fillRect(0, 0, elem.width, elem.height);
		ctx.globalCompositeOperation = 'source-over';

		//// TEMP
		ctx.fillStyle = '#202020';
		ctx.fillRect(0, 0, elem.width, elem.height);
		////
	}

	static sortRenderables(bodyA, bodyB) {
		const layers = getGameData('layers');
		const layerA = bodyA.body.display ? layers[bodyA.body.display.layer] : 0;
		const layerB = bodyB.body.display ? layers[bodyB.body.display.layer] : 0;

		if(layerA > layerB) {
			return 1;
		} else if(layerA < layerB) {
			return -1;
		} else {
			if(bodyA.body.bounds.aabb[0].y > bodyB.body.bounds.aabb[0].y) {
				return 1;
			} else if(bodyA.body.bounds.aabb[0].y < bodyB.body.bounds.aabb[0].y) {
				return -1;
			} else {
				return 0;
			}
		}
	}

	static drawViewport(elem, ctx, viewport) {
		if(!viewport.enabled) {
			return;
		}

		ctx.fillStyle = '#001050';
		ctx.fillRect(viewport.bounds.aabb[0].x, viewport.bounds.aabb[0].y, viewport.width, viewport.height);

		const bodies = viewport.world.getBodies();
		const renderable = [];

		bodies.forEach((body) => {
			if(body.visible) {
				if( viewport.view.bounds.intersect(body.bounds) ) {
					const vportPosition = {
						x: viewport.position.x - viewport.view.position.x,
						y: viewport.position.y - viewport.view.position.y
					};

					renderable.push({
						body,
						vportPosition
					});
				}
			}
		});

		renderable.sort(this.sortRenderables).forEach(({body, vportPosition}) => {
			body.display.render(ctx, vportPosition, {width: viewport.width, height: viewport.height}, viewport.view.bounds);
		});
	}

	static drawBuffer(canvas) {
		const ctx = canvas.context;

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(canvas.buffer.elem, 0, 0, canvas.elem.width, canvas.elem.height);
	}

	render(canvas, viewports) {
		// assemble bodies that need rendering and divide into layer buckets
		// World.getBodies(); // world is a List
		//console.log('renderer is rendering');

		// determine when to group bodies, then render viewports in layer order

		this.constructor.clearCanvas(canvas.elem, canvas.context);
		this.constructor.clearCanvas(canvas.buffer.elem, canvas.buffer.context);

		viewports.forEach((viewport) => this.constructor.drawViewport(canvas.buffer.elem, canvas.buffer.context, viewport));

		this.constructor.drawBuffer(canvas);
	}
}
