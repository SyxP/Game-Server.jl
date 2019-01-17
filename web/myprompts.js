var myprompts = myprompts || {};

myprompts.currentPrompt = null;
myprompts.lastResult = null;

myprompts.overlay = document.getElementById("overlay");

myprompts.showPrompt = function(message,
                                buttons,
                                default_opt,
                                cancel_opt,
                                callback) {
    if (myprompts.currentPrompt !== null)
        winStack.pop();
    let prompt = document.createElement("div");
    prompt.classList.add("prompt");
    prompt.tabIndex = -1;
    
    if (typeof message === "string") {
        let body = document.createElement("h3");
        body.classList.add("prompt-body");
        body.textContent = message;
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
            btn.textContent = b;
            btn.tabIndex = 0;
            btn.addEventListener("click", function(e) {
                myprompts.lastResult = b;
                winStack.pop();
                if (callback)
                    callback(b);
            });
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
    prompt.handleKey = function(event) {
        let cancel = false;
        switch (event.key) {
            case "Enter":
                if (document.activeElement.tagName !== "BUTTON") {
                    if (btns_e.length === 1) {
                        btns_e[0].click();
                        cancel = true;
                    }
                    else if (btns_e.length > 1 &&
                             typeof default_opt !== "undefined") {
                        btns_e[default_opt].click();
                        cancel = true;
                    }
                }
                break;
            case "Escape":
                if (btns_e.length === 1) {
                    btns_e[0].click();
                    cancel = true;
                }
                else if (btns_e.length > 1 &&
                         typeof cancel_opt !== "undefined") {
                    btns_e[cancel_opt].click();
                    cancel = true;
                }
        }
        if (cancel) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    myprompts.currentPrompt = prompt;
    winStack.push(prompt);
};

myprompts.clearPrompt = function() {
    if (myprompts.currentPrompt !== null)
        winStack.pop();
};
