const {getGameData, updateGameData} = require('../../data/game-data');

module.exports = class BodyImage {
	static getTexture(imageName) {
		const textures = getGameData('textures');
		let image = textures[imageName];

		if( image ) {
			return image;
		}

		const sheet = getGameData('images', imageName, 'sheet');
		const src = getGameData('sheets', sheet);

		image = new Image();
		image.src = src;
		textures[imageName] = image;

		updateGameData('textures', textures);

		return image;
	}

	static getViewportSlices(vportViewBounds, position, imageSize) {
		const [vportBoundA, vportBoundB] = vportViewBounds.aabb;
		const viewRightSlice = position.x + imageSize.w > vportBoundB.x ? (position.x + imageSize.w) - vportBoundB.x : 0;
		const viewBottomSlice = position.y + imageSize.h > vportBoundB.y ? (position.y + imageSize.h) - vportBoundB.y : 0;
		let viewLeftSlice = position.x < vportBoundA.x ? Math.abs(position.x - vportBoundA.x) : 0;
		let viewTopSlice = position.y < vportBoundA.y ? Math.abs(position.y - vportBoundA.y) : 0;

		if(viewLeftSlice > imageSize.w) {
			viewLeftSlice = imageSize.w;
		}

		if(viewTopSlice > imageSize.h) {
			viewTopSlice = imageSize.h;
		}

		return {
			viewLeftSlice,
			viewRightSlice,
			viewTopSlice,
			viewBottomSlice
		};
	}

	static tile(img = {w: 0, h: 0, name: '', x: 0, y: 0}, body, context, vportPosition, vportSize, vportViewBounds) {
		if(!img.name) {
			return;
		}
		const image = BodyImage.getTexture(img.name);
		const [boundA, boundB] = body.bounds.aabb;

		for(let {x} = boundA, xMax = boundB.x; x < xMax; x += img.w) {
			for(let {y} = boundA, yMax = boundB.y; y < yMax; y += img.h) {
				const xOverflow	= x + img.w;
				const yOverflow	= y + img.h;
				const xSlice		= (xOverflow > xMax) ? (xOverflow - xMax) : 0;
				const ySlice		= (yOverflow > yMax) ? (yOverflow - yMax) : 0;
				const {
					viewLeftSlice,
					viewRightSlice,
					viewTopSlice,
					viewBottomSlice
				} = BodyImage.getViewportSlices(vportViewBounds, {x, y}, {w: img.w - xSlice, h: img.h - ySlice});
				const printedWidth = img.w - xSlice - viewRightSlice - viewLeftSlice;
				const printedHeight = img.h - ySlice - viewBottomSlice - viewTopSlice;

				if(printedWidth <= 0 || printedHeight <= 0) {
					continue;
				}

				context.drawImage(
					image,
					img.x + viewLeftSlice,
					img.y + viewTopSlice,
					printedWidth,
					printedHeight,
					x + vportPosition.x + viewLeftSlice,
					y + vportPosition.y + viewTopSlice,
					printedWidth,
					printedHeight
				);
			}
		}
	}
};
