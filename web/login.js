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
    if (!show) {
        login.errorMessage.innerHTML = "";
        login.passwordField.value = "";
    }
};

login.handleMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case "login-invalid-handle-error":
            login.setErrorStatus("Invalid handle.");
            myprompts.hideAll();
            login.blinkField(login.handleField);
            login.handleField.focus();
            break;
        case "login-invalid-roomname-error":
            login.setErrorStatus("Invalid room name.");
            myprompts.hideAll();
            login.blinkField(login.roomField);
            login.roomField.focus();
            break;
        case "login-room-exists-error":
            login.setErrorStatus("Room already exists.");
            myprompts.hideAll();
            login.blinkField(login.roomField);
            login.roomField.focus();
            break;
        case "login-room-missing-error":
            login.setErrorStatus("Room doesn't exist.");
            myprompts.hideAll();
            login.blinkField(login.roomField);
            login.roomField.focus();
            break;
        case "login-wrong-password-error":
            login.setErrorStatus("Incorrect password.");
            myprompts.hideAll();
            login.blinkField(login.passwordField);
            login.passwordField.value = "";
            login.passwordField.focus();
            break;
        case "login-duplicate-username-error":
            login.setErrorStatus("Handle has already been chosen.");
            myprompts.hideAll();
            login.blinkField(login.handleField);
            login.handleField.focus();
            break;
    }
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
