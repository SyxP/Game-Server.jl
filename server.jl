using  WebSockets
import WebSockets:Response, Request

using JSON
using Sockets
using Dates

include("game-logic.jl")

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
        # Run Main Coroutine
        coroutine(ws)
    else
        @warn("Unauthorized websocket connection, $orig not approved by gatekeeper, expected $LOCALIP")
    end
    nothing
end

const WSInRoom = Set{WebSocket}()
const RoomPass = Dict{String, String}()
const RoomDict = Dict{String, Set{WebSocket}}()
const Usernames = Dict{String, Set{String}}()
const getRoomfromWS = Dict{WebSocket, String}()
const getHandlefromWS = Dict{WebSocket, String}()
const SpecDict = Dict{String, Set{String}}()
const RoomGames = Dict{String, YesPleaseGame}()

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
        elseif msg["querytype"] == "leave-room"
            leaveroom(currws)
        elseif msg["querytype"] == "change-state-spectate"
            changestatespec(currws)
        elseif msg["querytype"] == "change-state-play"
            changestateplay(currws)
        elseif msg["querytype"] in YPCommandsList
            YPServer(msg, currws)
        end
    end
    
    # Clean up External References
    removereferences(currws)
    nothing
end

# Returns true when currws in a room
function inRoom(currws)
    if !haskey(getRoomfromWS, currws)
        println("Invalid Game Command occured outside Room")
        errormsg(currws, "not-in-room")
        return false
    end
    return true
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

    if currws in WSInRoom
        # WebSocket already in Room
        return
    elseif haskey(RoomPass, roomname)
        # Room Already Exists
        errormsg(currws, "room-exists") 
        return
    end
    
    push!(WSInRoom, currws)
    getRoomfromWS[currws] = roomname
    getHandlefromWS[currws] = handle
    
    RoomPass[roomname] = roompass
    Usernames[roomname] = Set{String}()
    push!(Usernames[roomname], handle)
    RoomDict[roomname] = Set{WebSocket}()
    push!(RoomDict[roomname], currws)
    
    roomsuccess(currws)
end

validName(handle) = !(strip(handle) == "")

function joinroom(currws, logdetails)
    !validJSON(logdetails, ["handle", "roomname", "roompass"]) && return
        handle = logdetails["handle"]
        roomname = logdetails["roomname"]
        roompass = logdetails["roompass"]
    
    if currws in WSInRoom
        # WebSocket already in Room
        return
    elseif !validName(handle)
        # Whitespace only Handle
        return errormsg(currws, "invalid-handle") 
    elseif !validName(roomname)
        # Whitespace only Name
        return errormsg(currws, "invalid-roomname")
    elseif !haskey(RoomPass, roomname)
        # Room Doesn't Exist
        return errormsg(currws, "room-missing")
    elseif RoomPass[roomname] != roompass
        # Wrong Password
        return errormsg(currws, "wrong-password")
    elseif handle in Usernames[roomname]
        # Duplicated Username
        return errormsg(currws, "duplicate-username")
    end
    
    push!(WSInRoom, currws)
    getRoomfromWS[currws] = roomname
    getHandlefromWS[currws] = handle

    push!(Usernames[roomname], handle)
    push!(RoomDict[roomname], currws)
    roomsuccess(currws)
end

roomsize(roomname) = length(Usernames[roomname])

# WebSocket disconnected.
function removereferences(ws)
    if ws in WSInRoom
        roomname = getRoomfromWS[ws] 
        handle = getHandlefromWS[ws]
        
        pop!(WSInRoom, ws)
        pop!(getRoomfromWS, ws)
        pop!(getHandlefromWS, ws)

        if handle in Usernames[roomname]
            pop!(Usernames[roomname], handle)
        end
        if ws in RoomDict[roomname]
            # Player Disconnected from Room
            pop!(RoomDict[roomname], ws)
            playerdisconnected(RoomDict[roomname], handle)
        end

        if roomsize(roomname) == 0 
            # Clean-up Empty Room (Free-up Password)
            pop!(RoomPass, roomname)
            delete!(RoomGames, roomname)
            delete!(SpecDict, roomname)
        end
    end
    
    nothing
