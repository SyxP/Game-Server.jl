var winStack = winStack || {};

winStack.stack = [];

winStack.push = function(wnd) {
    let stackItem = {
        "window": wnd,
        "last_focus": document.activeElement
    };
    if (winStack.stack.length > 0) {
        let focusGuard = function(e) {
            winStack.topLevel().focus();
        };
        stackItem["focus_guard"] = focusGuard;
        winStack.topLevel().addEventListener("focusin", focusGuard);
    }
    winStack.stack.push(stackItem);
    wnd.show(true);
};

winStack.pop = function() {
    if (winStack.stack.length > 0) {
        let last = winStack.stack.pop();
        let wnd = last["window"];
        let target = last["last_focus"];
        let focusGuard = last["focus_guard"];
        wnd.show(false);
        if (target)
            target.focus();
        if (focusGuard)
            winStack.topLevel().removeEventListener("focusin", focusGuard);
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

document.addEventListener("keydown", function(e) {
    if (winStack.topLevel().handleKey)
        winStack.topLevel().handleKey(e);
});

window.addEventListener("load", function(e) {
    winStack.push(login.window);
    comms.load();
});