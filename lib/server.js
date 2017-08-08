'use babel';

import { Emitter } from 'event-kit';
import path from "path";
import fs from 'fs';
import socket from "socket.io";
import CollabyStatusView from './collaby-status-view';
import { CompositeDisposable } from 'atom';
import Helper from './helpers';


export default class CollabyServer {

	constructor(options) {
		this.serverData = {
			clients: 0
		};

		this.emitter = new Emitter();
		this.subscriptions = new CompositeDisposable();

		// Create status view
    this.collabyStatusView = new CollabyStatusView("icon-radio-tower", "0");

		if(global.collaby.statusBar) {
			this.collabyStatusTile = global.collaby.statusBar.addRightTile({item: this.collabyStatusView, priority: -1});
			this.collabyStatusView.value.textContent = this.serverData.clients;
			this.subscriptions.add(atom.tooltips.add(this.collabyStatusView.element, {title: `${this.serverData.clients} clients on collaby server`}));
		}

		console.log("new server created");
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

	updateStatusBar() {
		this.collabyStatusView.value.textContent = this.serverData.clients;
		this.subscriptions.add(atom.tooltips.add(this.collabyStatusView.element, {title: `${this.serverData.clients} clients on collaby server`}));
	}

	handleEvents() {
		this.socket.on('connection', (clientSocket) => {
			this.emitter.emit("connection", clientSocket);
			console.log("A user connected to server");
			atom.notifications.addInfo("A user connected!");
		  this.serverData.clients++;
			this.updateStatusBar();

			clientSocket.on('change', (data) => {
				clientSocket.broadcast.emit('change', data);
			});

			clientSocket.on('will-save', (data) => {
				clientSocket.broadcast.emit('will-save', data);
			});

			if (this.serverData.clients < 2) {return;}

			clientSocket.on('disconnect', () => {
				atom.notifications.addInfo("A user disconnected!");
			  this.serverData.clients--;
				this.updateStatusBar();
			});

			clientSocket.on('serverFilesObject', () => {
				let serverFilesObject = this.getFilesObject();
				clientSocket.emit("serverFilesObject", serverFilesObject);
			});

			clientSocket.on('diffFiles', (diff) => {
				console.log(diff);
				clientSocket.emit('diffFilesContent', this.getDiffFiles(diff));
			});

		});

	}

	getFilesObject() {

		let files = {};

		for (let projectPath of atom.project.getPaths()) {

			let name = path.basename(projectPath);
			let project = Helper.recSingleScan(name, projectPath);

			files[name] = project;

		}

		return files;
	}

	getDiffFiles(diffs) {

		if (!diffs) return;

		let files = new Array();

		for (let key of Object.keys(diffs)) {
			if (diffs[key].directory == false) {
				files.push({content: fs.readFileSync(diffs[key].path, "utf8"), relPath: diffs[key].relPath})
			} else {
				console.log(diffs[key].path + " is a directory. Scanning");
				Helper.recScanCb(diffs[key].path, ({file, filePath, stat, relPath}) => {
					console.log("got file " + file);
					files.push({content: fs.readFileSync(filePath, "utf8"), relPath: relPath});
				}, diffs[key].relPath);
			}
		}

		// anti crash protection (max files)
		if (files.length > atom.config.get("collaby.maxFiles")) {
			atom.notifications.addFatalError("Could not send files: too many files!", {
				detail: "A user wants to sync too many files (" + files.length + "). There are only " + atom.config.get("collaby.maxFiles") + " allowed. Sending only the first " + atom.config.get("collaby.maxFiles") + " now"
			});
			files = files.slice(0, atom.config.get("collaby.maxFiles"));
		}

		return files;

	}

	close() {
		try {
			this.socket.close(() => {
				if (this.collabyStatusTile) this.collabyStatusTile.destroy();
				this.subscriptions.dispose();
				atom.notifications.addSuccess('Collaby server successfully closed.');
			});
		} catch (e) {
			console.error(e);
		}

	}

	onConnection(cb) {
		return this.emitter.on('connection', cb);
	}

}
