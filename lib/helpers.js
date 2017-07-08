'use babel';

import path from 'path'
import { CompositeDisposable } from 'atom'

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
	}

}
