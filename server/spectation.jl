const SpecDict = Dict{String, Set{String}}()

function changestatespec(currws)
    !inRoom(currws) && return
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]
    
    if !haskey(SpecDict, roomname)
        SpecDict[roomname] = Set{String}()
    end
    
    push!(SpecDict[roomname], handle)

    msg = Dict{String, Any}()
    msg["responsetype"] = "room-change-status-spectate"
    msg["handle"] = handle
    broadcastmsg(roomname, JSON.json(msg))

    nothing
end

function changestateplay(currws)
    !inRoom(currws) && return
    roomname = getRoomfromWS[currws]
    handle = getHandlefromWS[currws]

    if haskey(SpecDict, roomname) && (handle in SpecDict[roomname])
        pop!(SpecDict[roomname], handle)

        msg = Dict{String, Any}()
        msg["responsetype"] = "room-change-status-play"
        msg["handle"] = handle
        broadcastmsg(roomname, JSON.json(msg))
    end

    nothing
end
