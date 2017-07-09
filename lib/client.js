'use babel';

import { Emitter } from 'event-kit';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import io_cl from 'socket.io-client';

export default class CollabyClient {

	constructor(ip, connectCb, options) {
		this.emitter = new Emitter();
		this.events = new CompositeDisposable();
		this.workingDir = null;
		this.connectCb = connectCb;

		if (!options) {
			options = {}
		}

		console.log("constructing new client");

		this.connect(ip, () => {
			this.connectCb();
			// Handle syncing
      // this.socket.once('serverFiles', function(data) {
      //   if options.serverClient? and options.serverClient is true
      //     return
      //   @sync data
			// }
		});

	}

	connect(ip, cb) {
		console.log('connecting to http://' + ip);
		this.socket = io_cl('http://' + ip);

		this.socket.on('connect', () => {
			cb();
		  console.log("connected! ID:" + this.socket.id); // 'G5p5...'
		});

	}

}
