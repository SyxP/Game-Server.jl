const Disconnected = Dict{String, Set{String}}()

function dcplayerjoined(handle, roomname)
    # No current game
    !haskey(RoomGames, roomname) && return
    # Current game, but no disconnected players
    !haskey(Disconnected, roomname) && return

    if handle in Disconnected[roomname]
        pop!(Disconnected[roomname], handle)
    end
    return
end

function dcplayerleft(handle, roomname)
    # No current game
    !haskey(RoomGames, roomname) && return
    g = RoomGames[roomname]

    # Left user not currently playing
    !(handle in inGameUsers(g)) && return

    if !haskey(Disconnected, roomname) 
        Disconnected[roomname] = Set{String}()
    end

    push!(Disconnected[roomname], handle)
    
    checkEmptyWall(roomname)
    return
end

# Checks whether all players in game disconnected
function checkEmptyWall(roomname)
    # No current game
    !haskey(RoomGames, roomname) && return
    g = RoomGames[roomname]
    # No disconnected users
    !haskey(Disconnected, roomname) && return
    
    if length(Disconnected[roomname]) == length(inGameUsers(g))
        # All users have disconnected
        removeGameRef(roomname)
    end

    return
end
