var electron		= require('electron');

var app				= electron.app;
var BrowserWindow	= electron.BrowserWindow;
var ipc				= electron.ipcMain;
var mainWindow		= null;
var dbOverseer		= null;

app.on('ready', function() {
	var activeTasks = [];

	dbOverseer = new BrowserWindow({
		height:	600,
		width:	700,
		show:	false
	});
	//dbOverseer.webContents.openDevTools();

	dbOverseer.loadURL('file://' + __dirname + '/db.html');

	mainWindow = new BrowserWindow({
		width:		1100,
		height:		700
	});
	mainWindow.webContents.openDevTools();

	// TODO: create interface for user to save game configuration settings
	ipc.on('close-main-window', function() {
		app.quit();
	});

	ipc.on('display', function(e, data) {
		console.log(data);
	});


	mainWindow.loadURL('file://' + __dirname + '/index.html');

	ipc.on('to-db-overseer', function(event, data) {
		dbOverseer.send('to-db-overseer', data);
	});

	ipc.on('from-db-overseer', function(event, data) {
		mainWindow.send('from-db-overseer', data);
	});
});
