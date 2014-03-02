var http = require('http');
var fs = require('fs');
var file = fs.readFileSync('client.html');

var server = http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(file);
  res.end();
}).listen(1337);
console.log('Server running at http://127.0.0.1:1337/');

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});

/**
 *  * Global variables
 *   */
// latest 100 messages
 var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

/**
 *  * Helper function for escaping input strings
 *   */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

wsServer.on('request', function(request){
    // Code here to run on connection
    console.log("Connection Request received");
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');

    var index = clients.push(connection) - 1;
    var userName = false;

    // send back chat history
    if (history.length > 0) {
    	connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }
 
    connection.on('message', function(message) {
	if (message.type === 'utf8') {
		if(userName === false) {
			userName = htmlEntities(message.utf8Data);
			console.log((new Date()) + ' User is known as: ' + userName);
			connection.sendUTF(JSON.stringify({ type:'user', data: userName }));
		}
		else {
			console.log((new Date()) + ' Received Message from '
                            + userName + ': ' + message.utf8Data);
			// we want to keep history of all sent messages
			var obj = {
			    time: (new Date()).getTime(),
			    text: htmlEntities(message.utf8Data),
			    author: userName,
			};
			history.push(obj);
			history.slice(-100);

			// broadcast message to all connected clients
			var json = JSON.stringify({ type:'message', data: obj });
			for (var i=0; i < clients.length; i++) {
                    		clients[i].sendUTF(json);
                	}
		}
	}
    });
    
    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false) {
            console.log((new Date()) + " Peer "
                + userName + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
        }
    });

});
