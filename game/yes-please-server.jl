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

    elseif querytype == "reject-card"
    
    end
    return
end

function startnewYP(currws)
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]
    
    if haskey(RoomGames, roomname)
        #Ongoing Game
        return errormsg(currws, "game-ongoing")
    end
    
    playerlist = getPlayers(roomname)
    if length(playerlist) <= 2
        return errormsg(currws, "insufficient-players")
    elseif length(playerlist) > 5
        # Too many players
        # No error for now
    elseif !(handle in playerlist)
        return errormsg(currws, "not-in-game-start")
    end

    RoomGames[roomname] = g = initialiseYP(playerlist)

    msg = Dict{String, Any}()
    msg["responsetype"] = "game-started"
    msg["game-status"] = gameState(g)
    return broadcastmsg(roomname, JSON.json(msg))
end

# Clean-up Game References
function removeGameRef(roomname)
    if haskey(RoomGames, roomname)
        delete!(RoomGames, roomname)
    end
end

# Overloaded required method
inGameUsers(g::YesPleaseGame) = g.UserList

function stopYP(currws)
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]
    
    # If no games are running, end
    (!haskey(RoomGames, roomname)) && return

    if !(handle in inGameUsers(RoomGames[roomname]))
        # Stopping Player not currently playing
        return errormsg(currws, "not-in-game")
    end

    removeGameRef(roomname)
    msg = Dict{String, Any}()
    msg["responsetype"] = "game-stopped"
    return broadcastmsg(roomname, JSON.json(msg))
end
