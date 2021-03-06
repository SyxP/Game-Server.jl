const YPCommandsList = ["start-game",
                        "stop-game",
                        "accept-card",
                        "reject-card"]

function YPServer(msg, currws)
    !inRoom(currws) && return
    querytype = msg["querytype"]
    
    if querytype == "start-game"
        startnewYP(currws)
    elseif querytype == "stop-game"
        stopYP(currws)
    elseif querytype == "accept-card"
        acceptCard(currws)
    elseif querytype == "reject-card"
        rejectCard(currws)
    end
    return
end

function startnewYP(currws)
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]
    
    if haskey(RoomGames, roomname)
        #Ongoing Game
        return errormsg(currws, "room-game-ongoing")
    end
        
    playerlist = getPlayers(roomname)
    
    if length(playerlist) <= 2
        return errormsg(currws, "room-insufficient-players")
    elseif length(playerlist) > 5
        # Too many players
        # No error for now
    elseif !(handle in playerlist)
        return errormsg(currws, "room-not-in-game-start")
    end

    RoomGames[roomname] = g = initialiseYP(playerlist)

    msg = Dict{String, Any}()
    msg["responsetype"] = "game-game-started"
    msg["game-status"] = gameState(g)
    return broadcastmsg(roomname, JSON.json(msg))
end

# Overloaded required method
inGameUsers(g::YesPleaseGame) = g.UserList

function stopYP(currws)
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]
    
    # If no games are running, end
    (!haskey(RoomGames, roomname)) && return
    # Stopping Player not currently playing
    !(handle in inGameUsers(RoomGames[roomname])) && return errormsg(currws, "room-not-in-game")

    removeGameRef(roomname)
    return
end

function acceptCard(currws::WebSocket)
    roomname = getRoomfromWS(currws)
    handle = getHandlefromWS(currws)
    g = RoomGames[roomname]
    # Player not currently playing
    !(handle in inGameUsers(g)) && return errormsg(currws, "room-not-in-game")
    
    exitcode = acceptCard(g, handle)
    if exitcode == "game-ended"
        return errormsg(currws, "game-ended")
    elseif exitcode == "wrong-player"
        return errormsg(currws, "game-wrong-player")
    elseif exitcode == "success"
        return broadcastmsg(roomname, "{ \"responsetype\" : \"game-card-accepted\" }")
    end
end

function rejectCard(currws::WebSocket)
    roomname = getRoomfromWS(currws)
    handle = getHandlefromWS(currws)
    g = RoomGames[roomname]
    # Player not currently playing
    !(handle in inGameUsers(g)) && return errormsg(currws, "room-not-in-game")

    exitcode = rejectCard(g, handle)
    if exitcode == "game-ended"
        return errormsg(currws, "game-ended")
    elseif exitcode == "wrong-player"
        return errormsg(currws, "game-wrong-player")
    elseif exitcode == "insufficient-tokens"
        return errormsg(currws, "game-insufficient-tokens")
    elseif exitcode == "success"
        return broadcastmsg(roomname, "{ \"responsetype\" : \"game-card-rejected\" }")
    end
end
