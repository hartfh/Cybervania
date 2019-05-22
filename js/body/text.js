const BodyImage = require('./body-image');
const {getGameData} = require('../../data/game-data');

module.exports = class Text extends BodyImage {
	constructor(config, body, configActive) {
		super();

		this.body = body;
		this.active = false;
		this.scroll = {x: 0, y: 0};	// current amount text is scrolled
		this.textHeight = 0;				// pixel height of text block
		this.kerning = 0;					// negative right margin applied when rendering and calculating line widths
		this.scrollingID = false;		// text scrolling setInterval ID
		//this.text = {};					// size, family, color, opacity
		this.printedChars = 0;
		this.varsCache = {};				// Cache any text "vars". Changes to the values trigger reconfiguration
		this.config = config;
		this.configActive = configActive;

		this.configure(config, configActive);
	}

	render(context, vportPosition, vportSize, vportViewBounds) {
		this.updateVarsCache();
		this.renderImageText(context, vportPosition, vportSize, vportViewBounds);
	}

	/**
	 * Applies one or two configuration objects to determine the displays settings and contents.
	 *
	 * @method		configure
	 * @private
	 * @param		{object}		config	A configuration object defining "Normal" state settings
	 * @param		{object}		fallback	An optional secondary configuration object defining "Active" state settings
	 */
	// eslint-disable-next-line complexity
	configure(config = {}, fallback = {}) {
		const fonts = getGameData('fonts');

		this.font		= (config.font || fallback.font) || 'thintel';
		this.color		= (config.color || fallback.color) || 'white';
		this.alignment	= (config.alignment || fallback.alignment) || 'left';
		this.padding	= (config.padding || fallback.padding) || {h: 0, v: 0};
		this.opacity	= (config.opacity || fallback.opacity) || 1.0;
		this.offset		= (config.offset || fallback.offset) || {x: 0, y: 0};
		this.vars		= (config.vars || fallback.vars) || {};
		this.mode		= (config.mode || config.mode) || 'source-over';
		this.print		= (config.print || config.print) || false;

		this.kerning = fonts[this.font] ? fonts[this.font].kerning : 0;

		const fontWidth	= fonts[this.font] ? fonts[this.font].width : 1;
		const fontHeight	= fonts[this.font] ? fonts[this.font].height : 1;

		this.content = this.convertImageTextToLines(
			(config.content || fallback.content),
			fontWidth,
			this.body.width - (this.padding.h * 2) - (this.padding.h * 2),
			this.kerning
		) || [];
		this.textHeight = this.content.length * fontHeight;
	}

	set activity(status = false) {
		this.active = Boolean(status);

		if(this.active) {
			this.configure(this.configActive, this.config);
		} else {
			this.configure(this.config);
		}
	}

	/**
	 * Applies a y-offset to the Display's text while ensuring the text stays visible.
	 *
	 * @param		{integer}		yScroll	Amount to scroll text in y-direction
	 */
	scrollText(yScroll = 0) {
		const newY = this.scroll.y + Math.floor(yScroll);

		if(newY <= 0) {
			const boxHeight = this.body.height - (2 * this.padding.h);

			if(boxHeight + Math.abs(newY) <= this.textHeight) {
				this.scroll.y = newY;
			}
		}
	}

	/**
	 * Sets up a repeating scroll event and clears out any old scroll events.
	 */
	startScrollingText(yScroll) {
		if(this.scrollingID) {
			this.stopScrollingText();
		}

		this.scrollingID = setInterval(() => {
			this.scrollText(yScroll);
		}, 15);
	}

	/**
	 * Cancels the current scroll event.
	 */
	stopScrollingText() {
		window.clearTimeout(this.scrollingID);
	}

	updateVarsCache() {
		let refresh = false;

		for(const key in this.vars) {
			const replacement = this.vars[key]();

			if( this.varsCache[key] != replacement ) {
				refresh = true;
				this.varsCache[key] = replacement;
			}

		}

		// If var values changed, reconfigure to recalculate line breaks
		if(refresh) {
			if(this.active) {
				this.configure(this.configActive, this.config);
			} else {
				this.configure(this.config);
			}
		}
	}

	renderImageText(context, vportPosition, vportSize, vportViewBounds) {
		const fonts = getGameData('fonts');
		let printing = 0;

		this.printedChars++;

		if( this.mode != 'source-over' ) {
			context.globalCompositeOperation = this.mode;
		}
		if( this.opacity < 1.0 ) {
			context.globalAlpha = this.opacity;
		}

		const fontData = fonts[this.font];
		const [boundOne] = this.body.bounds.aabb;
		const location = {
			x: vportPosition.x + boundOne.x,
			y: vportPosition.y + boundOne.y
		};

		const {
			viewLeftSlice,
			viewRightSlice,
			viewTopSlice,
			viewBottomSlice
		} = this.constructor.getViewportSlices(vportViewBounds, this.body.bounds.aabb[0], {w: this.body.width, h: this.body.height});

		context.beginPath();
		context.save();
		context.rect(
			location.x + this.offset.x + this.padding.h + viewLeftSlice,
			location.y + this.offset.y + this.padding.h + viewTopSlice,
			this.body.width - (this.padding.h * 2) - viewLeftSlice - viewRightSlice,
			this.body.height - (this.padding.h * 2) - viewTopSlice - viewBottomSlice
		);
		context.clip();

		for(const index in this.content) {
			const line				= this.content[index];
			const lineWidth		= line.width;
			const lineOffset		= index * fontData.height;
			let lineCharacters	= line.characters;
			let lineAlignOffset	= 0;

			if( this.alignment == 'center' ) {
				lineAlignOffset = (this.body.width - lineWidth) * 0.5;
			}

			const textPosition	= {
				x:	this.offset.x + location.x + this.offset.x + this.padding.h + this.padding.h + this.scroll.x + lineAlignOffset,
				y:	this.offset.y + location.y + this.offset.y + this.padding.v + this.padding.h + this.scroll.y + lineOffset
			};

			for(const key in this.varsCache) {
				const keyIndex = lineCharacters.indexOf(key);

				if( keyIndex != -1 ) {
					const replacement = this.varsCache[key];

					lineCharacters = lineCharacters.replace(key, replacement);
				}
			}

			charactersLoop:
			for(const i in lineCharacters) {
				if( this.print ) {
					switch(this.print) {
						case 'slow':
							printing += 3;
							break;
						case 'medium':
							printing += 2;
							break;
						case 'fast':
							printing += 1;
							break;
						default:
							break;
					}

					if( printing >= this.printedChars ) {
						break charactersLoop;
					}
				}

				const character	= lineCharacters[i];
				const imageName	= `${this.font}-${this.color}-${character}`;
				const escaped		= imageName.replace('.', 'escaped_dot'); // NEDB does not allow "." in data object properties
				const imageData	= getGameData('images', escaped);
				const texture		= this.constructor.getTexture(escaped);

				context.drawImage(
					texture,
					imageData.x,
					imageData.y,
					imageData.w,
					imageData.h,
					textPosition.x + ( i * (fontData.width + this.kerning) ),
					textPosition.y,
					imageData.w,
					imageData.h
				);
			}
		}

		context.restore(); // remove the clipping region
		context.closePath();

		context.globalCompositeOperation = 'source-over';

		if( this.opacity < 1.0 ) {
			context.globalAlpha = 1.0;
		}
	}

	convertImageTextToLines(text = false, fontSize = 16, containerWidth = false, kerning = 0) {
		const SEPARATOR = ' ';
		const FONT_SIZE = fontSize + kerning;
		const textPieces = (typeof(text) == 'string') ? [text] : text;
		const lines = [];

		if( !containerWidth || !text ) {
			return [];
		}

		// Wrap each text piece separately and maintain linebreaks
		for(let piece of textPieces) {
			// Make "vars" replacements before measuring, for accurate measurements
			for(const key in this.varsCache) {
				const keyIndex = piece.indexOf(key);

				if( keyIndex != -1 ) {
					piece = piece.replace(key, this.varsCache[key]);
				}
			}

			const words = piece.split(SEPARATOR);
			let line = '';
			let testWidth = 0;

			for(const word of words) {
				const measured = (word.length + 1) * FONT_SIZE;

				if( testWidth + measured < containerWidth ) {
					testWidth += measured;
				} else {
					// Store current line
					lines.push({characters: line, width: testWidth});

					// Start a new line
					line = '';

					// Line width becomes word width
					testWidth = measured;
				}

				line += word + SEPARATOR;
			}

			lines.push({characters: line, width: testWidth});
		}

		return lines;
	}
};
