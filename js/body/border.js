const BodyImage = require('./body-image');

module.exports = class Border extends BodyImage {
	constructor() {
		super();

		this.body = body;
		this.width = args.width || 0;
		this.regions = this.calculateRegions();
	}

	render(context) {
		context.globalCompositeOperation = 'source-over';

		for(const index in this.regions) {
			const region = this.regions[index];
			const adjRegion = {
				position:	{
					x:	region.position.x + this.position.x + this.offset.x,
					y:	region.position.y + this.position.y + this.offset.y
				},
				width:	region.width,
				height:	region.height
			};

			const image = {
				name:	this.image[index],
				width:	this.width,
				height:	this.width
			};

			tileImage(image, adjRegion, context);
		}
	}

	/**
	 * Determines bounds of the eight regions that comprise the border.
	 *
	 * @method	calculateRegions
	 * @private
	 * @return	{array}
	 */
	calculateRegions() {
		const regions = [];

		const region1 = {
			position:	{x: 0, y: 0},
			width:	this.width,
			height:	this.width
		};

		const region2 = {
			position:	{x: this.width, y: 0},
			width:	this.body.width - (this.width * 2),
			height:	this.width
		};

		const region3 = {
			position:	{x: this.body.width - this.width, y: 0},
			width:	this.width,
			height:	this.width
		};

		const region4 = {
			position:	{x: 0, y: this.width},
			width:	this.width,
			height:	this.body.height - (this.width * 2)
		};

		const region5 = {
			position:	{x: this.body.width - this.width, y: this.width},
			width:	this.width,
			height:	this.body.height - (this.width * 2)
		};

		const region6 = {
			position:	{x: 0, y: this.body.height - this.width},
			width:	this.width,
			height:	this.width
		};

		const region7 = {
			position:	{x: this.width, y: this.body.height - this.width},
			width:	this.body.width - (this.width * 2),
			height:	this.width
		};

		const region8 = {
			position:	{x: this.body.width - this.width, y: this.body.height - this.width},
			width:	this.width,
			height:	this.width
		};

		regions.push(region1);
		regions.push(region2);
		regions.push(region3);
		regions.push(region4);
		regions.push(region5);
		regions.push(region6);
		regions.push(region7);
		regions.push(region8);

		return regions;
	}
};
