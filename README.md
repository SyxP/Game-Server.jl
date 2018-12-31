# Game-Server.jl



Creates a web server hosting lobbies for multiplayer games via WebSockets.
The code is structured as follows:

* `web` contains the HTML and Javascript interfaces handling the client-side logic;
* `server` contains the lobby code and handles (dis)connections;
* `game` contains the game logic. This is further split into `logic` files which are purely regarding the game logic, and `server` files which interfaces with the server.
