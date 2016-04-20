{$, TextEditorView, View}  = require 'atom-space-pen-views'

module.exports =
class CollabyView extends View

  @content: ->
    @div =>
      @h1 'Title'
      @subview 'miniEditor', new TextEditorView(mini: true, placeholderText: 'Input')
      @div ''
      @div ''

  initialize: ({header, placeholder, closable, pathMode, preview} = {}, callback) ->
    header ?= "Enter your text"
    placeholder ?= "Text"
    closable ?= true
    pathMode ?= false
    preview ?= ""

    this.callback = callback
    @addClass('collaby-view')
    @panel ?= atom.workspace.addModalPanel(item: this, visible: false)
    @.find("h1")[0].textContent = header
    @miniEditor.model.placeholderText = placeholder

    if pathMode == true
      @miniEditor.getModel().onDidChange => @.find("div")[0].textContent = @miniEditor.getText() + "\\" + preview
      @.find("div")[1].innerHTML = "<b>All other files in the input folder will be deleted!</b>"

    atom.commands.add @miniEditor.element, 'core:confirm', => @confirm()

    if closable
      #@miniEditor.on 'blur', => @cancel()
      atom.commands.add @miniEditor.element, 'core:cancel', => @cancel()

  cancel: ->
    @miniEditor.setText('')
    @panel.hide()
    @restoreFocus()

  show: ->
    @storeFocusedElement()
    @panel.show()
    @miniEditor.focus()

  confirm: ->
    ip = @miniEditor.getText()
    if ip == ""
      return
    @cancel()
    @callback( ip )

  storeFocusedElement: ->
    @previouslyFocusedElement = $(document.activeElement)

  restoreFocus: ->
    @previouslyFocusedElement?.focus()
