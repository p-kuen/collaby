{Emitter} = require 'event-kit'
path = require 'path'
CollabyStatusView  = require './collabyStatusView'
{CompositeDisposable} = require 'atom'

module.exports = class CollabyServer

  @socket = null
  @serverData = null

  constructor: ( options ) ->
    @serverData =
      clients: 0

    @emitter = new Emitter
    @events = new CompositeDisposable
    @notification = atom.notifications

    # Create status view
    @collabyStatusView = new CollabyStatusView()

    if @statusbar?
      @statusbar.addRightTile
        item: @collabyStatusView, priority: -1

    @notification.addSuccess("Successfully started a
      new collaby server for this project!")

  consumeStatusBar: (statusBar) ->
    @statusbar = statusBar

  listen: ( port ) ->
    port ?= 80
    @socket = require('socket.io').listen( port )
    @handleEvents()
    @notification.addInfo("Server listens on port #{port} now!")
    return @socket

  getFiles: ->
    fs = require 'fs'
    path = require 'path'

    @projectPaths = atom.project.getPaths()

    projects = {}

    for projectPath in @projectPaths

      project = {
        name: path.basename(projectPath)
        fullPath: projectPath
        type: "directory"
        content: null
      }

      {recFScan} = require "./helpers"

      project.content = recFScan projectPath

      projects[project.name] = project
    return projects

  handleEvents: () ->

    @socket.sockets.on 'connection', (socket) =>
      # Increase the client counter#
      @serverData.clients++

      sendFiles = () =>
        socket.emit 'serverFiles', @getFiles()

      socket.emit 'connected'
      if @serverData.clients >= 2
        sendFiles()
      socket.emit 'notification', {type: 'success', msg: 'You successfully connected to a collaby server!', noSC: true}
      socket.broadcast.emit 'notification', {type: 'info', msg: 'A User connected to this collaby session!'}

      socket.on 'client:change', (data) =>
        @content = data.newContent
        delete data["newContent"]
        socket.broadcast.emit 'change', data

      socket.on 'client:getFiles', =>
        sendFiles()

      socket.on 'client:save', (file) =>
        console.log file
        socket.broadcast.emit 'save', file

      socket.on 'client:destroy', (file) =>
        console.log file
        socket.broadcast.emit 'destroy', file

      socket.on 'disconnect', (data) ->
        console.log "client left..."

      socket.on 'client:disconnect', (data) ->
        console.log "client left..."
        serverData.clients--
        socket.disconnect()
        socket.broadcast.emit 'notification', {type: 'info',
        msg: 'A User disconnected from this session!'}

      socket.on 'client:startSync', () ->
        socket.emit 'startSync'

      socket.on 'client:getDiffFiles', (files) ->
        fs = require 'fs'
        contents = []
        for diff in files
          # Getting file contents
          contents.push {content: fs.readFileSync(diff.serverFile.path, "utf8"), path: diff.p + "\\" + diff.serverFile.name}
        socket.emit 'diffFiles', contents

      socket.on 'client:cursor', (data) ->
        console.log "cursor"
        # clientCursor =
        #   user: 'test'
        #   pos: newScreenPosition
        #socket.broadcast.emit 'cursor', clientCursor
