'use babel';

import { Emitter } from 'event-kit';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import io_cl from 'socket.io-client';

export default class CollabyClient {

	constructor(ip, options) {
		this.emitter = new Emitter();
		this.events = new CompositeDisposable();
		this.workingDir = null;

		if (!options) {
			options = {}
		}

		console.log("constructing new client");

		this.connect( ip, function() {
			// Handle syncing
      // this.socket.once('serverFiles', function(data) {
      //   if options.serverClient? and options.serverClient is true
      //     return
      //   @sync data
			// }
		} );

	}

	connect(ip, cb) {
		this.socket = io_cl.connect('http://' + ip, {port: atom.config.get('collaby.port')});

		this.socket.once('connected', function() {
			cb();
      this.emitter.emit('connected', ip);
		});

	}

}
