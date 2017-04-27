/* Define global variable */

var socket = io();
var user = {
    id : "",
    name : "",
    roomName : "",
    time : ""
};
var myPic;
var myTimeoutWriting;


/* Define Component HTML */

var messageItemOther = function(prop){
    return (
        '<div class="message-item other-message">'+
        '        <div class="message-item-header">'+
        '            <div class="user">'+ prop.user.name +'</div>'+
        '            <div class="time">'+ formatTime(prop.user.time) +'</div>'+
        '        </div>'+
        '        <div class="message-content">'+
        '            '+ prop.text +' '+
        '        </div>'+
        '</div>'
    );
}

var messageItemMy = function(prop){
    return (
        '<div class="message-item my-message">'+
        '        <div class="message-item-header">'+
        '            <div class="user">me</div>'+
        '            <div class="time">'+ formatTime(prop.user.time) +'</div>'+
        '        </div>'+
        '        <div class="message-content">'+
        '            '+ prop.text +' '+
        '        </div>'+
        '</div>'
    );
}

var messageItemJoinNotif = function(prop){
    return (
        '<div class="message-item join-notif">'+
        '        <div class="message-content">'+
        '            '+ prop.name +' join at ' + formatTime(prop.time) +
        '        </div>'+
        '</div>'
    );
}

var messageItemLeftNotif = function(prop){
    return (
        '<div class="message-item left-notif">'+
        '        <div class="message-content">'+
        '            '+ prop.name +' has left at ' + formatTime(prop.time) +
        '        </div>'+
        '</div>'
    );
}

var userItemList = function(prop){
    return (
        '<div class="user-item-list" id="user-'+ prop.id +'">'+
        '    	<div class="avatar"><img src="avatar/'+ prop.id +'.jpg" width="35" height="35"  /></div>'+
        '        <div class="user-info">'+
        '        	<div class="name">'+ prop.name +'</div>'+
        '           <div class="join-time">Join at '+ formatTime(prop.time) +' <span class="writing-status"></span></div>'+
        '        </div>'+
        '</div>'
    );
}


/* Define DOM Element */

var $login = $(".login-pane");
var $app = $(".app-pane");
var $roomHeaderName = $(".user-pane .header");
var $userContainer = $(".user-pane .container");
var $messageContainer = $(".message-pane .container");
var $textInputMessage = $(".message-pane .footer input");
var $inputRoomName = $("#inputRoomName");
var $inputName = $("#inputName");
var $avatarLogin = $("#avatar-login");
var $chooseFile = $("#chooseFile");


/* User-Define Function */

function formatTime(date){
    date = new Date(date);    
    return date.getHours() + ':' + date.getMinutes();
}

function onConnection(){
   user.id = socket.id;
   console.log("Your socket id : " + user.id);     
}

function userJoin(_user){
    //user join to room
    socket.emit('userJoin', _user, function(data){
        data.map(function(item) { 
             $userContainer.append(
                    userItemList({
                        id : item.id,
                        name : item.name,
                        time : item.time
                    })
                );
        });
    });    
}



function onUserJoin(data){
    $messageContainer.append(messageItemJoinNotif(data));
    if(data.id == user.id){
        data.name = data.name + " (You)";
    }
    $userContainer.append(
        userItemList({
            id : data.id,
            name : data.name,
            time : data.time
        })
    );
}

function onUserLeft(data){
    $messageContainer.append(messageItemLeftNotif(data));
    $("#user-" + data.id).remove();
}


function sendMessage(_user,_text){
    //Send message to room
    var data = {
        user : _user,
        text : _text
    }
    socket.emit('sendMessage', data);
}

function onReceiveMessage(data){
    //Receive message from server
    if(data.user.id == user.id)
    {
        $messageContainer.append(messageItemMy(data));
    }else
    {
        onStopWriting(data.user.id);    
        $messageContainer.append(messageItemOther(data));
    }
    
}

function onWriting(data){
    $("#user-" + data + " .writing-status").text("(writing...)");
}

function onStopWriting(data){
    $("#user-" + data + " .writing-status").text("");
}

function startTimeoutWriting() {
    clearTimeout(myTimeoutWriting);
    myTimeoutWriting = setTimeout(function(){
         socket.emit('onStopWriting', user);
    }, 2000);
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var file = input.files[0];
        var fileType = file["type"];
        var ValidImageTypes = ["image/gif", "image/jpeg", "image/png"];
        if ($.inArray(fileType, ValidImageTypes) < 0) {
            alert("File extension wrong!!");
            $('#avatar-login')
                    .attr('src', "default-avatar.jpg");
        }else{
            var reader = new FileReader();
            reader.onload = function (e) {
                $('#avatar-login').attr('src', e.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        }
        
        
        
    }
}

/* Socket IO Event */

socket.on('connect',onConnection);
socket.on('onUserJoin',onUserJoin);
socket.on('onReceiveMessage',onReceiveMessage);
socket.on('onUserLeft',onUserLeft);
socket.on('onWriting',onWriting);
socket.on('onStopWriting',onStopWriting);

/* Event handler */

$avatarLogin.click(function() {
    chooseFile.click();
});

$textInputMessage.keypress(function( event ) {
    if ( event.which == 13 ) {
        if( $textInputMessage.val() !== "" ){
            clearTimeout(myTimeoutWriting);
            sendMessage(user,$textInputMessage.val());
            $textInputMessage.val(""); 
        }
    }else{
        socket.emit('onWriting', user);
        startTimeoutWriting();
    }
});

$textInputMessage.change(function() {
    console.log("writing");
});

$inputRoomName.keypress(function( event ) {
    if ( event.which == 13 ) {
        $inputName.focus();
    }
});

$inputName.keypress(function( event ) {
    if ( event.which == 13 ) {
        
        
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, 75, 75);
        var img = document.getElementById("avatar-login");
        ctx.drawImage(img, 0, 0, 75, 75);
        myPic = c.toDataURL();

        if($inputName.val() == "" || $inputRoomName.val() == ""){
            alert("All input field required!!");
            return false;
        }
        user.name = $inputName.val();
        user.roomName = $inputRoomName.val().toUpperCase();
        user.time = new Date();
        user.img = myPic;
        userJoin(user);
        $roomHeaderName.text(user.roomName);
        $app.css("display", "flex");
        $login.css("display", "none");
    }
});

$inputRoomName.focus();

//window.onbeforeunload = confirmExit;
function confirmExit() {
    return "";
}


  