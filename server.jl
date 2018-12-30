using  WebSockets
import WebSockets:Response, Request

using JSON
using Sockets

const LOCALIP = string(Sockets.getipaddr())
const HTTPPORT = 8080

getFile(str) = read(joinpath(@__DIR__,str), String)

const validSuffix = Dict("/"           => getFile("web/index.html"), 
		    	 "/index.html" => getFile("web/index.html"), 
		   	 "/style.css"  => getFile("web/style.css"), 
		   	 "/script.js"  => getFile("web/script.js"))

function HTMLHandler(req::Request)
	if req.method == "GET" && haskey(validSuffix, req.target)
		return validSuffix[req.target] |> Response
	end
	"" |> Response ## 404 - Page Not Found Message
end

function WSGatekeeper(req, ws)
	orig = WebSockets.origin(req)
	if occursin(LOCALIP, orig)
		#Run Main Coroutine
		coroutine(ws)
	else
		@warn("Unauthorized websocket connection, $orig not approved by gatekee
per, expected $LOCALIP")
	end
	nothing
end

const RoomPass = Dict{String, String}()
const RoomDict = Dict{String, Vector{WebSocket}}()
const Usernames = Dict{String, Set{String}}()
const getRoomfromWS = Dict{WebSocket, String}()
const getHandlefromWS = Dict{WebSocket, String}()

function coroutine(currws)
	while isopen(currws)
		data, success = readguarded(currws)
		!success && break
		textmsg = String(data)
		println("Recieved: $textmsg")	
		msg = JSON.parse(textmsg)
		!validJSON(msg, "querytype") && break 
		if msg["querytype"] == "join-room"
			!validJSON(msg, "particulars") && break
			joinroom(currws, msg["particulars"])
		elseif msg["querytype"] == "make-room"
			!validJSON(msg, "particulars") && break
			makeroom(currws, msg["particulars"])
		end
	end
	
	# Clean up External References
	removereferences(currws)
	nothing
end

# Returns true when JSON has all the fields
function validJSON(JSON, fields::Array{String})
	for i in fields
		if !haskey(JSON, i)
			println("Invalid JSON recieved")
			println("$(String(logdetails)) is missing field $i")
			return false
		end
	end
	return true
end

validJSON(logdetails, field::String) = validJSON(logdetails, [field])

function makeroom(currws, logdetails)
	!validJSON(logdetails, ["handle", "roomname", "roompass"]) && return
	handle = logdetails["handle"]
	roomname = logdetails["roomname"]
	roompass = logdetails["roompass"]

	if haskey(RoomPass, roomname)
		# Room Already Exists
		writeguarded(currws, "{ \"responsetype\" : \"room-exists-error\" }")
		return
	end
	
	getRoomfromWS[currws] = roomname
	getHandlefromWS[currws] = handle

	RoomPass[roomname] = roompass
	Usernames[roomname] = Set{String}()
	push!(Usernames[roomname], handle)
	RoomDict[roomname] = Vector{WebSocket}()
	push!(RoomDict[roomname], currws)

	roomsuccess(currws)
end

function joinroom(currws, logdetails)
	!validJSON(logdetails, ["handle", "roomname", "roompass"]) && return
        handle = logdetails["handle"]
        roomname = logdetails["roomname"]
        roompass = logdetails["roompass"]

	if !haskey(RoomPass, roomname)
		# Room Doesn't Exist
		writeguarded(currws, "{ \"responsetype\" : \"room-missing-error\" }")
		return
	elseif RoomPass[roomname] != roompass
		# Wrong Password
		writeguarded(currws, "{ \"responsetype\" : \"wrong-password-error\" }")
		return
	end

	getRoomfromWS[currws] = roomname
	getHandlefromWS[currws] = handle

	push!(Usernames[roomname], handle)
	push!(RoomDict[roomname], currws)

	roomsuccess(currws)
end

roomsize(roomname) = length(Username[roomname])

function removereferences(ws)
	if haskey(getRoomfromWS, ws)
		roomname = getRoomfromWS[ws] 
		handle = getHandlefromWS[ws]

		pop!(getRoomfromWS, ws)
		pop!(getHandlefromWS, ws)

		if haskey(Username[roomname], handle)
			pop!(Username[roomname], handle)
		end
		if haskey(RoomDict[roomname], ws)
			pop!(RoomDict[roomname], ws)
		end

		if roomsize(roomname) == 0 
			pop!(RoomPass, roomname)
		end
	end
	
	nothing
end

function roomsuccess(currws)
end

global SERVER = WebSockets.ServerWS(HTMLHandler, WSGatekeeper)
@async WebSockets.serve(SERVER, LOCALIP, HTTPPORT)
println("HTTP Server listening on $LOCALIP:$HTTPPORT.")
