$(document).ready(function(){
    //trigger the connection event in our server!
    const socket  = io.connect();

    //add new user to the user list
    function addUser(user){
        $(".users ul").append(`<li>${user.name}</li>`)
    }
    
    //add new chat to chat board
    function addChat(chatData){
        //breakdown data object
        const {chat, user, date} = chatData;
        const sent = new Date(date).toLocaleString();
        //define class for chat - used for formatting user vs other chats
        let msgClass = "chat";
        if (user.id == socket.id){
            msgClass = "chat my-chat"
        }
        const newChatMsg = `
        <div class="${msgClass}">
        <p>${user.name}<span class="spacer">-</span>${sent}</p>
        <p>${chat}</p>
        </div>
        `
        //add chat to chat board
        $(".chats").append(newChatMsg);
        //auto-scroll to bottom of chats
        var objDiv = $(".chats");
        var h = objDiv.get(0).scrollHeight;
        objDiv.animate({scrollTop: h});
    }

    //prompt for user name on page entry
    let newUser = prompt("Welcome. Ready to get your chat on?\n\nEnter your name.");
    if (!newUser){ //user cancelled prompt
        console.log('maybe next time')
    } else { //show the page, pass name to the server
        $('.container-fluid').show();
        $('#username').text(newUser);
        $("#chat").focus();
        socket.emit('newUserEntered', newUser)
    }

    //when a new user enters, (1) display arrival announcement to all users already in chatroom & update their user list, (2) display user list for new user
    socket.on('newUserEntered', function(user){
        const announcement = `${user.name} just entered the Chatterbox.`
        $('h3').text(announcement);
        addUser(user);
    });
    socket.on('usersJoined', function(data){
        //breakdown data object
        const {users, id} = data;
        //loop through & display the users
        users.filter(user => user.id !== id)
        .forEach(user => addUser(user));
    })

    //user chatting
    $('form').submit(function(event){
        event.preventDefault();
        //pass the chat message to server 
        socket.emit("newChat", {chat: $("#chat").val(), sent: new Date(), id: socket.id});
        //clear the chat field
        $("#chat").val('').focus();
    });

    //display the chat for all users
    socket.on('newChat', function(chatData){
        addChat(chatData);
    });

    //when a user leaves, (1) display departure announcement to all users already in chatroom & update their user list,
    socket.on('userDisconnected', function(data){
        //breakdown data object
        const {left, remain} = data;
        //display departure annoucement
        const announcement = `${left.name} has left the Chatterbox.`
        $('h3').text(announcement);
        //clear out user list
        $("li").empty();
        //loop through & display the users
        remain.filter(user => user.id !== socket.id)
        .forEach(user => addUser(user))
    });
});