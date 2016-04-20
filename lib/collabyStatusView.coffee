class CollabyStatusView extends HTMLElement

  constructor: () ->
    @classList.add('status-bar-collaby', 'inline-block', 'icon-radio-tower')
    @textContent = "  " + global.collaby.serverData.clients

  updateCount: ->
    @textContent = "  " + global.collaby.serverData.clients

module.exports = document.registerElement('status-bar-collaby', prototype: CollabyStatusView.prototype, extends: 'div')
