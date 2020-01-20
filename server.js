const WebSocket = require('ws');
const fs = require('fs');
var logStream = fs.createWriteStream('./log.txt', {'flags': 'a'});
logStream.write('abc');
logStream.write('def');
var connections = {};
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const wss = new WebSocket.Server({port: 8081});

const debugActions = {
	printSocketIDs: (socket, data) => {
		for (const key in connections) {
			logLine(key + " : " + connections[key].actionsObject);
		}
	},
	echo: (socket, data) => {
		socket.send(data.message);
	}
}

const globalActions = {
	...debugActions,
	setActionSet: (socket, data) => {
        var password = data[1];
		if (password == "chipperyMan753") {
            socket.actionsObject = data.newActionSet;
            return 1;
        }
        else {
            logLine("Socket " + socket.name + " provided invalid password " + password);
            return 0;
        }
	}
} 

const ledActions = {
	...globalActions
}

const unassignedActions = {
	...globalActions,
	register: (socket, data) => {
        var name = data[1];
        logLine(socket.name + "->" + name);
        connections[data.name] = socket;
        socket.name = name;
        socket.actionsObject = ledActions;
        return 1;
	}
}

const log = (data) => {
    var d = new Date(Date.now());
    var message = months[d.getMonth()] + " " + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + " " + data;
    process.stdout.write(message);
    logStream.write(message);
};

const logLine = (data) => {
    return log(data + "\n");
};

wss.on('connection', (ws) => {
	logLine("Got new connection.");
	ws.on('message', (message) => {
        // Data will be formatted: command,arg1,...,argn
        // Reason it's not json or something easier is because the board I'm using only has 10KB ram and I'd rather use it for something else
        logLine(ws.name + " sent " + message);
        var data = message.split(",");
        var command = data[0];

		if (ws.actionsObject == undefined) {
			ws.actionsObject = unassignedActions;
		}
		var funToCall = ws.actionsObject[command];
		if (funToCall == undefined) {
            logLine(ws.name + " called " + command + ", but that doesn't exist for its group.");
            ws.send("0");
		}
		else {
			ws.send(funToCall(ws, data));
		}
	});
});

