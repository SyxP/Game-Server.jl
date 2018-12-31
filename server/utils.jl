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

validName(handle) = !(strip(handle) == "")

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
