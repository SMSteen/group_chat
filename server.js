//Load the express module
const express = require("express");
//Load path module
const path = require('path');

//Create a port for our server
const port = process.env.PORT || 8000;
//Invoke express and store resulting app
const app = express();

//Tell our app to use the "/static" folder to deliver static contents
app.use(express.static(path.join(__dirname, "./static")));

//Set the location for app to find ejs views
app.set('views', path.join(__dirname, './views'));
//Set the view engine so it knows we're using ejs as templating system
app.set('view engine', 'ejs');

const users = []; //placeholder for all users
const chats = []; //placeholder for all chats
class User{
    constructor(name, id){
        this.name = name;
        this.id = id;
    }
}
class Chat{
    constructor(chat, user, date){
        this.chat = chat;
        this.user = user;
        this.date = date;
    }
}
// Root route to render the index.ejs view.
app.get('/', function(request, response) {
    response.render("index");
})
// create a variable for the server object
const server = app.listen(port, function(){
    console.log(`listening on port ${port}`);
});
// pass the server into the socket listen method
const io = require('socket.io').listen(server);
// set up server socket code
io.sockets.on('connect', function (socket) {
    // all server socket code goes in here
    console.log("Client/socket is now connected!");
    console.log("Client/socket id is: ", socket.id);

    socket.on( "newUserEntered", function (newUser){
        //create the new user
        const user = new User (newUser, socket.id)
        //add them to users list
        users.push(user);
        //broadcast a notice to all other users acknowledging new user arrival
        socket.broadcast.emit('newUserEntered', user);
        //advise new user of all other users already in chatroom
        socket.emit('usersJoined', {users, id: socket.id});
    });

    socket.on("newChat", function(chatData){
        //breakdown data object
        const {chat, id, sent} = chatData;
        //find the user in users list
        const user = users.find(user => user.id === id);
        //create the new chat
        const newChat = new Chat(chat, user, sent);
        console.log(newChat)
        //add the new chat to chats lit
        chats.push(newChat);
        //broadcast the new chat to all users
        io.emit('newChat', newChat);
    })
    socket.on("disconnect", function(){
        console.log(socket.id, "has left the building")
        //get index of disconnected user
        const user = users.findIndex(user => user.id === socket.id);
        //save user to broadcast back
        const leftRoom = users[user];
        //remove user from users list
        users.splice(user, 1);
        //broadcast a notice to all users acknowledging user departure and update users list
        io.emit('userDisconnected', {left:leftRoom, remain:users})
    })
})