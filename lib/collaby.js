'use babel';

import Helper from './helpers';
import CollabyView from './collaby-view';
import CollabyServer from './server';
import CollabyClient from './client';
import CollabyLoadView from './collaby-load-view';
import { CompositeDisposable } from 'atom';

global.collaby = {};

export default {

  collabyView: null,
  modalPanel: null,
  subscriptions: null,

	config: {
		port: {
			type: "integer",
			default: 80,
			minimum: 1
		},
		ignore: {
			title: "Ignored files and folders",
			description: "Collaby will not sync the files and folders in this list",
			type: "array",
	    default: [".git", ".DSTORE"],
	    items: {
				type: "string"
			}
		},
		maxFiles: {
			title: "Maximum syncable different files",
			description: "Collaby will not sync, if you have more different files than this number. Warning! Crashes are possible if number is too high.",
			type: "integer",
			default: 200,
			minimum: 1
		}
	},

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
			'collaby:startServer': () => this.startServer(),
			'collaby:stopServer': () => this.stopServer(),
			'collaby:join': () => this.join(),
			'collaby:sync': () => this.sync(),
			'collaby:disconnect': () => this.disconnectFromServer(),
			'collaby:trackingOn': () => this.trackingOn(),
			'collaby:trackingOff': () => this.trackingOff()
    }));

  },

  deactivate() {
		console.log("deactivating collaby");
		if (this.client) this.client.disconnect();
		if (this.server) this.server.close();
    this.subscriptions.dispose();
  },

	startServer() {
		this.server = new CollabyServer();
		this.client = new CollabyClient("localhost", () => {}, {serverClient: true});

		try {
			this.server.listen(atom.config.get("collaby.port"));

			Helper.addMenuItems({
					label: "Start Tracking",
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
		let ipView = new CollabyView({header: "Enter IP-Address", placeholder: "IP-Address"}, (ip) => {
			this.connectView = new CollabyLoadView();
    	this.connectView.show("Connecting");
			this.connectPanel = atom.workspace.addModalPanel({item: this.connectView});

      this.client = new CollabyClient(ip, () => {
				atom.notifications.addSuccess(`Connected to ${ip} successfully!`);
				this.connectPanel.destroy();
				Helper.addMenuItems(
					{
						label: "Start Tracking",
						command: "collaby:trackingOn"
					},
					{
						label: "Sync",
						command: "collaby:sync"
					},
					{
						label: "Disconnect",
						command: "collaby:disconnect"
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

	sync() {
		if (!this.client) {
			atom.notifications.addFatalError("Could not sync files! Client is not defined.");
			return;
		}

		this.client.sync();
	},

	trackingOn() {
		Helper.addMenuItems({
				label: "Stop tracking",
				command: "collaby:trackingOff"
			}
		);

		Helper.removeMenuItems({
				label: "Start Tracking",
				command: "collaby:trackingOn"
			}
		);
		this.client.startTracking();
	},

	trackingOff() {
		Helper.removeMenuItems({
				label: "Stop tracking",
				command: "collaby:trackingOff"
			}
		);

		Helper.addMenuItems({
				label: "Start Tracking",
				command: "collaby:trackingOn"
			}
		);
		this.client.stopTracking();
	},

	stopServer() {
		this.deactivate();

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
				label: "Start tracking",
				command: "collaby:trackingOn"
			},
			{
				label: "Stop server",
				command: "collaby:stopServer"
			}
		);

	},

	disconnectFromServer() {
		this.deactivate();

		Helper.addMenuItems({
				label: "Join",
				command: "collaby:join"
			},
			{
				label: "Start server",
				command: "collaby:startServer"
			}
		);

		Helper.removeMenuItems(
			{
				label: "Activate Tracking",
				command: "collaby:trackingOn"
			},
			{
				label: "Sync",
				command: "collaby:sync"
			},
			{
				label: "Disconnect",
				command: "collaby:disconnect"
			}
		);
	},

	consumeStatusBar(statusBar) {

		global.collaby.statusBar = statusBar;

    this.statusbar = statusBar;

	}

};
