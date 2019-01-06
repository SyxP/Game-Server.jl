var room = room || {};

room.myHandle = "";
room.userList = [];
room.spectatorList = [];
room.isSpectator = false;
room.inProgress = false;

room.window = document.getElementById("room-panel");
room.title = document.getElementById("room-title");
room.userDisplay = document.getElementById("room-players");
room.specDisplay = document.getElementById("room-spectators");
room.board = document.getElementById("room-board");

room.setTitle = function(str) {
    room.title.textContent = "Yes, Please!\nRoom: " + str;
};

room.updatePlayers = function() {
    while (room.userDisplay.firstChild)
        room.userDisplay.removeChild(room.userDisplay.firstChild);
    while (room.specDisplay.firstChild)
        room.specDisplay.removeChild(room.specDisplay.firstChild);
    let players;
    let spectators;
    if (room.inProgress)
        players = room.gameState["player-list"];
    else {
        players = [];
        for (let u of room.userList)
            if (!room.spectatorList.includes(u))
                players.push(u);
    }
    spectators = room.spectatorList;
    for (let u of players) {
        let li = document.createElement("li");
        if (u === room.myHandle)
            li.classList.add("user-me");
        li.textContent = u;
        room.userDisplay.appendChild(li);
    }
    for (let u of spectators) {
        let li = document.createElement("li");
        if (u === room.myHandle)
            li.classList.add("user-me");
        li.textContent = u;
        room.specDisplay.appendChild(li);
    }
};

room.updateDisplay = function() {
    if (room.inProgress) {
        
    }
    else {
        
    }
};

room.spectate = function() {
    let content = {
        "querytype": "change-state-spectate"
    };
    comms.sendMessage(content);
};

room.play = function() {
    let content = {
        "querytype": "change-state-play"
    };
    comms.sendMessage(content);
};

room.window.show = function(show) {
    room.window.style.display = show ? "flex" : "none";
};

room.window.enableFocus = function(enabled) {
    // Todo
};

room.handleMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case "room-joined-room":
            room.userList = msg["users"].sort();
            room.spectatorList = msg["spectation-list"].sort();
            room.isSpectator = room.spectatorList.includes(room.myHandle);
            room.setTitle(msg["room-name"]);
            room.updatePlayers();
            room.inProgress = msg["game-ongoing"];
            if (room.inProgress)
                room.gameState = msg["game-status"];
            room.updateDisplay();
            winStack.setWindow(room.window);
            myprompts.showPrompt("Welcome to " + msg["room-name"] + "!",
                                 ["Okay"]);
            break;
        case "room-player-joined":
            room.userList.push(msg["user"]);
            room.userList.sort();
            if (msg["is-spectator"]) {
                if (!room.spectatorList.includes(msg["user"])) {
                    room.spectatorList.push(msg["user"]);
                    room.spectatorList.sort();
                }
            }
            room.updatePlayers();
            break;
        case "room-player-disconnected":
            room.userList = room.userList.filter(x => x !== msg["user"]);
            room.spectatorList = room.spectatorList.filter(
                x => x !== msg["user"]);
            room.updatePlayers();
            break;
        case "room-left-room":
            winStack.setWindow(login.window);
            break;
        case "room-change-status-spectate":
            if (!room.spectatorList.includes(msg["handle"])) {
                room.spectatorList.push(msg["handle"]);
                room.spectatorList.sort();
                room.updatePlayers();
                if (msg["handle"] === room.myHandle) {
                    myprompts.showPrompt("You are now spectating.", ["Okay"]);
                    room.isSpectator = true;
                }
            }
            break;
        case "room-change-status-play":
            room.spectatorList = room.spectatorList.filter(
                x => x !== msg["handle"]);
            room.updatePlayers();
            if (msg["handle"] === room.myHandle) {
                myprompts.showPrompt("You are queued for the game.", ["Okay"]);
                room.isSpectator = false;
            }
            break;
    }
};

room.handleGameMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case game-game-started:
            room.inProgress = true;
            room.updateDisplay();
    }
};
