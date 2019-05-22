const electron	= require('electron');
const ipc		= electron.ipcRenderer;

//const GAME_DATA = require('./data/game-data');
const Engine = require('./js/engine');

if(process.env.ENCODE_IMAGES) {
	const {encodeImages} = require('./js/image/converter');
	encodeImages();
} else {
	const engine = new Engine();
}

log = function(data) {
	ipc.send('display', data);
};

/*
var Constants		= require('./js/constants');
var Utilities		= require('./js/utilities/utilities');
var Data			= require('./js/data/data');
var List			= require('./js/classes/List');
var Grid			= require('./js/classes/Grid');
var Compass		= require('./js/classes/Compass');
var AsynchChecker	= require('./js/classes/AsynchTasksChecker');
*/


setInterval(function() {
	log('-tick-');
}, 1000);
setTimeout(function() {
	setInterval(function() {
		log('-tock-');
		/*
		if( Game.Player.getTroupe() ) {
			log('---------------');
			log( Game.Player.getTroupe().eachActor(function(actor) {
				log(actor.body.actorType + ': ' + actor.spriteMode);
				//log(actor.attackingAlt);
				//log(actor.movingAlt);
				log('--');
			}) );
		}
		*/
	}, 1000);
}, 500);


//var map = MapFactory.createV4();

//Game.ImageConverter.encode();
//Game.start();
