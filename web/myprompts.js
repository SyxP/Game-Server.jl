var myprompts = myprompts || {};

myprompts.currentPrompt = null;
myprompts.lastResult = null;

myprompts.overlay = document.getElementById("overlay");

myprompts.showPrompt = function(message, buttons, default_opt) {
    if (myprompts.currentPrompt !== null)
        winStack.pop();
    let prompt = document.createElement("div");
    prompt.classList.add("prompt");
    prompt.tabIndex = -1;
    
    if (typeof message === "string") {
        let body = document.createElement("h3");
        body.classList.add("prompt-body");
        body.innerHTML = message;
        prompt.appendChild(body);
    }
    else
        prompt.appendChild(message);
    
    let btns_e = [];
    if (buttons && buttons.length > 0) {
        let btns = document.createElement("div");
        btns.classList.add("prompt-buttons");
        for (let b of buttons) {
            let btn = document.createElement("button");
            btn.innerHTML = b;
            btn.tabIndex = 0;
            btn.onclick = function(e) {
                myprompts.lastResult = b;
                winStack.pop();
            };
            btns_e.push(btn);
            btns.appendChild(btn);
        }
        prompt.appendChild(btns);
    }
    prompt.show = function(show) {
        myprompts.overlay.style.display = show ? "block" : "none";
        if (show) {
            document.body.appendChild(prompt);
            if (btns_e.length > 0) {
                let i = default_opt || 0;
                btns_e[i].focus();
            }
            else
                prompt.focus();
        }
        else {
            document.body.removeChild(prompt);
            myprompts.currentPrompt = null;
            myprompts.overlay.style.display = "none";
        }
    };
    prompt.enableFocus = function(enabled) {
        for (let b of btns_e)
            btns_e.tabIndex = enabled ? 0 : -1;
    };
    myprompts.currentPrompt = prompt;
    winStack.push(prompt);
};

myprompts.clearPrompt = function() {
    if (myprompts.currentPrompt !== null)
        winStack.pop();
};
