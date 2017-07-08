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
			throw {short: "Server cannot listen on port " + port + "!", detail: e}
		}
	}

	handleEvents() {

	}

}
