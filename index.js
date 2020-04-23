//Author: Brandon Sin 30012020
//reference from, used as win condition //https://stackoverflow.com/questions/32770321/connect-4-check-for-a-win-algorithm
//Known Issue: 
//*******If name is a duplicate, it may bug out userlist and room connection
//*******Server may not be able to hand multiple interactions at once, try to restart server if client is not responding             
//Version 1.1 
//Date: 2020-04-20

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');

var port = process.env.PORT || 8080;


//All connected users
var userList = [];

//number of rooms Available
var room1 = [];
var room2 = [];
var room3 = [];
var room4 = [];
var room5 = [];
var room6 = [];
var room7 = [];
var room8 = [];
var room9 = [];
var room10 = [];

var room1Turn = 0;
var room2Turn = 0;
var room3Turn = 0;
var room4Turn = 0;
var room5Turn = 0;
var room6Turn = 0;
var room7Turn = 0;
var room8Turn = 0;
var room9Turn = 0;
var room10Turn = 0;

let turnMap = new Map();
let gameMap = new Map();
let myMap = new Map();

//Map for room ID
//Better way of programming this would to be everything
//into a master directionary
myMap.set("a", room1);
myMap.set("b", room2);
myMap.set("c", room3);
myMap.set("d", room4);
myMap.set("e", room5);
myMap.set("f", room6);
myMap.set("g", room7);
myMap.set("h", room8);
myMap.set("i", room9);
myMap.set("j", room10);

//player turns Map for each game Room
turnMap.set("a", room1Turn);
turnMap.set("b", room2Turn);
turnMap.set("c", room3Turn);
turnMap.set("d", room4Turn);
turnMap.set("e", room5Turn);
turnMap.set("f", room6Turn);
turnMap.set("g", room7Turn);
turnMap.set("h", room8Turn);
turnMap.set("i", room9Turn);
turnMap.set("j", room10Turn);

//Map that contains coordinates of the game board for each room
gameMap.set("a", createBoard());
gameMap.set("b", createBoard());
gameMap.set("c", createBoard());
gameMap.set("d", createBoard());
gameMap.set("e", createBoard());
gameMap.set("f", createBoard());
gameMap.set("g", createBoard());
gameMap.set("h", createBoard());
gameMap.set("i", createBoard());
gameMap.set("j", createBoard());

//create board game
function createBoard(){
    var grid = [];
    for(var row=0; row<6; row++){
        grid[row]= [];
        for(var col=0; col<7; col++){
            grid[row][col] = -1;
        }   
    }
    return grid;
}
//removes username off userlist
function removeName(username){
    const index = userList.indexOf(username);
    if(index > -1){
        userList.splice(index, 1);
    }
    else{
        console.log("user is not found: " + username);
    }
    return userList
}

app.use(cors());
app.use(express.static('views'));
app.get('/', function(req, res) {
    res.redirect('/index.ejs');
});
 
