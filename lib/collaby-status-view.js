'use babel';

export default class CollabyStatusView {

  constructor(defaultIcon, defaultText) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('collaby', 'inline-block');

    // Create message element
    this.icon = document.createElement('i');
    this.icon.classList.add('icon', defaultIcon);
    this.element.appendChild(this.icon);

		// Create message element
    this.value = document.createElement('span');
		this.value.textContent = defaultText;
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
