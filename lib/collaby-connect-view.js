'use babel';

export default class CollabyConnectView {

  constructor() {
    // Create root element
    this.element = document.createElement('update-package-dependencies-progress');
    this.element.classList.add('collaby', 'collaby-progress');
		this.element.tabIndex = -1;

  }

	show() {
		this.element.innerHTML = `
			<span class="loading loading-spinner-small inline-block"></span>
			<span>
				Connecting\u2026
			</span>
		`;
	}

}
