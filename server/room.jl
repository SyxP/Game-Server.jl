const WSInRoom = Set{WebSocket}()
const RoomPass = Dict{String, String}()
const RoomDict = Dict{String, Set{WebSocket}}()
const Usernames = Dict{String, Set{String}}()
const getRoomfromWS = Dict{WebSocket, String}()
const getHandlefromWS = Dict{WebSocket, String}()

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

        dcplayerleft(handle, roomname)
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
    handle = getHandlefromWS[currws]
    
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

    dcplayerjoined(handle, roomname)
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

