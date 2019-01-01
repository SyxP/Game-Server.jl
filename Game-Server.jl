using  WebSockets
import WebSockets:Response, Request

using JSON
using Sockets
using Dates
using Random

include("game/abstract-game.jl")
include("game/yes-please-logic.jl")
include("game/yes-please-server.jl")

include("server/output.jl")
include("server/spectation.jl")
include("server/room.jl")
include("server/utils.jl")
include("server/disconnection.jl")

const LOCALIP = string(Sockets.getipaddr())
const HTTPPORT = 8080

getFile(str) = read(joinpath(@__DIR__,str), String)

const validSuffix = Dict("/"           => getFile("web/index.html"), 
                         "/index.html" => getFile("web/index.html"), 
                         "/style.css"  => getFile("web/style.css"), 
                         "/comms.js"  => getFile("web/comms.js"), 
                         "/myprompts.js"  => getFile("web/myprompts.js"), 
                         "/login.js"  => getFile("web/login.js"), 
                         "/room.js"  => getFile("web/room.js"))

function HTMLHandler(req::Request)
    if req.method == "GET" && haskey(validSuffix, req.target)
        return validSuffix[req.target] |> Response
    end
    "" |> Response ## 404 - Page Not Found Message
end

function WSGatekeeper(req, ws)
    orig = WebSockets.origin(req)
    # To be replaced with External IP on deployment
    if occursin(LOCALIP, orig)
        # Run Main Coroutine
        coroutine(ws)
    else
        @warn("Unauthorized websocket connection, $orig not approved by gatekeeper, expected $LOCALIP")
    end
    nothing
end

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
        
        ######
        # Change this line to modify the server game
        ######
        elseif msg["querytype"] in YPCommandsList
            YPServer(msg, currws)
        end
    end
    
    # Clean up External References
    removereferences(currws)
    nothing
end

global SERVER = WebSockets.ServerWS(HTMLHandler, WSGatekeeper)
@async WebSockets.serve(SERVER, LOCALIP, HTTPPORT)
println("HTTP Server listening on $LOCALIP:$HTTPPORT.")
