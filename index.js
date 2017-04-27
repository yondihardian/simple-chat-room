var express = require('express');
var fs = require('fs');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3000;
var user = [];
var rooms = [];


function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }
    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
    return response;
}


app.use(express.static('public'));
app.get('/', function(req, res){
	res.sendFile(__dirname + '/html/index.html');
});

http.listen(port, function(){
  console.log('Chat Service has started on port : ' + port);
});

io.on('connection', function(socket){

	socket.on('userJoin', function (data,callback) {
        
        var imgBase64 = data.img;
        var imageBuffer = decodeBase64Image(imgBase64);
        fs.writeFile('public/avatar/'+ socket.id +'.jpg', imageBuffer.data, function(err) {});

        var dataUser = user.filter(function (item) {
            return item.roomName == data.roomName;
        });
       
        callback(dataUser);
        
        var userData = {
            id : data.id,
            name : data.name,
            roomName : data.roomName,
            time : data.time
        }

        user.push(userData);
        
        socket.join(data.roomName);
        io.to(data.roomName).emit('onUserJoin', userData);
	});

  socket.on('sendMessage', function (data) {
        io.to(data.user.roomName).emit('onReceiveMessage', data);
	});

  socket.on('onWriting', function (data) {
        socket.to(data.roomName).emit('onWriting', socket.id);
    });

  socket.on('onStopWriting', function (data) {
        socket.to(data.roomName).emit('onStopWriting', socket.id);
	});
	
  socket.on('disconnect', function () {
        var getUserLeft = user.filter(function (item) {
            return item.id == socket.id;
        });
        if(getUserLeft.length > 0){
            var indexOfUserLeft = user.indexOf(getUserLeft[0]);
            if(indexOfUserLeft > -1)
            {
                user.splice(indexOfUserLeft, 1);
            }
            getUserLeft[0].time = new Date();
            io.emit('onUserLeft', getUserLeft[0]);
        }
  });

});