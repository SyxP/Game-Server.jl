var room = room || {};

room.myHandle = "";
room.users = {};
room.players = [];
room.spectators = [];
room.inProgress = false;
room.commands = [];
room.toShowResult = false;
room.resultBuffer = null;

room.window = document.getElementById("room-panel");
room.title = document.getElementById("room-title");
room.userDisplay = document.getElementById("room-players");
room.specDisplay = document.getElementById("room-spectators");
room.gameDisplay = document.getElementById("room-display");
room.userInput = document.getElementById("room-input-user");
room.concurrentDisplay = document.getElementById("room-input-result");
room.concurrentDisplay.addEventListener("transitionend", function(e) {
    let vis = window.getComputedStyle(room.concurrentDisplay).visibility;
    if (vis === "hidden" && room.toShowResult) {
        room.toShowResult = false;
        room.showResult(room.resultBuffer);
    }
});
room.closeDisplayBtn = document.getElementById("room-close-result");
room.closeDisplayBtn.addEventListener("click", function(e) {
    room.hideResult();
});

room.leaveCommand = {
    "name": "leave",
    "desc": "Leave the room",
    "func": function() {
                room.leave();
            }
};

room.spectateCommand = {
    "name": "spectate",
    "desc": "Change to spectator",
    "func": function() {
                room.spectate();
            }
};

room.playCommand = {
    "name": "play",
    "desc": "Change to player",
    "func": function() {
                room.play();
            }
};

room.startCommand = {
    "name": "start",
    "desc": "Start the game with current players",
    "func": function() {
                room.startGame();
            }
};

room.helpCommand = {
    "name": "?",
    "desc": "List all available commands",
    "func": function() {
                room.displayCommands();
            }
};

room.helpCommand2 = {
    "name": "help",
    "hidden": true,
    "desc": "List all available commands",
    "func": function() {
                room.displayCommands();
            }
};

room.createCommandElement = function(command, display) {
    if (typeof display === "undefined")
        display = command;
    let elem = document.createElement("tt");
    elem.classList.add("room-link");
    elem.addEventListener("click", function(e) {
        room.userInput.value = command;
        room.userInput.focus();
        room.userInput.setSelectionRange(
            room.userInput.value.length,
            room.userInput.value.length
        );
    });
    elem.textContent = display;
    return elem;
};

room.genCommandTable = function(commands) {
    if (typeof commands === "undefined")
        commands = room.commands;
    let elem = document.createElement("table");
    let headerRow = document.createElement("tr");
    let cHeader = document.createElement("th");
    cHeader.textContent = "Command Name";
    headerRow.appendChild(cHeader);
    let dHeader = document.createElement("th");
    dHeader.textContent = "Command Description";
    headerRow.appendChild(dHeader);
    elem.appendChild(headerRow);
    for (let command of commands) {
        if (command["hidden"])
            continue;
        let row = document.createElement("tr");
        let name = document.createElement("td");
        let wrapper = room.createCommandElement(command["name"]);
        name.appendChild(wrapper);
        row.appendChild(name);
        let desc = document.createElement("td");
        desc.textContent = command["desc"];
        row.appendChild(desc);
        elem.appendChild(row);
    }
    return elem;
};

room.placeholder = (function() {
    let elem = document.createElement("div");
    let center = document.createElement("center");
    let text = document.createElement("b");
    text.textContent = "Waiting for game...";
    center.appendChild(text);
    let table = room.genCommandTable([
        room.startCommand,
        room.spectateCommand,
        room.playCommand,
        room.leaveCommand,
        room.helpCommand
    ]);
    center.appendChild(table);
    elem.appendChild(center);
    return elem;
})();

room.consumeInput = function() {
    room.userInput.value = "";
};

room.consumeToken = function() {
    room.userInput.value = room.userInput.value.replace(/^\s*[^\s]+\s*/,"");
};

