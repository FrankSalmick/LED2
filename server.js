const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WebSocket = require('ws');
const fs = require('fs');
const wss = new WebSocket.Server({port: 8081});

var logStream = fs.createWriteStream('./log.txt', {'flags': 'a'});
var connections = {};

const actionGroups = {
    get debugActions() { return {
        name: 'Debug',
        print: (socket, data) => {
            for (const key in connections) {
                logLine(key + " : " + connections[key].actions.name);
            }
        },
        echo: (socket, data) => {
            var message = data[1];
            logLine("Echoing " + message);
            socket.send(message);
        },
        changeName: (socket, data) => {
            var newName = data[1];
            connections[newName] = socket;
            delete connections[socket.name];
            socket.name = newName;
        }
    }},

    get globalActions() { return {
        ...actionGroups.debugActions,
        name: 'Global',
        setActionSet: (socket, newActionSet) => {
            if (newActionSet == undefined) {
                logLine("Unable to move " + socket.name + " to new action set because it is undefined.");
                return 0;
            } else {
                logLine("Moving " + socket.name + " to action set " + newActionSet.name + " (was " + socket.actions.name + ")");
                socket.actions = newActionSet;
                return 1;
            }
        }
    }},

    get unregisteredActions() { return {
        ...actionGroups.globalActions,
        name: 'Unregistered',
        register: (socket, data) => {
            var name = data[1];
            connections[name] = socket;
            socket.name = name;
            logLine("Assigned name to " + name);
            socket.actions.setActionSet(socket, actionGroups.ledActions);
            return 1;
        },
        deregister: (socket) => {
            logLine("Deregistering an unregistered client.");
            return 1;
        }
    }},

    get registeredActions() { return {
        ...actionGroups.globalActions,
        name: 'Registered',
        // This command will usually be called if the socket is closed for some reason, so there is no data passed to it
        deregister: (socket) => {
            logLine("Deregistering " + socket.name);
            delete connections[socket.name];
            return 1;
        },
        overrideActionSet: (socket, data) => {
            var password = data[1];
            var newActionSet = data[2];
            if (password == "chipperyMan753") {
                socket.actions.setActionSet(socket, actionGroups[newActionSet]);
                return 1;
            }
            else {
                logLine("Socket " + socket.name + " provided invalid password " + password);
                return 0;
            }
        }
    }},

    get adminActions() { return {
        ...actionGroups.registeredActions,
        name: 'Admin',
        sendMessage: (socket, data) => {
            var recipient = data[1];
            var message = data[2];
            logLine(socket.name + " dispatched " + message + " to " + recipient);
            connections[recipient].send(message);
            return 1;
        }
    }},

    get ledActions() { return {
        ...actionGroups.registeredActions,
        name: 'LED'
    }}
};

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
    ws.actions = actionGroups.unregisteredActions;
	ws.on('message', (message) => {
        // Data will be formatted: command,arg1,...,argn
        // Reason it's not json or something easier is because the board I'm using only has 10KB ram and I'd rather use it for something else
        logLine(ws.name + " sent " + message);
        var data = message.split(",");
        var command = data[0];
        var funToCall = ws.actions[command];
		if (funToCall == undefined) {
            logLine(ws.name + " called " + command + ", but that doesn't exist for its group.");
            ws.send("0");
		}
		else {
			ws.send(funToCall(ws, data));
		}
    });
    // todo: for some reason this doesn't always work.
    ws.on('close', ws.actions.deregister);
    ws.on('error', ws.actions.deregister);
});

logLine("Ready.");