abstract type Game end

# Returns list of users in game g
# To be implemented by all Game subtypes
function inGameUsers(g::Game)
    @warn("Unimplemented inGameUsers method of $(typeof(g)) : $g")
    return []
end
