var room = room || {};

room.userList = [];
room.spectatorList = [];
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
