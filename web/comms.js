var comms = comms || {};

comms.readyStateDesc = {
    0: "CONNECTING",
    1: "OPEN",
    2: "CLOSING",
    3: "CLOSED"
};

comms.load = function() {
    comms.ws = comms.addWebSocket("ws");
    comms.ws.addEventListener("message", function(e) {
        comms.receiveMessage(e.data);
    });
    myprompts.showPrompt("Connecting...");
};

comms.addWebSocket = function(instanceName, subprotocol) {
    let ws;
    let wsuri = document.URL.replace("http:", "ws:");
    if (typeof subprotocol === "undefined")
        ws = new WebSocket(wsuri);
    else
        ws = new WebSocket(wsuri, subprotocol);
    ws.myName = instanceName;
    ws.addEventListener("error", function(e) {
        myprompts.showPrompt("Error: " + e);
    });
    ws.addEventListener("open", function(e) {
        myprompts.showPrompt("Successfully connected!", ["Okay"]);
    });
    ws.addEventListener("close", function(e) {
        myprompts.showPrompt("Disconnected. Reload page.");
    });
    
    return ws;
};

comms.sendMessage = function(msg) {
    if (comms.ws.readyState === 1) {
        let msgData = JSON.stringify(msg);
        comms.ws.send(msgData);
        return true;
    }
    myprompts.showPrompt("WebSocket not ready. Reload page or check server!");
    return false;
};

comms.receiveMessage = function(msgData) {
    let msg = JSON.parse(msgData);
    console.log(msg);
    let msgType = msg.responsetype;
    if (msgType.startsWith("login-"))
        login.handleMessage(msg);
    else if (msgType.startsWith("room-"))
        room.handleMessage(msg);
    else if (msgType.startsWith("game-"))
        room.handleGameMessage(msg);
};
