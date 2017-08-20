'use babel';

import { Emitter } from 'event-kit';
import { CompositeDisposable } from 'atom';
import path from 'path';

export default class CollabyClient {

	constructor() {
		this.emitter = new Emitter();
		this.subscriptions = new CompositeDisposable();
		console.log("collabytracker created");
	}

	track() {
		this.editor = atom.workspace.getActiveTextEditor();

		let refreshSubs = () => {
			this.subscriptions.dispose();

			this.editor = atom.workspace.getActiveTextEditor();
			console.log("tracking editor: ", this.editor);
			if (!this.editor) return;

			// Saving
			this.subscriptions.add(this.editor.buffer.onWillSave(() => {
				if (global.collaby.saving === true) return;
				let relativized = atom.project.relativizePath(this.editor.buffer.file.path);
				console.log("emitting save", {relPath: relativized[1], project: path.basename(relativized[0])});
				this.emitter.emit('will-save', {relPath: relativized[1], project: path.basename(relativized[0])});
			}));

			// Changing
			this.subscriptions.add(this.editor.buffer.onDidChange((change) => {

				if (global.collaby.changing === true) return;

				let changeType = null;
				let relativized = atom.project.relativizePath(this.editor.getPath());

				console.log("tracking change ", change);

				if (change.newText == change.oldText && change.oldRange === change.newRange) return;

				if ((change.newText != "\n") && (change.newText.length == 0)) {
					changeType = 'deletion';
				} else if (change.oldText != '') {
          changeType = 'substitution';
				} else {
					changeType = 'insertion';
				}

				let changeData = {
					relPath: relativized[1],
					project: path.basename(relativized[0]),
					changeType: changeType,
					change: change
				}

				console.log("emitting ", changeData);

				this.emitter.emit('did-change', changeData);
			}));
		};

		// Refresh the change events when the user opens another file#
    atom.workspace.onDidChangeActivePaneItem(() => {
      refreshSubs();
		});

    refreshSubs();
	}

	stop() {
		this.subscriptions.dispose();
	}

	onDidChange(cb) {
		return this.emitter.on('did-change', cb);
	}

	onWillSave(cb) {
		return this.emitter.on('will-save', cb);
	}

}
