var room = room || {};

room.userList = [];
room.spectatorList = [];
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

room.show = function(show) {
    room.window.style.display = show ? "flex" : "none";
};
