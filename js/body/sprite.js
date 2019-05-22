const BodyImage = require('./body-image');
const {getGameData} = require('../../data/game-data');
const {getGameState} = require('../state');
const {SPRITE} = require('../constants');
const {FACINGS, MODE_FALLBACKS} = SPRITE; // MODES

module.exports = class Sprite extends BodyImage {
	constructor(name, body) {
		super();

		this.name = name;
		this.body = body;
		this.data = getGameData('sprites', name);
		this.tickCounter = 10000;
		this.loopDelayCounter = 0;
		this.frameIndex = -1;
		this.texture = '';
		this.lastUpdated = -1;
	}

	get mode() {
		return this.body.mode;
	}

	get facing() {
		return this.body.facing;
	}

	render(context, vportPosition, vportSize, vportViewBounds) {
		this.tick();

		const img = getGameData('images', this.texture);

		img.name = this.texture;

		if(this.data.tiled) {
			this.constructor.tile(img, this.body, context, vportPosition, vportSize, vportViewBounds);
		} else {
			const spriteBoundA = {
				x: Math.round((this.body.width / 2) - (img.w / 2)),
				y: Math.round((this.body.height / 2) - (img.h / 2))
			};
			const calcPosition = {
				x: Math.round(this.body.position.x) + vportPosition.x,
				y: Math.round(this.body.position.y) + vportPosition.y
			};
			const {
				viewLeftSlice,
				viewRightSlice,
				viewTopSlice,
				viewBottomSlice
			} = this.constructor.getViewportSlices(vportViewBounds, {x: Math.round(this.body.position.x) + spriteBoundA.x, y: Math.round(this.body.position.y) + spriteBoundA.y}, img);
			const image = BodyImage.getTexture(img.name);
			const printedWidth = img.w - viewRightSlice - viewLeftSlice;
			const printedHeight = img.h - viewBottomSlice - viewTopSlice;

			if( printedWidth <= 0 || printedHeight <= 0 ) {
				return;
			}

			context.translate(calcPosition.x, calcPosition.y);
			context.drawImage(
				image,
				img.x + viewLeftSlice,
				img.y + viewTopSlice,
				printedWidth,
				printedHeight,
				spriteBoundA.x + viewLeftSlice,
				spriteBoundA.y + viewTopSlice,
				printedWidth,
				printedHeight
			);
			context.translate(-calcPosition.x, -calcPosition.y);
		}
	}

	tick() {
		const masterCounter = getGameState('tickCounter');

		if( this.lastUpdated == masterCounter ) {
			return;
		}

		const refresh = this.body.refreshSpriteFrame;
		let counterRollover = false;
		let usableMode = false;
		let usableFacing = false;
		let spriteMode = this.mode || 'normal';

		this.lastUpdated = masterCounter;

		if( !this.data.frameData[spriteMode] ) {
			const attemptedModes	= spriteMode.split('-');
			const [primaryMode]	= attemptedModes;
			let fallbackMode		= false;

			fallbackLoop:
			for(const i in MODE_FALLBACKS[primaryMode]) {
				const testMode = MODE_FALLBACKS[primaryMode][i];

				if( frames[testMode] ) {
					fallbackMode = this.data.frameData[testMode];

					break fallbackLoop;
				}
			}

			// Attempt the primary mode as the fallback
			if( this.data.frameData[primaryMode] ) {
				fallbackMode = primaryMode;
			}

			spriteMode = (fallbackMode) ? fallbackMode : 'normal';
		}

		usableMode = spriteMode;

		for(const facing of FACINGS) {
			if(this.data.frameData[usableMode][facing]) {
				usableFacing = facing;
			}
		}

		if(this.data.sync) {
			if(masterCounter % this.data.ticksPerFrame == 0) {
				counterRollover = true;
			}
		} else if(++this.tickCounter >= this.data.ticksPerFrame) {
			this.tickCounter = 0;
			counterRollover = true;
		}

		if(counterRollover || refresh) {
			const currentSet = this.data.frameData[usableMode][usableFacing];

			if( !currentSet ) {
				return;
			}

			// Move frames forward or backward by one
			/*
			if( reversed ) {
				body.frames.frameIndex--;
			} else {
				body.frames.frameIndex++;
			}
			*/
			this.frameIndex++; // temp

			// Have sprite frames loop back to first frame
			if( this.frameIndex >= currentSet.frames.length || refresh ) {
				// If looping is disabled, leave sprite at its final frame
				if( !this.data.loop && !refresh ) {
					return;
				}

				// Add extra ticks onto the resetting of the frame index
				if( this.data.padding ) {
					if( ++this.loopDelayCounter > this.data.padding ) {
						this.loopDelayCounter = 0;
					} else {
						return;
					}
				}

				// Reset to first frame
				this.frameIndex = 0;
			} else if( this.frameIndex < 0 ) {
				// Advance to last frame
				this.frameIndex = currentSet.frames.length - 1;
			}

			//body.render.sprite.opacity	= frames[spriteMode].opacity;
			//body.render.sprite.mode		= frames[spriteMode].mode;
			this.texture = currentSet.frames[this.frameIndex];

			// If the facing has a zindex override, set it
			/*
			if( currentSet.zindex ) {
				body.zindexOverride = currentSet.zindex ;
			} else if( body.zindexOverride ) {
				body.zindexOverride = false;
			}
			*/

			//var effectData = frames[spriteMode].effects[currentSprite];

			//createEffect(body, effectData);
		}
	}
};
