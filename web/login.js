var login = login || {};

login.window = document.getElementById("login-panel");
login.handleField = document.getElementById("join-handle");
login.roomField = document.getElementById("join-room");
login.passwordField = document.getElementById("join-pass");
login.joinRoomBtn = document.getElementById("join-enter");
login.makeRoomBtn = document.getElementById("join-create");
login.errorMessage = document.getElementById("error-message");

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

login.blinkField = function(field) {
    field.classList.remove("anim-blinkerror");
    void field.offsetWidth;
    field.classList.add("anim-blinkerror");
};

login.show = function(show) {
    login.window.style.display = show ? "block" : "none";
};

login.joinRoomBtn.onclick = function() {
    room.myHandle = login.handleField.value;
    let content = {
        "querytype":   "join-room",
        "particulars": login.getParticulars()
    };
    myprompts.showPrompt(myprompts.messagePrompt, "Please wait...");
    comms.sendMessage(content);
};

login.makeRoomBtn.onclick = function() {
    room.myHandle = login.handleField.value;
    let content = {
        "querytype":   "make-room",
        "particulars": login.getParticulars()
    };
    myprompts.showPrompt(myprompts.messagePrompt, "Please wait...");
    comms.sendMessage(content);
};
