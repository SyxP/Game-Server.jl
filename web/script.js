var ws;
window.onload = load;

function load(){
	ws = addWebSocket("ws");
	ws.onmessage = function(e){receiveMessage(e.data)}
}

function addWebSocket(instancename, subprotocol){
	let wsuri = document.URL.replace("http:", "ws:");
	if (typeof subprotocol === "undefined") {
		ws = new WebSocket(wsuri)
	} else {
		ws = new WebSocket(wsuri, subprotocol)
	}

	ws.mynam = instancename;
	ws.onerror = function(e) {
		changeWSStatus("WebSocket " + instancename + ".onerror: " +
			"<br>&nbsp;&nbsp;Websocket state is now " + e.target.readyState +
			" " + readystateDesc[e.target.readyState])
	}

	ws.onopen = function(e) {
		changeWSStatus("WebSocket " + instancename + ".onopen: " +
			"<br>&nbsp;&nbsp;Websocket state is now " + e.target.readyState +
			" " + readystateDesc[e.target.readyState])
	}

	ws.onclose = function(e) {
		changeWSStatus("WebSocket " + instancename + ".onclose: Reload page.");
	}

	return ws
}

var readystateDesc = {0:"CONNECTING",
	1:"OPEN",
	2:"CLOSING",
	3:"CLOSED"};

let serverStatusWindow = document.getElementById('server-status')
let serverMessage = document.getElementById('message')
let buttonServerStatusClear = document.getElementById('server-status-clear')
let overlay = document.getElementById('overlay')
// User confirms server status
buttonServerStatusClear.onclick = () => {
	serverStatusWindow.style.display = 'none'
	overlay.style.display = 'none'
}
function changeWSStatus(msg){
	serverMessage.innerHTML = msg
	serverStatusWindow.style.display = 'block'
	overlay.style.display = 'block'
}

function sendonWS(websocket, msg){
	if(websocket.readyState == 1){
		websocket.send(msg);
		return true;
	} else {
		changeWSStatus("WebSocket not ready. Reload page or check server!");
		return false;
	}
}

let buttonJoinRoom = document.getElementById('join-enter')
let buttonMakeRoom = document.getElementById('join-create')

function getParticulars(){
	return { "handle"   : document.getElementById('join-handle').value ,
		 "roomname" : document.getElementById('join-room').value ,
		 "roompass" : document.getElementById('join-pass').value }
}
buttonJoinRoom.onclick = () => {
	let content = { "querytype"  : "join-room" ,
			"particulars": getParticulars() }
	if (sendonWS(ws, JSON.stringify(content))) {
		//success
	}
}

buttonMakeRoom.onclick = () => {
        let content = { "querytype"  : "make-room" ,
                        "particulars": getParticulars() }
        if (sendonWS(ws, JSON.stringify(content))) {
                //success
        }
}

function updateLoginError(msg) {
	document.getElementById("error-message").innerHTML = msg
}

function receiveMessage(msgdata) {
	let msg = JSON.parse(msgdata)
	let msgtype = msg.responsetype
	switch(msgtype) {
		case "room-exists-error":
			updateLoginError("Room already exists.")
			break;
		case "room-missing-error":
			updateLoginError("Room doesn't exist.")
			break;
		case "wrong-password-error":
			updateLoginError("Incorrect Password.")
			break;
	}
}
