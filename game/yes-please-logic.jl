mutable struct YesPleaseGame <: Game

    # List of Players in Turn Order. UserList[1] is first player
    UserList::Vector{String}

    # Deck Remaining
    Deck::Vector{Int}

    # Cards Player i have taken 
    CardsTaken::Vector{Vector{Int}}
    # Tokens Player i have remaining
    TokensLeft::Vector{Int}

    # Num Tokens on Top Card
    TokenOnCard::Int

    # CurrentPlayer
    CurrPlayer::Int
end

numPlayers(game::YesPleaseGame) = length(game.UserList)
cardsLeft(game::YesPleaseGame) = length(game.Deck) - 1 # Doesn't include top card
topCard(game::YesPleaseGame) = game.Deck[end]
getCurrHandle(game::YesPleaseGame) = game.UserList[game.CurrPlayer]
getCurrTokens(game::YesPleaseGame) = game.TokensLeft[game.CurrPlayer]
gameEnded(game::YesPleaseGame) = (length(game.Deck) == 0)

function generateDeck(BaseDeck, Len)
    TempCards = deepcopy(BaseDeck)
    Random.shuffle!(TempCards)

    while length(TempCards) > 24
        pop!(TempCards)
    end
    TempCards
end

function initialiseYP(PlayingUsers::Vector{String};
                      BaseDeck = Vector(3:35), Len = 24)
    TempList = deepcopy(PlayingUsers)
    Random.shuffle!(TempList)

    N = length(TempList)

    YesPleaseGame(TempList,
                  generateDeck(BaseDeck, Len),
                  [Vector{Int}() for i in 1:N],
                  [10 for i in 1:N],
                  0,
                  1)
end

function moveNextPlayer(game::YesPleaseGame)
    game.CurrPlayer += 1
    if game.CurrPlayer > numPlayers(game)
        game.CurrPlayer -= numPlayers(game)
    end
    nothing
end

function addCardtoPlayer(game::YesPleaseGame)
    push!(game.CardsTaken[game.CurrPlayer], topCard(game))
    sort!(game.CardsTaken[game.CurrPlayer])
    pop!(game.Deck)
    nothing
end

# Returns a String depicting the status
function rejectCard(game::YesPleaseGame, handle::String)
    gameEnded(game)                 && return "game-ended"
    (handle != getCurrHandle(game)) && return "wrong-player"
    (0      >= getCurrTokens(game)) && return "insufficient-tokens"

    game.TokenOnCard += 1
    game.TokensLeft[game.CurrPlayer] -= 1
    moveNextPlayer(game)

    return "success"
end

function acceptCard(game::YesPleaseGame, handle::String)
    gameEnded(game)                 && return "game-ended"
    (handle != getCurrHandle(game)) && return "wrong-player"

    game.TokensLeft[game.CurrPlayer] += game.TokenOnCard
    game.TokenOnCard = 0

    addCardtoPlayer(game)
    return "success"
end

function getPoints(game::YesPleaseGame, idx::Int)
    A = game.CardsTaken[idx]
    score = 0
    if !isempty(A)
        score += A[1]
    end
    score += sum([ (A[i] == A[i-1] + 1) ? 0 : A[i] for i in 2:length(A) ])
    score -= game.TokensLeft[idx]
    score
end

function gameState(game::YesPleaseGame)
    msg = Dict{String, Any}()
    msg["player-list"] = game.UserList
    msg["num-cards-left"] = cardsLeft(game)
    msg["top-card"] = topCard(game)
    msg["token-on-card"] = game.TokenOnCard
    msg["tokens-left"] = game.TokensLeft
    msg["curr-player"] = game.CurrPlayer
    msg["cards-taken"] = game.CardsTaken
    msg["current-points"] = [getPoints(game,i) for i in 1:numPlayers(game)]

    msg
end