//Connection 
io.sockets.on('connection', function(socket){
    
    let username = "";
    console.log("user entered site" + username);
    
//change username
socket.on('name_change', function(newUsername, oldUsername){

    username = newUsername
    userList.push(username);
    userList = removeName(oldUsername);
    socket.emit('the_user', username);
    io.emit("uList", userList);    
})

//emitting username
socket.emit('user', username);

//retrieving auto-generated name from client and pushing it to userlist
//emitting userList to all sockets
socket.on('theUsername', function(saveUsername){
    username = saveUsername;
    userList.push(username);
    io.emit("uList", userList);
})

//Retrieving username when client wants to join a random game
//connects user to room and emitting roomList to specified room
socket.on('joinRandom', function(username){
    for(const [key,value] of myMap){
        if(value.length < 2){
            var ID = key;
            socket.emit("creatableRoom");
            socket.emit('key', ID);
            socket.join(key);
            value.push(username);
            io.in(ID).emit("roomList", myMap.get(ID));
            break;
        }
    }

})

//create room and presents player with ID
socket.on('createRoom', function(username){
    console.log(username);
    for(const [key,value] of myMap){
        
        //Check if room is available
        if(value.length < 1){
            var ID = key;
            socket.emit("creatableRoom");
            socket.emit('key', ID);
            socket.join(key);
            value.push(username);
            io.in(ID).emit("roomList", myMap.get(ID));
            break;
        }
        if(myMap.get("j").length == 2 || value.lenght == 1){
            socket.emit('generalError', "no more rooms left");
        }

    }
    console.log(myMap);    
})


//join game
//if key of all rooms do not exist that alert user that room does not exist
//if room is full alert user that room is full
//otherwise room is available and connect user to room
socket.on('joinGame', function(ID){
    if(myMap.get(ID) == undefined){
        socket.emit("alerts", "room does not exist");
        console.log("Room ID:" + ID + " does not exist");
    }
    else if(myMap.get(ID).length >= 2){
        socket.emit("generalError", "room is full");

    }
    else{
        socket.join(ID);
        myMap.get(ID).push(username);
        console.log(myMap);
        console.log("Room ID: " + ID + " has players:" + myMap.get(ID));
        console.log("player1 is: " + myMap.get(ID)[0]);
        io.in(ID).emit("roomList", myMap.get(ID));
        var playerColor = "red";
        socket.emit("enterGame", playerColor, ID);
        console.log("player has joined room: " + ID);
    }
})

//user disconmects
//resend list to all users
socket.on("disconnect", () => {
    console.log("Disconnected Player: " + username);
    userList = removeName(username);
    io.emit("uList", userList);
    //Find ID from disconnected Player
    for(const [key, value] of myMap){
        for(var i = 0; value.length; i++){
            if(value[i] == username){
                var position = i;
                var playerID = key;
                break;
            }
       
        }
    }
//if player's ID is undefined and Room is full then remove playerID from room
    try{
        if(playerID != "undefined" && myMap.get(playerID).length == 2){
            myMap.get(playerID).splice(position,1);
            console.log(myMap);   
        }
    }
    catch(err){
    }
     
})

//Retrieve notification from client that the game is ready
//send all users in the room of playerturn and recognize player's turn
socket.on("playerStart", function(ID){
    console.log("key " + ID);
    var roomTurn = turnMap.get(ID);
    var roomPlayers = myMap.get(ID);
    console.log(ID + " " + roomTurn);
    var currentPlayer = roomPlayers[roomTurn];
    console.log("Current Player " + currentPlayer);
    io.in(ID).emit("playerTurn", currentPlayer);

})

//Retrieve data from client that a player has ended their move

socket.on("playerEnd", function(userAction){
    var ID = userAction.key;
    var col = userAction.col;
    var username = userAction.username;
    var roomTurn = turnMap.get(ID);
    
    //updates Game board and send to client
    console.log(turnMap);
    var gridCoord = gameMap.get(ID);
    var row = 5;
    while (row > -1){
        if (gridCoord[row][col] !== -1){
            row -= 1;
        }
        else{       
            gridCoord[row][col] = roomTurn;
            break;
        }
    }
    if (row < 0) {
        console.log("general Error");
        socket.emit("generalError", "invalid move by player");
        return;
    } 
    //RoomTurn+1 % 2 will always return 0 or 1 thus 
    //we know whose turn it is by toggling
    var nextRoomTurn = (roomTurn+1) % 2;
    turnMap.set(ID,nextRoomTurn); 

    //send to client of the newly updated gameboard
    console.log("sending to gameboardupdate in client")
    io.in(ID).emit("gameBoardUpdate", {row:row, roomTurn: roomTurn, username: username, col: col});

    //Calls winner function to check if player has won
    if(winner(roomTurn, gridCoord)){
        console.log(username + " player won");
        io.in(ID).emit("winner", username);
        return;
    }
    //calls draw function to check if it's a draw
    if(draw(gridCoord)){
        io.in(ID).emit("draw");
        return;
    }   
})

})

//returns the amount of rows
function getRows(){

    return 6;
}
//returns the amount of Columns
function getCols(){

    return 7;
}
//check if game is draw
function draw(board){
    for(var i = 0; i < getRows(); i++){
        for(var j = 0; j < getCols(); j++){
            if(board[i][j] == -1){
                return false;
            }
        }
    }
    return true;
}




//Win condition Check
function winner(player, board){
    console.log(board[0][0]);
    // horizontalCheck 
    for (var i = 0; i<getRows() ; i++ ){
        for (var j = 0; j<getCols()-3; j++){
        
            if (board[i][j] ==  player && board[i][j+1] == player && board[i][j+2] == player && board[i][j+3] == player){
                console.log("hori");
                return true;
            }           
        }
    }
    // verticalCheck
    for (var i = 0; i<getRows()-3 ; i++ ){
        for (var j = 0; j<getCols(); j++){
            if (board[i][j] == player && board[i+1][j] == player && board[i+2][j] == player && board[i+3][j] == player){
                console.log("vert");
                return true;
            }           
        }
    }
    // ascendingDiagonalCheck 
    for (var i=3; i<getRows(); i++){
        for (var j=0; j<getCols()-3; j++){
            if (board[i][j] == player && board[i-1][j+1] == player && board[i-2][j+2] == player && board[i-3][j+3] == player){
            console.log("ascDiag");
                return true;
            }
        }
    }
    // descendingDiagonalCheck
    for (var i=3; i<getRows(); i++){
        for (var j=3; j<getCols(); j++){
            if (board[i][j] == player && board[i-1][j-1] == player && board[i-2][j-2] == player && board[i-3][j-3] == player){
            console.log("DesDiag");
                return true;
            }
        }
    }
    return false;
}






app.listen(port, function(){
    console.log("Listening on port " + port);
    );


