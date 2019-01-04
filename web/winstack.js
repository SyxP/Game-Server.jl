var winStack = winStack || {};

winStack.stack = [];

winStack.push = function(wnd) {
    if (winStack.stack.length > 0)
        winStack.topLevel().enableFocus(false);
    winStack.stack.push({
        "window": wnd,
        "last_focus": document.activeElement
    });
    wnd.show(true);
};

winStack.pop = function() {
    if (winStack.stack.length > 0) {
        let last = winStack.stack.pop();
        let wnd = last["window"];
        let target = last["last_focus"];
        wnd.show(false);
        if (winStack.stack.length > 0)
            winStack.topLevel().enableFocus(true);
        if (target)
            target.focus();
    }
};

winStack.setWindow = function(wnd) {
    while (winStack.stack.length > 0)
        winStack.pop();
    winStack.push(wnd);
};

winStack.topLevel = function() {
    return winStack.stack[winStack.stack.length - 1]["window"];
};

document.onkeydown = function(e) {
    // Todo
};

window.onload = function(e) {
    winStack.push(login.window);
    comms.load();
};