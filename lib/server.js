'use babel';

import { Emitter } from 'event-kit';
import path from "path";
import socket from "socket.io";
import CollabyStatusView from './collaby-status-view';
import { CompositeDisposable } from 'atom';

export default class CollabyServer {

	constructor(options) {
		this.serverData = {
			clients: 0
		};

		this.emitter = new Emitter();
		this.events = new CompositeDisposable();

		// Create status view
    this.collabyStatusView = new CollabyStatusView();

		if(global.collaby.statusBar) {
			global.collaby.statusBar.addRightTile({item: this.collabyStatusView, priority: -1});
			this.collabyStatusView.value.textContent = this.serverData.clients;
		}

		atom.notifications.addSuccess("Started a new collaby server for this project!");
	}

	listen(port) {
		try {
			this.socket = socket.listen(port);
      this.handleEvents();
      atom.notifications.addInfo("Server listens on port " + port + " now!");
      return(this.socket);
		}
    catch(e) {
			atom.notifications.addFatalError("Server cannot listen on port " + port + "!", {detail: e.name + " " + e.message, stack: e.stack, dismissable: true});
		}
	}

	handleEvents() {
		this.socket.on('connection', (clientSocket) => {
			console.log(clientSocket);
		  this.serverData.clients++;
			this.collabyStatusView.value.textContent = this.serverData.clients;
		});
	}

}
