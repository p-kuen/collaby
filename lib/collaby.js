'use babel';

import Helper from './helpers';
import CollabyView from './collaby-view';
import CollabyServer from './server';
import CollabyClient from './client';
import CollabyConnectView from './collaby-connect-view';
import { CompositeDisposable } from 'atom';

global.collaby = {};

export default {

  collabyView: null,
  modalPanel: null,
  subscriptions: null,

	config: {
		"port": {
			"type": "integer",
			"default": 80,
			"minimum": 1
		}
	},

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
			'collaby:startServer': () => this.startServer(),
			'collaby:stopServer': () => this.stopServer(),
			'collaby:join': () => this.join()
    }));

  },

  deactivate() {
    this.subscriptions.dispose();
  },

	startServer() {
		this.server = new CollabyServer();
		this.client = new CollabyClient("localhost", () => {}, {serverClient: true});

		try {
			this.server.listen(atom.config.get("collaby.port"));

			Helper.addMenuItems({
					label: "Activate Tracking",
					command: "collaby:trackingOn"
				},
				{
					label: "Stop server",
					command: "collaby:stopServer"
				}
			);

			Helper.removeMenuItems({
					label: "Join",
					command: "collaby:join"
				},
				{
					label: "Start server",
					command: "collaby:startServer"
				}
			);

		} catch (e) {
			atom.notifications.addError(e.short, {detail: e.message});
		}

	},

	join() {
		console.log("join");
		let ipView = new CollabyView({header: "Enter IP-Address", placeholder: "IP-Address"}, function(ip) {
      console.log('connecting to ' + ip);
			this.connectView = new CollabyConnectView();
    	this.connectView.show();
			this.connectPanel = atom.workspace.addModalPanel({item: this.connectView});

      this.client = new CollabyClient(ip, () => {
				atom.notifications.addSuccess("Connected to ${ip} successfully!");
				this.connectPanel.destroy();
				Helper.addMenuItems(
					{
						label: "Activate Tracking",
						command: "collaby:trackingOn"
					},
					{
						label: "Sync from server",
						command: "collaby:syncClient"
					}
				);
				Helper.removeMenuItems(
					{
						label: "Join",
						command: "collaby:join"
					},
					{
						label: "Start server",
						command: "collaby:startServer"
					}
				);
			});

    });
    ipView.show()
	},

	stopServer() {
		this.server.socket.close();
		atom.notifications.addInfo("Server stopped");

		Helper.addMenuItems({
				label: "Join",
				command: "collaby:join"
			},
			{
				label: "Start server",
				command: "collaby:startServer"
			}
		);

		Helper.removeMenuItems({
				label: "Activate Tracking",
				command: "collaby:trackingOn"
			},
			{
				label: "Stop server",
				command: "collaby:stopServer"
			}
		);

	},

	consumeStatusBar(statusBar) {

		global.collaby.statusBar = statusBar;

    this.statusbar = statusBar;

	}

};
