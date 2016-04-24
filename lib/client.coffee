{Emitter} = require 'event-kit'
{CompositeDisposable} = require 'atom'
fs = require 'fs'
io_cl = require 'socket.io-client'

module.exports = class CollabyClient

  @socket = null
  @workingDir = null

  constructor: ( ip, options ) ->
    @emitter = new Emitter
    @events = new CompositeDisposable
    @notification = atom.notifications
    @workingDir = null
    if not options?
      options = {}

    console.log "constructing new client"

    # Connect to client
    @connect ip, =>

      # Handle syncing
      @socket.once 'serverFiles', (data) =>
        if options.serverClient? and options.serverClient is true
          return
        @sync data

      # Handle saving
      @socket.on 'save', ( file ) =>
        console.log "saving buffer " + file
        @emitter.emit 'save', file
        @saveFileOnClient file

      # Handle buffer destroying
      @socket.on 'destroy', ( file ) =>
        console.log "destroying buffer " + file
        @destroyBufferOnClient file

      # Handle changing
      @socket.on 'change', ( data ) =>
        @emitter.emit 'change', data
        @changeFileOnClient data

      # Handle server notifications
      @socket.on 'notification', (data) =>
        if data.noSC is true
          return
        if data.type == 'success'
          @notification.addSuccess(data.msg)
        else if data.type == 'info'
          @notification.addInfo(data.msg)

  getFilesFromServer: ( files ) ->

    # Remove all project folders
    for projectPath in atom.project.getPaths()
      atom.project.removePath( projectPath )

    getFiles = ( serverFiles ) =>
      Helper = require "./helpers"
      # Read out client files
      clientFiles = Helper.recFScan @workingDir

      # Send different filepaths to server
      @socket.emit 'client:getDiffFiles', Helper.compareFiles( serverFiles, clientFiles, @workingDir )

      # Get different file contents from server
      @socket.once "diffFiles", (newFiles) =>
        for file in newFiles
          fs.writeFileSync file.path, file.content, 'utf-8'
        @notification.addSuccess("Synced!")

        # Add project folder
        console.log "adding path #{@workingDir}"
        atom.project.addPath(@workingDir)

    if files
      getFiles( files )
    else
      @notification.addInfo("Syncing...")
      @socket.emit 'client:getFiles'

      # Handle syncing
      @socket.once 'serverFiles', (data) =>
        projectCount = Object.keys( data ).length
        if projectCount > 1
          getFiles( data )
        else
          getFiles( data[ Object.keys( data )[0] ].content )




  sync: ( serverFiles ) ->
    CollabyView  = require './collabyView'

    projectCount = Object.keys( serverFiles ).length
    preview = null
    if projectCount > 1
      preview = serverFiles[Object.keys(serverFiles)[0]].name
    else
      preview = "<syncedFiles>"

    console.log serverFiles

    # Create the Sync View
    syncView = new CollabyView( {
      header: "Enter Sync path",
      placeholder: "Sync Path",
      closable: false,
      pathMode: true,
      preview: preview
      }, (path) =>
      @workingDir = path
      # @socket.emit 'client:startSync'

      @notification.addInfo("Syncing...")

      if projectCount > 1
        @getFilesFromServer( serverFiles )
      else
        @getFilesFromServer( serverFiles[ Object.keys( serverFiles )[0] ].content )

      #@sync(path, data)
    )
    syncView.show()

  destroyBufferOnClient: ( file ) ->
    Helper = require "./helpers"
    f = atom.project.getPaths()[0] + file

    buffer = Helper.getBufferOfFile( f )
    if !buffer
      console.log f + " will not be destroyed!"
      return

    buffer.destroy()

  saveFileOnClient: ( file ) ->
    console.log "saving " + file
    Helper = require "./helpers"
    f = atom.project.getPaths()[0] + file

    buffer = Helper.getBufferOfFile( f )
    if !buffer
      console.log f + " will not be saved!"
      return

    atom.window.noUserSave = true
    buffer.save()
    atom.window.noUserSave = false

  changeFileOnClient: ( data ) ->
    Helper = require "./helpers"
    f = atom.project.getPaths()[0] + data.file

    buffer = Helper.getBufferOfFile( f )
    if !buffer
      console.log "Change will not be done!"
      return

    doChange = () =>

      atom.window.noUserChange = true
      if data.changeType == 'substitution'
        buffer.setTextInRange(data.change.oldRange, data.change.newText)
      else if data.changeType == 'insertion'
        buffer.setTextInRange([data.change.newRange.start, data.change.newRange.start], data.change.newText)
      else if data.changeType == 'deletion'
        buffer.setTextInRange(data.change.oldRange, '')
      atom.window.noUserChange = false

    if buffer.loaded is false
      once = false
      buffer.onDidChangeModified () =>
        if once is true
          return
        once = true
        doChange()
    else
      doChange()

  connect: ( ip, cb ) ->

    @socket = io_cl.connect 'http://' + ip, {port: 80}

    @socket.once 'connected', =>
      cb()
      @emitter.emit 'connected', ip

  startTracking: () ->
    CollabyTracker = require "./collabyTrack"
    tracker = new CollabyTracker

    tracker.onChange (data) =>
      @socket.emit 'client:change', data

    tracker.onSave (file) =>
      @socket.emit 'client:save', file

    tracker.onDestroy (file) =>
      @socket.emit 'client:destroy', file

    tracker.track()

    @notification.addInfo("Tracking now...")

  onConnected: ( callback ) ->
    @emitter.on 'connected', callback

  onSave: ( callback ) ->
    @emitter.on 'save', callback

  onChange: ( callback ) ->
    @emitter.on 'change', callback
