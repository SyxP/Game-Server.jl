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

