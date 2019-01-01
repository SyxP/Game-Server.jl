var myprompts = myprompts || {};

myprompts.overlay = document.getElementById("overlay");

myprompts.okayPrompt = document.getElementById("okay-prompt");
myprompts.okayPromptMessage = document.getElementById("okay-prompt-body");
myprompts.okayPrompt.body = myprompts.okayPromptMessage;
myprompts.okayPromptBtn = document.getElementById("okay-prompt-btn-okay");

myprompts.messagePrompt = document.getElementById("message-prompt");
myprompts.messagePromptMessage = document.getElementById("message-prompt-body");
myprompts.messagePrompt.body = myprompts.messagePromptMessage;

myprompts.hideAll = function() {
    myprompts.overlay.style.display = "none";
    for (let p of myprompts.allPrompts)
        p.style.display = "none";
};

myprompts.showPrompt = function(wnd, msg, exec) {
    myprompts.hideAll();
    wnd.body.innerHTML = msg;
    if (exec)
        myprompts.okayPromptBtn.onclick = function () {
            myprompts.hideAll();
            exec();
        };
    else
        myprompts.okayPromptBtn.onclick = myprompts.hideAll;
    myprompts.overlay.style.display = "block";
    wnd.style.display = "block";
    myprompts.okayPromptBtn.focus();
};

myprompts.allPrompts = [
    myprompts.okayPrompt,
    myprompts.messagePrompt
];
