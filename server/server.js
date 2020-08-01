var WebSocketServer = new require('ws');

// подключённые клиенты
var connections = {};
var managers = [];
var clients = [];

// WebSocket-сервер на порту 8081
var webSocketServer = new WebSocketServer.Server({
  port: 8081
});

webSocketServer.on('connection', function(ws) {

  var id = Math.random();
  connections[id] = ws;
  console.log("новое соединение: " + id);

	ws.on('message', function(message) {
		if (message.slice(0,6) == "manage") {
			var man = new manager(id, message.slice(9,45), "free");
			console.log("произошло подключение менеджера " + man.peerid);
			managers.push(man);
		}
		else if (message.slice(0,6) == "client") {
			//проверяем наличие свободных менеджеров
			let freemanagers = [];
			
			for (var i = 0; i < managers.length; i++) {
				if (typeof managers[i] !== 'undefined' && managers[i].clientid == "free") freemanagers.push(managers[i].peerid);
			}
			
			if (freemanagers.length) {
				var cli = new client(id, message.slice(8,44), freemanagers[0]);
				console.log("произошло подключение клиента " + cli.peerid + " и есть доступный менеджер");
				clients.push(cli);
				
				for (var i = 0; i < managers.length; i++) {
					if (typeof managers[i] !== 'undefined' && managers[i].peerid == freemanagers[0]) managers[i].clietntid = cli.peerid;
				}
				
				connections[id].send(cli.managerid);
			}
			else {
				var cli = new client(id, message.slice(8,44), "");
				console.log("произошло подключение клиента " + cli.peerid + " и нет доступных менеджеров");
				clients.push(cli);
				//Отправить сообщение, что нет доступных менеджеров
			}
		} 
		else {
			console.log('Не удалось распознать сообщение ' + message);
		}
	});

  ws.on('close', function() {
    console.log('соединение закрыто ' + id);
    delete connections[id];
	for (var i = 0; i < managers.length; i++) {
		if (typeof managers[i] !== 'undefined' && managers[i].id == id) {
			console.log("Произошло отключение менеджера " + managers[i].peerid);
			delete managers[i];
		}
	}
	for (var i = 0; i < clients.length; i++) {
		if (typeof clients[i] !== 'undefined' && clients[i].id == id) {
			console.log("Произошло отключение клиента " + clients[i].peerid);
			delete clients[i];
		}
	}
  });
  
  function manager(id, peerid, clientid) {
	this.id = id;
	this.peerid = peerid;
	this.clientid = clientid;
  }
  
  function client(id, peerid, managerid) {
	this.id = id;
	this.peerid = peerid;
	this.managerid = managerid;
  }

});