room.showResult = function(content) {
    let vis = window.getComputedStyle(room.concurrentDisplay).visibility;
    if (vis === "hidden") {
        while (room.concurrentDisplay.firstChild)
            room.concurrentDisplay.removeChild(
                room.concurrentDisplay.firstChild);
        room.concurrentDisplay.appendChild(content);
        room.concurrentDisplay.appendChild(room.closeDisplayBtn);
        room.concurrentDisplay.classList.add("show-result");
    }
    else {
        room.toShowResult = true;
        room.resultBuffer = content;
        room.hideResult();
    }
};

room.hideResult = function() {
    room.concurrentDisplay.classList.remove("show-result");
    room.userInput.focus();
};

room.setTitle = function(str) {
    room.title.textContent = "Yes, Please!\nRoom: " + str;
};

room.userData = function(handle) {
    if (typeof handle === "undefined")
        handle = room.myHandle;
    return room.users["user-" + handle] || null;
};

room.spectating = function(handle) {
    if (typeof handle === "undefined")
        handle = room.myHandle;
    return room.userData(room.myHandle)["spectating"];
};

room.addUser = function(handle) {
    let data = room.userData(handle);
    if (data === null) {
        let elem = document.createElement("li");
        elem.textContent = handle;
        data = {
            "handle": handle,
            "spectating": false,
            "list-elem": elem
        };
        room.users["user-" + handle] = data;
    }
};

room.dropUser = function(handle) {
    let data = room.userData(handle);
    if (data !== null) {
        if (data["spectating"])
            room.removeSpectator(handle);
        else
            room.removePlayer(handle);
        delete room.users["user-" + handle];
    }
};

room.addPlayer = function(handle) {
    let node = room.userData(handle)["list-elem"];
    let l = 0;
    let r = room.players.length;
    while (l < r) {
        let m = Math.floor((l + r) / 2);
        let mv = room.players[m];
        if (handle < mv)
            r = m;
        else
            l = m + 1;
    }
    if (l < room.players.length) {
        let bHandle = room.players[l];
        room.players.splice(l, 0, handle);
        room.userDisplay.insertBefore(node,
                                      room.userData(bHandle)["list-elem"]);
    }
    else {
        room.players.push(handle);
        room.userDisplay.appendChild(node);
    }
};

room.removePlayer = function(handle) {
    room.players = room.players.filter((x) => x !== handle);
    room.userDisplay.removeChild(room.userData(handle)["list-elem"]);
};

room.addSpectator = function(handle) {
    let node = room.userData(handle)["list-elem"];
    let l = 0;
    let r = room.spectators.length;
    while (l < r) {
        let m = Math.floor((l + r) / 2);
        let mv = room.spectators[m];
        if (handle < mv)
            r = m;
        else
            l = m + 1;
    }
    if (l < room.spectators.length) {
        let bHandle = room.spectators[l];
        room.spectators.splice(l, 0, handle);
        room.specDisplay.insertBefore(node,
                                      room.userData(bHandle)["list-elem"]);
    }
    else {
        room.spectators.push(handle);
        room.specDisplay.appendChild(node);
    }
};

room.removeSpectator = function(handle) {
    room.spectators = room.spectators.filter((x) => x !== handle);
    room.specDisplay.removeChild(room.userData(handle)["list-elem"]);
};

room.populate = function(users, spectators) {
    for (let u of users)
        room.addUser(u);
    room.userData()["list-elem"].classList.add("user-me");
    for (let u of spectators)
        room.userData(u)["spectating"] = true;
    for (let u of users) {
        let data = room.userData(u);
        if (data["spectating"])
            room.addSpectator(u);
        else
            room.addPlayer(u);
    }
};

room.updateDisplay = function() {
    room.gameDisplay.innerHTML = "";
    if (room.inProgress) {
        
    }
    else
        room.gameDisplay.appendChild(room.placeholder);
};

