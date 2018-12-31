var comms = {};
var myprompts = {};
var login = {};
var room = {};

comms.readyStateDesc = {
    0: "CONNECTING",
    1: "OPEN",
    2: "CLOSING",
    3: "CLOSED"
};

comms.load = function() {
    comms.ws = comms.addWebSocket("ws");
    comms.ws.onmessage = function(e) {
        comms.receiveMessage(e.data);
    };
};

comms.addWebSocket = function(instanceName, subprotocol) {
    let ws;
    let wsuri = document.URL.replace("http:", "ws:");
    if (typeof subprotocol === "undefined")
        ws = new WebSocket(wsuri);
    else
        ws = new WebSocket(wsuri, subprotocol);
    ws.myName = instanceName;
    ws.onerror = function(e) {
        comms.setWSStatus("WebSocket " + instanceName + ".onerror: " +
            "<br>&nbsp;&nbsp;WebSocket state is now " + e.target.readyState +
            " " + comms.readyStateDesc[e.target.readyState]);
    };
    ws.onopen = function(e) {
        comms.setWSStatus("WebSocket " + instanceName + ".onopen: " +
            "<br>&nbsp;&nbsp;WebSocket state is now " + e.target.readyState +
            " " + comms.readyStateDesc[e.target.readyState]);
    };
    ws.onclose = function(e) {
        comms.setWSStatus("WebSocket " + instanceName + ".onclose: Reload page.");
    };
    
    return ws;
};

comms.sendMessage = function(msg) {
    if (comms.ws.readyState === 1) {
        let msgData = JSON.stringify(msg);
        comms.ws.send(msgData);
        return true;
    }
    comms.setWSStatus("WebSocket not ready. Reload page or check server!");
    return false;
};

comms.receiveMessage = function(msgData) {
    let msg = JSON.parse(msgData);
    let msgType = msg.responsetype;
    switch (msgType) {
        case "room-exists-error":
            login.setErrorStatus("Room already exists.");
            break;
        case "room-missing-error":
            login.setErrorStatus("Room doesn't exist.");
            break;
        case "wrong-password-error":
            login.setErrorStatus("Incorrect password.");
            break;
        case "duplicate-username-error":
            login.setErrorStatus("Username has already been chosen.");
            break;
        case "joined-room":
            room.userList = msg["users"].sort();
            room.setTitle(msg["room-name"]);
            room.setPlayers(room.userList);
            room.inProgress = msg["game-ongoing"];
            if (room.inProgress)
                room.gameState = msg["game-status"];
            room.updateDisplay();
            login.show(false);
            room.show(true);
            break;
        case "player-joined":
            room.userList.push(msg["user"]);
            room.userList.sort();
            room.setPlayers(room.userList);
            break;
        case "player-disconnected":
            room.userList = room.userList.filter(x => x !== msg["user"]);
            room.setPlayers(room.userList);
            break;
    }
};

comms.setWSStatus = function(msg) {
    myprompts.serverMessage.innerHTML = msg;
    myprompts.serverStatusWindow.style.display = "block";
    overlay.style.display = "block";
};

myprompts.serverStatusWindow = document.getElementById("server-status");
myprompts.serverMessage = document.getElementById("server-message");
myprompts.serverStatusClearBtn = document.getElementById("server-status-clear");
myprompts.serverStatusClearBtn.onclick = function() {
    myprompts.serverStatusWindow.style.display = "none";
    overlay.style.display = "none";
};
myprompts.overlay = document.getElementById("overlay");

login.window = document.getElementById("login-panel");
login.handleField = document.getElementById("join-handle");
login.roomField = document.getElementById("join-room");
login.passwordField = document.getElementById("join-pass");
login.joinRoomBtn = document.getElementById("join-enter");
login.errorMessage = document.getElementById("error-message");
login.joinRoomBtn.onclick = function() {
    room.myHandle = login.handleField.value;
    let content = {
        "querytype":   "join-room",
        "particulars": login.getParticulars()
    };
    comms.sendMessage(content);
};
login.makeRoomBtn = document.getElementById("join-create");
login.makeRoomBtn.onclick = function() {
    room.myHandle = login.handleField.value;
    let content = {
        "querytype":   "make-room",
        "particulars": login.getParticulars()
    };
    comms.sendMessage(content);
};

login.getParticulars = function() {
    return {
        "handle":   login.handleField.value,
        "roomname": login.roomField.value,
        "roompass": login.passwordField.value
    };
};

login.setErrorStatus = function(msg) {
    login.errorMessage.innerHTML = msg;
};

login.show = function(show) {
    login.window.style.display = show ? "block" : "none";
};

room.userList = [];
room.window = document.getElementById("room-panel");
room.title = document.getElementById("room-title");
room.userDisplay = document.getElementById("room-players");
room.board = document.getElementById("room-board");

room.setTitle = function(str) {
    room.title.innerHTML = "Yes, Please!<br>Room: " + str;
};

room.setPlayers = function(lst) {
    while (room.userDisplay.firstChild)
        room.userDisplay.removeChild(room.userDisplay.firstChild);
    for (let p of lst) {
        let li = document.createElement("li");
        if (p === room.myHandle)
            li.setAttribute("class", "user-me");
        li.innerHTML = p;
        room.userDisplay.appendChild(li);
    }
};

room.updateDisplay = function() {
    if (room.inProgress) {
        
    }
    else {
        
    }
};

room.show = function(show) {
    room.window.style.display = show ? "flex" : "none";
};

window.onload = comms.load;
