'use babel';

export default class CollabyView {

  constructor() {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('collaby', 'inline-block');

    // Create message element
    const icon = document.createElement('i');
    icon.classList.add('icon', 'icon-radio-tower');
    this.element.appendChild(icon);

		// Create message element
    const message = document.createElement('span');
		message.textContent = '0';
    message.classList.add('message-radio-tower');
    this.element.appendChild(message);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
