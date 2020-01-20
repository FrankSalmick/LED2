const WebSocket = require('ws');
const fs = require('fs');
var writeStream = fs.createWriteStream('./log.txt', {'flags': 'a'});
writeStream.write('abc');
writeStream.write('def');
var connections = {};

const wss = new WebSocket.Server({port: 8081});

const debugActions = {
	printSocketIDs: (socket, data) => {
		for (const key in connections) {
			console.log(key + " : " + connections[key].actionsObject);
		}
	},
	echo: (socket, data) => {
		socket.send(data.message);
	}
}

const globalActions = {
	...debugActions,
	setActionSet: (socket, data) => {
		if (data.password == "chipperyMan753") {
			socket.actionsObject = data.newActionSet;
		}
	}
} 

const ledActions = {
	...globalActions
}

const unassignedActions = {
	...globalActions,
	register: (socket, data) => {
		console.log("Registering " + data.name);
		connections[data.name] = socket;
		socket.actionsObject = ledActions;
	}
}

const log = (data) => {
	console.log(data);
};

wss.on('connection', (ws) => {
	console.log("Got connection.");
	ws.on('message', (message) => {
		var data = JSON.parse(message);
		console.log(data)
		if (ws.actionsObject == undefined) {
			ws.actionsObject = unassignedActions;
		}
		var funToCall = ws.actionsObject[data.action];
		if (funToCall == undefined) {
			// Handle unavailable thing
		}
		else {
			funToCall(ws, data);
		}
	});
});

