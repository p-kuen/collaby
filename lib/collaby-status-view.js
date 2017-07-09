'use babel';

export default class CollabyStatusView {

  constructor() {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('collaby', 'inline-block');

    // Create message element
    const icon = document.createElement('i');
    icon.classList.add('icon', 'icon-radio-tower');
    this.element.appendChild(icon);

		// Create message element
    this.value = document.createElement('span');
		this.value.textContent = '0';
    this.value.classList.add('message-radio-tower');
    this.element.appendChild(this.value);
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
