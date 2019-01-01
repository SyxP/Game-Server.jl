var room = room || {};

room.userList = [];
room.spectatorList = [];
room.isSpectator = false;
room.inProgress = false;
room.window = document.getElementById("room-panel");
room.title = document.getElementById("room-title");
room.userDisplay = document.getElementById("room-players");
room.board = document.getElementById("room-board");

room.setTitle = function(str) {
    room.title.innerHTML = "Yes, Please!<br>Room: " + str;
};

room.updatePlayers = function() {
    while (room.userDisplay.firstChild)
        room.userDisplay.removeChild(room.userDisplay.firstChild);
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
        li.classList.add("user-player");
        if (u === room.myHandle)
            li.classList.add("user-me");
        li.innerHTML = u;
        room.userDisplay.appendChild(li);
    }
    for (let u of spectators) {
        let li = document.createElement("li");
        li.classList.add("user-spectator");
        if (u === room.myHandle)
            li.classList.add("user-me");
        li.innerHTML = u;
        room.userDisplay.appendChild(li);
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

room.show = function(show) {
    room.window.style.display = show ? "flex" : "none";
};

room.handleMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case "room-joined-room":
            room.userList = msg["users"].sort();
            room.spectatorList = msg["spectation-list"].sort();
            room.isSpectator = false;
            room.setTitle(msg["room-name"]);
            room.updatePlayers();
            room.inProgress = msg["game-ongoing"];
            if (room.inProgress)
                room.gameState = msg["game-status"];
            room.updateDisplay();
            login.show(false);
            room.show(true);
            myprompts.showPrompt(myprompts.okayPrompt,
                                 "Welcome to " + msg["room-name"] + "!");
            break;
        case "room-player-joined":
            room.userList.push(msg["user"]);
            room.userList.sort();
            room.updatePlayers();
            break;
        case "room-player-disconnected":
            room.userList = room.userList.filter(x => x !== msg["user"]);
            room.updatePlayers();
            break;
        case "room-left-room":
            myprompts.hideAll();
            room.show(false);
            login.show(true);
            break;
        case "room-change-status-spectate":
            room.spectatorList.push(msg["handle"]);
            room.spectatorList.sort();
            room.updatePlayers();
            if (msg["handle"] === room.myHandle) {
                myprompts.showPrompt(myprompts.okayPrompt,
                                     "You are now spectating.");
                room.isSpectator = true;
            }
            break;
        case "room-change-status-play":
            room.spectatorList = room.spectatorList.filter(
                x => x !== msg["handle"]);
            room.updatePlayers();
            if (msg["handle"] === room.myHandle) {
                myprompts.showPrompt(myprompts.okayPrompt,
                                     "You are queued for the game.");
                room.isSpectator = false;
            }
            break;
    }
};
