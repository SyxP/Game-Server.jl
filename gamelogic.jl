struct YesPleaseGame

	# List of Player Usernames in Order of Play
	UserList::Array{String}

	# List of Cards Remaining on Deck
	Deck::Array{Int}

	# TakenCards[i] is the Set of cards taken by Player i
	# TokenCount[i] is the Remaining Number of Tokens of Player i
	TakenCards::Array{Set{Int}}
	TokenCount::Array{Int}

	# Current Player
	CurrPlayer::Int
	
	# Number of Tokens 
	CurrToken::Int
end

numPlayers(Game::YesPleaseGame) = length(UserList)

function newGame(Array{String})
	PlayerOrder = 
end	