end

function leaveroom(currws)
    removereferences(currws)
    msg = Dict{String, Any}()
    msg["responsetype"] = "left-room"
    msg["server-time"] = Dates.now()

    writeguarded(ws, JSON.json(msg))

    nothing
end

function roomsuccess(currws)
    # Send join-room
    msg = Dict{String, Any}()
    msg["responsetype"] = "joined-room"
    
    roomname = getRoomfromWS[currws]
    # Includes yourself in player list
    msg["users"] = getUsers(roomname)
    msg["game-ongoing"] = haskey(RoomGames, roomname)
    msg["room-name"] = roomname
    msg["server-time"] = Dates.now()
    msg["spectation-list"] = getSpectators(roomname)
    if haskey(RoomGames, roomname)
        # Send Game State to Player
        msg["game-status"] = gameState(RoomGames[roomname])
    end
    
    writeguarded(currws, JSON.json(msg))
    
    # Send the rest of players a player-join message
    playerjoined(RoomDict[roomname], getHandlefromWS[currws])
    nothing
end

function playerjoined(listofws, handle)
    msg = Dict{String, Any}()
    msg["responsetype"] = "player-joined"
    msg["user"] = handle
    msg["server-time"] = Dates.now()    
    return broadcastmsg(listofws, JSON.json(msg),
                        cond = x -> (getHandlefromWS[x] != handle))
end

function playerdisconnected(listofws, handle)
    msg = Dict{String, Any}()
    msg["responsetype"] = "player-disconnected"
    msg["user"] = handle
    msg["server-time"] = Dates.now()
    
    return broadcastmsg(listofws, JSON.json(msg), 
                        cond = x -> (getHandlefromWS[x] != handle))
end

function broadcastmsg(roomname::String, msg)
    if !haskey(RoomDict, roomname)
        #Shouldn't Happen
        @warn("Called broadcastmsg with non-existent $(roomname) with $(msg)")
        return
    end
    return broadcastmsg(RoomDict[roomname], msg)
end

function broadcastmsg(listofws::Set{WebSocket}, msg; 
                      cond = x -> true) 
    for ws in listofws
        if cond(ws)
            writeguarded(ws, msg)
        end
    end
    nothing
end

function errormsg(ws, errortype)
    writeguarded(ws, "{ \"responsetype\" : \"$(errortype)-error\" }")
    nothing
end

function changestatespec(currws)
    !inRoom(currws) && return
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]

    if !haskey(SpecDict, roomname)
        SpecDict[roomname] = Set{String}()
    end
    push!(SpecDict[roomname], handle)
    
    msg = Dict{String, Any}
    msg["responsetype"] = "change-status-spectate"
    msg["handle"] = handle
    broadcastmsg(roomname, JSON.json(msg))

    nothing
end

function changestateplay(currws)
    !inRoom(currws) && return
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]

    if haskey(SpecDict, roomname) && haskey(SpecDict[roomname], handle)
        pop!(SpecDict[roomname], handle)
        
        msg = Dict{String, Any}
        msg["responsetype"] = "change-status-play"
        msg["handle"] = handle
        broadcastmsg(roomname, JSON.json(msg))
    end

    nothing
end

function getSpectators(roomname)
    (!haskey(SpecDict, roomname)) && return []
    return collect(SpecDict[roomname])
end

function getUsers(roomname)
    return [ getHandlefromWS[i] for i in RoomDict[roomname] ]
end

function getPlayers(roomname)
    (!haskey(SpecDict, roomname)) && return getUsers(roomname)
    return filter(x -> !(x in SpecDict), getUsers(roomname))
end

global SERVER = WebSockets.ServerWS(HTMLHandler, WSGatekeeper)
@async WebSockets.serve(SERVER, LOCALIP, HTTPPORT)
println("HTTP Server listening on $LOCALIP:$HTTPPORT.")
