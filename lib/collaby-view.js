'use babel';

import { TextEditor, CompositeDisposable, Disposable } from 'atom';

export default class CollabyView {

  constructor(options = {}, callback) {

		this.default = {
			header: "Enter your text",
			placeholder: "Text",
			closable: true,
			blurClose: false,
			pathMode: false,
			preview: ""
		};

		this.options = Object.assign(this.default, options);
		this.callback = callback;

		this.subscriptions = new CompositeDisposable;

    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('collaby','ip-view');

		// Create modal panel
		this.modalPanel = atom.workspace.addModalPanel({
      item: this.element,
      visible: false
    });

    // Create message element
    const message = document.createElement('p');
    message.textContent = options.header;
    message.classList.add('message');
    this.element.appendChild(message);

		// Create input element
		this.input = new TextEditor({mini: true});
		this.input.setPlaceholderText(options.placeholder);
    this.element.appendChild(this.input.element);

		if (this.options.closable && this.options.blurClose) {
			this.input.element.addEventListener('blur', this.close.bind(this));
		}

		this.subscriptions.add(atom.commands.add(this.element, {
			'core:confirm': () => this.modalPanel && this.confirm(),
      'core:close': () => this.modalPanel && this.options.closable && this.close(),
      'core:cancel': () => this.modalPanel && this.options.closable && this.close()
    }));

  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

	confirm() {
		let ip = this.input.getText()
    if (ip == "") {return}

		if (typeof this.callback === "function") {
			this.callback( ip )
		}

		this.close();
	}

	close() {
		if (!this.modalPanel.isVisible()) {return};
    this.modalPanel.hide();

		if (this.previouslyFocusedElement) {
			this.previouslyFocusedElement.focus();
		}
	}

  getElement() {
    return this.element;
  }

	show() {
    this.modalPanel.show();
		this.input.setText('');
		this.input.element.focus();
	}

	storeFocusedElement() {
		this.previouslyFocusedElement = $(document.activeElement)
	}

}
