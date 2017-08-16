'use babel';

import { Emitter } from 'event-kit';
import { CompositeDisposable } from 'atom';
import path from 'path';
import fs from 'fs';
import io_cl from 'socket.io-client';
import CollabyTracker from './collaby-tracker';
import CollabyStatusView from './collaby-status-view';
import CollabyLoadView from './collaby-load-view';
import CollabyView from './collaby-view';
import Helper from './helpers';

export default class CollabyClient {

	constructor(ip, connectCb, options) {
		this.emitter = new Emitter();
		this.subscriptions = new CompositeDisposable();
		this.trackerSubs = new CompositeDisposable();
		this.workingDir = null;
		this.connectCb = connectCb;
		this.tooltipItem = document.createElement('div');


		this.default = {
			serverClient: false
		};

		this.options = Object.assign(this.default, options);

		console.log("constructing new client with options", this.options);

		this.connect(ip, () => {
			this.connectCb();
			this.startTracking();

			if (this.options && !this.options.serverClient) {
				// Create status view
				this.tooltipItem.textContent = "Collaby sync status: Not synced";
		    this.collabyStatusView = new CollabyStatusView("icon-stop", "Not synced");
				this.subscriptions.add(atom.tooltips.add(this.collabyStatusView.element, {item: this.tooltipItem}));

				if (global.collaby.statusBar) {
					global.collaby.statusBar.addRightTile({item: this.collabyStatusView, priority: -1});
				}

				// Handle syncing
	      this.sync();

			}

			// Handle changing
			this.socket.on('change', (data) => {
				this.change(data);
			});

			// Handle saving
			this.socket.on('will-save', (data) => {
				this.save(data);
			});

		});

	}

	connect(ip, cb) {
		console.log('connecting to http://' + ip);

		this.socket = io_cl('http://' + ip);

		this.socket.on('connect', () => {
			console.log("connected! ID:" + this.socket.id);
			cb();
		});

	}

	showDirView(cb) {

		let dirView = new CollabyView({header: "Enter working directory", placeholder: "Path", closable: false}, (workingDir) => {
			this.workingDir = workingDir;
			if (cb) cb();
		});
		dirView.show();

	}

	sync() {

		// Show Sync View
		this.syncView = new CollabyLoadView();
		this.syncView.show("Syncing");
		this.syncPanel = atom.workspace.addModalPanel({item: this.syncView});

		this.socket.emit('serverFilesObject');

		this.socket.once('serverFilesObject', (serverFiles) => {
			this.serverFiles = Helper.normalizeSeperators(serverFiles);

			let scanWorkingDir = () => {
				// Remove all project folders from atom editor
		    for (projectPath of atom.project.getPaths()) {
					atom.project.removePath(projectPath);
				}

				// Read out client files
		    this.clientFiles = Helper.recScan(this.workingDir);

				this.socket.emit('diffFiles', Helper.deepDiff(this.serverFiles, this.clientFiles));
			};

			if (!this.workingDir) this.showDirView(scanWorkingDir)
			else scanWorkingDir();

		});

		this.socket.once('diffFilesContent', (diffFiles) => {

			if (!diffFiles) return;

			let success = true;

			console.log("diffFiles:", diffFiles);

			for (file of diffFiles) {
				if (!file) continue;
				try {
					if (file.relPath === "undefined") throw new Error("path is undefined!");

					let filePath = this.workingDir + file.relPath;

					// create all parent directories if they do not exist yet
					Helper.mkDirRec(path.dirname(filePath));

					// write the file
					fs.writeFile(filePath, file.content, 'utf-8', () => {
						// after file write
					});


				} catch (e) {
					success = false;
					atom.notifications.addFatalError("Could not write file!", {detail: e.name + " " + e.message, stack: e.stack, dismissable: true});
					break;
				}

			}

			this.syncPanel.destroy();


			if (success) {
				atom.notifications.addSuccess(`Downloaded ${diffFiles.length} files from server!`);
				this.collabyStatusView.icon.classList.remove("icon-stop");
				this.collabyStatusView.icon.classList.add("icon-check");
				this.tooltipItem.textContent = "Collaby sync status: Synced";
				this.collabyStatusView.value.textContent = "Synced";


				for (project of Object.keys(this.serverFiles)) {
					atom.project.addPath(this.workingDir + path.sep + project);
				}
			} else {
				this.collabyStatusView.value.textContent = "Error";
			}

		});

	}

	startTracking() {
		this.tracker = new CollabyTracker();

		this.tracker.track();

		this.trackerSubs.add(this.tracker.onDidChange((data) => {
			this.socket.emit("change", data);
		}));

		this.trackerSubs.add(this.tracker.onWillSave((data) => {
			this.socket.emit("will-save", data);
		}));

		console.log("tracking now");
	}

	stopTracking() {
		if (!this.tracker) return;

		this.tracker.stop();
		this.trackerSub.dispose();

		console.log("stopped tracking");
	}

	getWorkingDir(project) {
		let dir = this.workingDir;

		if (!dir && project) {
			for (d of atom.project.getPaths()) {
				if (path.basename(d) == project) {
					dir = path.dirname(d);
					break;
				}
			}
		}

		return dir;
	}

	change(data) {
		console.log("got the change on client", data);
		data.relPath = Helper.normalizeSeperators(data.relPath);
		let dir = this.getWorkingDir(data.project);
		let file = dir + path.sep + data.project + path.sep + data.relPath;
		let buffer = Helper.getBufferOfFile(file);

		if (!buffer) {
			console.log("no buffer");
			return;
		}

		console.log("got the buffer", file, buffer);

		let doChange = () => {
			console.log("doing change");
			global.collaby.changing = true;
			if (data.changeType == 'substitution') {
        buffer.setTextInRange(data.change.oldRange, data.change.newText);
      } else if (data.changeType == 'insertion') {
        buffer.setTextInRange([data.change.newRange.start, data.change.newRange.start], data.change.newText);
      } else if (data.changeType == 'deletion') {
        buffer.setTextInRange(data.change.oldRange, '');
			}
			global.collaby.changing = false;
		};

		if (!buffer.loaded) {
			console.log("buffer not loaded. waiting for loading");
			buffer.emitter.once('did-change-modified', () => {
				console.log("loaded now!");
				doChange();
			});
		} else {
			console.log("buffer loaded");
			doChange();
		}
	}

	save(data) {
		console.log('got the save on the client');
		data.relPath = Helper.normalizeSeperators(data.relPath);
		let buffer = Helper.getBufferOfFile(this.getWorkingDir(data.project) + path.sep + data.project + path.sep + data.relPath);
		global.collaby.saving = true;
		buffer.save();
		global.collaby.saving = false;
	}

	disconnect() {
		this.socket.disconnect();
		atom.notifications.addSuccess('Disconnected from collaby server.');
	}

}
