{Emitter} = require 'event-kit'
{CompositeDisposable} = require 'atom'
_ = require 'underscore'

module.exports = class CollabyTracker

  constructor: () ->
    @emitter = new Emitter
    @events = new CompositeDisposable
    @relativePath = null
    @lastFile = null
    @lastPath = null
    console.log "collabyTrack created"

  track: ->
    path = require 'path'
    @editor = atom.workspace.getActiveTextEditor()
    @lastActiveEditor = null

    @projectPaths = atom.project.getPaths()
    @trackEvent = null
    @saveEvent = null
    @destroyEvents = new CompositeDisposable

    refreshEvents = () =>
      if @trackEvent != null
        @trackEvent.dispose()

      if @saveEvent != null
        @saveEvent.dispose()

      @destroyEvents.dispose()

      @lastActiveEditor = @editor
      @lastFile = @relativePath

      @editor = atom.workspace.getActiveTextEditor()
      if !@editor?
        return
      ePath = @editor.getPath()
      if !ePath?
        return

      if @lastPath != ePath
        @relativePath = ePath.replace @projectPaths[0], ''
        @lastPath = ePath

      em = @emitter

      @saveEvent = @editor.buffer.onWillSave () =>
        em.emit 'will-save', @relativePath

      # Destroy buffers
      for buffer in atom.project.getBuffers()
        @destroyEvents.add buffer.onDidDestroy () =>
          em.emit 'did-destroy', @lastFile

      # Track changes
      @trackEvent = @editor.buffer.onDidChange (change) =>
        if atom.window.noUserChange == true
          return

        changeType = null

        if change.newText is change.oldText and _.isEqual(change.oldRange, change.newRange)
          return

        if !(change.newText is "\n") and (change.newText.length is 0)
          changeType = 'deletion'
          change = {oldRange: change.oldRange}
        else if change.oldText != ''
          changeType = 'substitution'
          change = {oldRange: change.oldRange, newRange: change.newRange, newText: change.newText}
        else
          changeType = 'insertion'
          change  = {newRange: change.newRange, newText: change.newText}

        changeData =
          user: 'me'
          file: @relativePath
          changeType: changeType
          change: change

        em.emit 'did-change', changeData

    # Refresh the change events when the user opens another file#
    atom.workspace.onDidChangeActivePaneItem () =>
      refreshEvents()
      console.log "changed editor!"

    refreshEvents()

  stop: ->
    @emitter.dispose() # remove subscribers on destruction

  onChange: (callback) ->
    @emitter.on 'did-change', callback

  onDestroy: (callback) ->
    @emitter.on 'did-destroy', callback

  onSave: (callback) ->
    @emitter.on 'will-save', callback
