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
    login.errorMessage.textContent = msg;
};

login.blinkField = function(field) {
    field.classList.remove("anim-blinkerror");
    void field.offsetWidth;
    field.classList.add("anim-blinkerror");
};

login.window.show = function(show) {
    login.window.style.display = show ? "block" : "none";
    if (show)
        login.handleField.focus();
    else {
        login.errorMessage.innerHTML = "";
        login.passwordField.value = "";
        login.handleField.classList.remove("anim-blinkerror");
        login.roomField.classList.remove("anim-blinkerror");
        login.passwordField.classList.remove("anim-blinkerror");
    }
};

login.window.handleKey = function(event) {
    switch (event.key) {
        case "Enter":
            if (document.activeElement.tagName === "BUTTON")
                break;
            if (event.ctrlKey)
                login.makeRoomBtn.click();
            else
                login.joinRoomBtn.click();
            event.preventDefault();
            event.stopPropagation();
            break;
    }
};

login.handleMessage = function(msg) {
    let msgType = msg.responsetype;
    switch (msgType) {
        case "login-invalid-handle-error":
            login.setErrorStatus("Invalid handle.");
            myprompts.clearPrompt();
            login.blinkField(login.handleField);
            login.handleField.focus();
            login.handleField.select();
            break;
        case "login-invalid-roomname-error":
            login.setErrorStatus("Invalid room name.");
            myprompts.clearPrompt();
            login.blinkField(login.roomField);
            login.roomField.focus();
            login.roomField.select();
            break;
        case "login-room-exists-error":
            login.setErrorStatus("Room already exists.");
            myprompts.clearPrompt();
            login.blinkField(login.roomField);
            login.roomField.focus();
            login.roomField.select();
            break;
        case "login-room-missing-error":
            login.setErrorStatus("Room doesn't exist.");
            myprompts.clearPrompt();
            login.blinkField(login.roomField);
            login.roomField.focus();
            login.roomField.select();
            break;
        case "login-wrong-password-error":
            login.setErrorStatus("Incorrect password.");
            myprompts.clearPrompt();
            login.blinkField(login.passwordField);
            login.passwordField.value = "";
            login.passwordField.focus();
            break;
        case "login-duplicate-username-error":
            login.setErrorStatus("Handle has already been chosen.");
            myprompts.clearPrompt();
            login.blinkField(login.handleField);
            login.handleField.focus();
            login.handleField.select();
            break;
    }
};

login.joinRoomBtn.addEventListener("click", function(e) {
    room.myHandle = login.handleField.value;
    let content = {
        "querytype":   "join-room",
        "particulars": login.getParticulars()
    };
    myprompts.showPrompt("Please wait...");
    comms.sendMessage(content);
});

login.makeRoomBtn.addEventListener("click", function(e) {
    room.myHandle = login.handleField.value;
    let content = {
        "querytype":   "make-room",
        "particulars": login.getParticulars()
    };
    myprompts.showPrompt("Please wait...");
    comms.sendMessage(content);
});
