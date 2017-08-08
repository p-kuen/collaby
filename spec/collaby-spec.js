'use babel';

import Collaby from '../lib/collaby';
import CollabyServer from '../lib/server';
import CollabyClient from '../lib/client';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Collaby Server', () => {

	let workspaceElement, activationPromise;
	let pkg;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('collaby').then((pack) => {
			pkg = pack.mainModule;
		} );
  });

  describe('when the collaby:startServer event is triggered', () => {

		beforeEach(() => {

			atom.commands.dispatch(workspaceElement, 'collaby:startServer');

			waitsForPromise(() => {
        return activationPromise;
      });

			waitsFor(() => {
				return pkg.client.socket.connected;
			}, "The Value should be incremented", 1)

		});


    it('creates a server and serverclient', () => {

			runs(() => {

				expect(pkg.server).not.toBe(null);
				expect(pkg.client).not.toBe(null);
				expect(pkg.client.socket.connected).toBeTruthy();

			});



    });

		describe('when a client connects to the server', () => {

			it('creates a client and shows the right view', () => {

				atom.commands.dispatch(workspaceElement, 'collaby:join');

	      runs(() => {
					expect(pkg.client).not.toBe(null);
					let ipView = workspaceElement.querySelector('.collaby.ip-view');
					let editor = ipView.querySelector('atom-text-editor').getModel();
					expect(ipView).toBeTruthy();
					editor.setText("localhost");
					atom.commands.dispatch(ipView, "core:confirm");
	      });
			});

		});

  });

});
