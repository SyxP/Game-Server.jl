abstract type Game end

const RoomGames = Dict{String, Game}()

# Returns list of users in game g
# To be implemented by all Game subtypes
function inGameUsers(g::Game)
    @warn("Unimplemented inGameUsers method of $(typeof(g)) : $g")
    return []
end

# Clean-up Game References
function removeGameRef(roomname)
    if haskey(RoomGames, roomname)
        delete!(RoomGames, roomname)
    end

    if haskey(Disconnected, roomname)
        delete!(Disconnected, roomname)
    end

    msg = Dict{String, Any}()
    msg["responsetype"] = "game-stopped"
    return broadcastmsg(roomname, JSON.json(msg))
end

