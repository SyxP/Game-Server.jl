var comms = comms || {};

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
    myprompts.showPrompt(myprompts.messagePrompt, "Connecting...");
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
        myprompts.showPrompt(myprompts.messagePrompt, "Error: " + e);
    };
    ws.onopen = function(e) {
        myprompts.showPrompt(myprompts.okayPrompt, "Successfully connected!");
    };
    ws.onclose = function(e) {
        myprompts.showPrompt(myprompts.messagePrompt,
                             "Disconnected. Reload page.");
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
            myprompts.hideAll();
            login.blinkField(login.roomField);
            break;
        case "room-missing-error":
            login.setErrorStatus("Room doesn't exist.");
            myprompts.hideAll();
            login.blinkField(login.roomField);
            break;
        case "wrong-password-error":
            login.setErrorStatus("Incorrect password.");
            myprompts.hideAll();
            login.blinkField(login.passwordField);
            break;
        case "duplicate-username-error":
            login.setErrorStatus("Handle has already been chosen.");
            myprompts.hideAll();
            login.blinkField(login.handleField);
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
            myprompts.showPrompt(myprompts.okayPrompt,
                                 "Welcome to " + msg["room-name"] + "!");
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

window.onload = comms.load;