room.updateCommands = function() {
    room.commands = [];
    if (room.inProgress)
        room.commands = game.getCommands();
    else {
        if (room.spectating())
            room.commands.push(room.playCommand);
        else {
            room.commands.push(room.startCommand);
            room.commands.push(room.spectateCommand);
        }
    }
    room.commands.push(room.leaveCommand);
    room.commands.push(room.helpCommand);
    room.commands.push(room.helpCommand2);
};

room.processCommand = function(tokens) {
    for (let command of room.commands) {
        if (command.name === tokens[0]) {
            command.func.call(null, tokens.slice(1));
            room.consumeInput();
            return;
        }
    }
    let span = document.createElement("span");
    let err1 = document.createTextNode("Unrecognised command ");
    let tt = document.createElement("tt");
    tt.textContent = tokens[0];
    let err2 = document.createTextNode(".");
    span.appendChild(err1);
    span.appendChild(tt);
    span.appendChild(err2);
    room.showResult(span);
};

room.displayCommands = function() {
    room.showResult(room.genCommandTable());
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

room.leave = function() {
    myprompts.showPrompt("Are you sure?", ["Yes", "No"], 0, 1, function(r) {
        if (r === "Yes") {
            myprompts.showPrompt("Please wait...");
            let content = {
                "querytype": "leave-room"
            };
            comms.sendMessage(content);
        }
    });
};

room.startGame = function() {
    if (!room.inProgress) {
        let content = {
            "querytype": "start-game"
        };
        comms.sendMessage(content);
    }
};

room.window.show = function(show) {
    room.window.style.display = show ? "flex" : "none";
    if (show) {
        room.consumeInput();
        room.userInput.focus();
    }
    else
        room.hideResult();
};

room.window.handleKey = function(event) {
    let cancel = false;
    switch (event.key) {
        case "Enter":
            if (document.activeElement === room.userInput) {
                let commands = room.userInput.value.trim().split(/\s+/);
                if (commands.length > 0)
                    room.processCommand(commands);
            }
            break;
        case "Escape":
            if (room.concurrentDisplay.classList.contains("show-result")) {
                room.hideResult();
                cancel = true;
            }
            break;
    }
    if (cancel) {
        event.preventDefault();
        event.stopPropagation();
    }
};

room.handleMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case "room-joined-room":
            room.setTitle(msg["room-name"]);
            room.populate(msg["users"], msg["spectation-list"]);
            room.inProgress = msg["game-ongoing"];
            if (room.inProgress)
                room.gameState = msg["game-status"];
            room.updateDisplay();
            room.updateCommands();
            winStack.setWindow(room.window);
            myprompts.showPrompt("Welcome to " + msg["room-name"] + "!",
                                 ["Okay"]);
            break;
        case "room-player-joined":
            room.addUser(msg["user"]);
            if (msg["is-spectator"]) {
                room.userData(msg["user"])["spectating"] = true;
                room.addSpectator(msg["user"]);
            }
            else
                room.addPlayer(msg["user"]);
            break;
        case "room-player-disconnected":
            room.dropUser(msg["user"]);
            break;
        case "room-left-room":
            winStack.setWindow(login.window);
            break;
        case "room-change-status-spectate":
            if (!room.userData(msg["handle"])["spectating"]) {
                room.userData(msg["handle"])["spectating"] = true;
                room.addSpectator(msg["handle"]);
                if (msg["handle"] === room.myHandle) {
                    room.showResult(
                        document.createTextNode("You are now spectating."));
                    room.updateCommands();
                }
            }
            break;
        case "room-change-status-play":
            if (room.userData(msg["handle"])["spectating"]) {
                room.userData(msg["handle"])["spectating"] = false;
                room.addPlayer(msg["handle"]);
                if (msg["handle"] === room.myHandle) {
                    room.showResult(
                        document.createTextNode("You are queued for the game.")
                    );
                    room.updateCommands();
                }
            }
            break;
    }
};

room.handleGameMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case game-game-started:
            room.inProgress = true;
            room.gameState = msg["game-status"];
            room.updateDisplay();
    }
};
