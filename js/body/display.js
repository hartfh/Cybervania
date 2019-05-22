const Border = require('./border');
const Sprite = require('./sprite');
const Text = require('./text');

module.exports = class Display {
	constructor(args = {}, body) {
		this.border = args.border ? new Border(args.border, body) : false;
		this.sprite = args.sprite ? new Sprite(args.sprite, body) : false;
		this.text = args.text ? new Text(args.text, body) : false;
		//this.layer = args.layer ? getGameData('layers')[args.layer] : 0;
		this.layer = args.layer || '';
		this.body = body;
	}

	render(context, vportPosition, vportSize, vportViewBounds) {
		// Temporary
		if(!this.border && !this.sprite && !this.text || false || (this.text && !this.sprite)) {
			const calcPosition = {
				x: Math.round(this.body.position.x) + vportPosition.x,
				y: Math.round(this.body.position.y) + vportPosition.y
			};

			context.strokeStyle = 'pink';
			context.lineWidth = 1;
			context.translate(calcPosition.x + 0.5, calcPosition.y + 0.5);
			context.strokeRect(0, 0, this.body.width - 1, this.body.height - 1);
			context.translate(-calcPosition.x - 0.5, -calcPosition.y - 0.5);
		}

		if(this.border) {
			this.border.render(context, vportPosition, vportSize, vportViewBounds);
		}

		if(this.sprite) {
			this.sprite.render(context, vportPosition, vportSize, vportViewBounds);
		}

		if(this.text) {
			this.text.render(context, vportPosition, vportSize, vportViewBounds);
		}
	}

	//updateText() {}
};
