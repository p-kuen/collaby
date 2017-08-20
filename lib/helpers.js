'use babel';

import fs from 'fs';
import path from 'path';
import { CompositeDisposable } from 'atom';

export default {

	mapMenuItems(items) {

		return items.map(function(item) {
			return {
				label: "Packages",
				submenu: [{
					label: "collaby",
					submenu: [{
						label: item.label,
						command: item.command
					}]
				}]
			};
		});

	},

	addMenuItems(...items) {
		atom.menu.add(this.mapMenuItems(items));
	},

	removeMenuItems(...items) {
		atom.menu.remove(this.mapMenuItems(items));
	},

	recSingleScan(name, filePath) {
		let output = null;
		let stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			output = {name: name, type: "directory", stats: stat, path: filePath, content: this.recScan(filePath)};
		} else {
			output = {name: name, type: "file", stats: stat, path: filePath};
		}

		return output;
	},

	recScan(scanPath) {

		let files = fs.readdirSync(scanPath);
		let sFiles = files.filter(file => !atom.config.get("collaby.ignore").includes(file));
		let arr = {};

		for (file of sFiles) {
			let filePath = scanPath + path.sep + file;
			arr[file] = this.recSingleScan(file, filePath);
		}

		return arr;

	},

	recScanCb(scanPath, cb, rPath = "") {

		let files = fs.readdirSync(scanPath);
		let sFiles = files.filter(file => !atom.config.get("collaby.ignore").includes(file));

		for (file of sFiles) {
			let filePath = scanPath + path.sep + file;
			let stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				this.recScanCb(filePath, cb, rPath + path.sep + file);
			} else {
				cb({file: file, filePath: filePath, stat: stat, relPath: rPath + path.sep + file});
			}
		}

	},

	deepDiff(o1, o2) {

		diffServer = (o1, o2, rPath = "") => {

			let diff = new Array();

			// Check all server files
			for (let key in o1) {
				let objS = o1[key];

				objS.path = this.normalizeSeperators(objS.path);

				// First check if file or directory exists on client
				if (!o2.hasOwnProperty(key)) {
					console.log("path " + objS.path + " not available on client");
					diff.push({path: objS.path, directory: objS.type == "directory", relPath: rPath + path.sep + objS.name });
					continue;
				}

				// Check if the types are the same
				let objC = o2[key];

				// Then check if the types are the same
				if (objC.type != objS.type) {
					console.log("type is different.. unlinking " + objC.path);
					fs.unlink(objC.path, function(err) {
						console.log("error with unlinking file ", err);
					});
					diff.push({path: objS.path, directory: objS.type == "directory", relPath: rPath + path.sep + objS.name });
					continue;
				}

				if (objS.type == "file") {
					let timeS = new Date(objS.stats.ctime);
					let timeC = new Date(objC.stats.ctime);

					// Now check for size and time differences
					if (objC.stats.size != objS.stats.size || timeS.getTime() > timeC.getTime()) {
						console.log("size is different (" + objS.path + ")");
						diff.push({path: objS.path, directory: false, relPath: rPath + path.sep + objS.name});
					}
				} else if (objS.type == "directory") {
					// Call self for deep checking
					let newDiff = diffServer(objS.content, objC.content, rPath + path.sep + objS.name);

					if (newDiff != null) {
						diff = diff.concat(newDiff);
					}
				}
			}

			return diff;
		}

		// Check client files
		// User should not have files, the server has -> delete them
		diffClient = (o1, o2) => {

			for (let key in o2) {
				let objC = o2[key];

				objC.path = this.normalizeSeperators(objC.path);

				if (!o1.hasOwnProperty(key)) {
					if (objC.type == "file") {
						console.log("deleting file " + objC.path);
						fs.unlink(objC.path);
					} else if( objC.type == "directory") {
						console.log("deleting dir " + objC.path);
						this.rmDirRec(objC.path);
					}
					continue;
				}

				// If the object is a directory, call self for a deep check
				if (objC.type == "directory") {
					diffClient(o1[key].content, objC.content);
				}
			}
		}

		// First check if the client has too much files
		diffClient(o1, o2);

		// Then get the files, the client needs from the server
		return diffServer(o1, o2);

	},

	mkDirRec(dir) {
		if (fs.existsSync(dir)) {
			return;
		}

		try {
			fs.mkdirSync(dir);
			console.log("created " + dir);
		} catch(err) {
			if (err.code == 'ENOENT') {
				this.mkDirRec(path.dirname(dir)); //create parent dir
				this.mkDirRec(dir); //create dir
			}
		}
	},

	rmDirRec(dir) {
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir).forEach((file, index) => {
				var curPath = dir + path.sep + file;
				if(fs.lstatSync(curPath).isDirectory()) {
	        this.rmDirRec(curPath);
	      } else {
	        fs.unlinkSync(curPath);
	      }
			});
			fs.rmdirSync(dir);
		}
	},

	getBufferOfFile(file) {
		let buf = null;

		let findBuffer = () => {
			for (b of atom.project.getBuffers()) {
				if (!b.file || !b.file.path) continue;

				if (file == b.file.path) return b;
			}
		};

		buf = findBuffer();

		if (buf) return buf;

		// if no buffer could be found, we try to open that file and search again
		atom.workspace.open(file, {activateItem: false});

		return findBuffer();

	},

	normalizeSeperators(p) {

		if (!p || typeof(p) != "string") return p;

		if (path.sep == "/") {
			// Mac, Linux -> replace windows separators
			return p.replace(/\\/g, path.sep);
		} else if (path.sep == "\\") {
			// Windows
			return p.replace(/\//g, path.sep);
		}

		return p;
	}

}
