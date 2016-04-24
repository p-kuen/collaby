global.collaby = {}
CollabyView  = require './collabyView'
Helper = require "./helpers"
{CompositeDisposable} = require 'atom'

module.exports = Collaby =

  activate: (state) ->
    # Events subscribed to in atom's system can be easily cleaned up
    # with a CompositeDisposable
    @subscriptions = new CompositeDisposable
    @events = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:startServer': => @startServer()
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:stopServer': => @stopServer()
    @events.add atom.commands.add 'atom-workspace',
    'collaby:trackingOn': => @trackingOn()
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:trackingOff': => @trackingOff()
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:join': => @join()
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:syncClient': => @syncClient()

    @notification = atom.notifications


  deactivate: ->
    console.log "deactivate"
    @subscriptions.dispose()
    @events.dispose()
    @socket.emit 'client:disconnect'

  startServer: ->
    CollabyServer = require "./server"
    @server = new CollabyServer()

    @server.listen( 80 )

    CollabyClient = require "./client"
    @client = new CollabyClient( 'localhost', {serverClient: true} )

    Helper.addMenuItem "Activate Tracking", "collaby:trackingOn"
    Helper.addMenuItem "Stop Server", "collaby:stopServer"
    Helper.removeMenuItem "Join", "collaby:join"
    Helper.removeMenuItem "Start Server", "collaby:startServer"

  stopServer: ->
    @server.socket.close()
    @notification.addInfo("Server stopped.")

    Helper.addMenuItem "Start Server", "collaby:startServer"
    Helper.addMenuItem "Join", "collaby:join"
    Helper.removeMenuItem "Activate Tracking", "collaby:trackingOn"
    Helper.removeMenuItem "Stop Server", "collaby:stopServer"

        # atom.confirm
        #   message: 'You have a different file than the server.'
        #   detailedMessage: 'Do you want to download the file from the server now?'
        #   buttons:
        #     Download: -> ed.setText( data.serverContent )
        #     Disconnect: ->
        #       so.emit 'client:disconnect'
        #       nots.addInfo("Disconnected from the server.")

  join: ->
    ipView = new CollabyView( {header: "Enter IP-Address", placeholder: "IP-Address"}, (ip) =>
      console.log 'connecting to ' + ip
      @notification.addInfo("Connecting...")

      CollabyClient = require "./client"
      @client = new CollabyClient( ip )

      Helper.addMenuItem "Activate Tracking", "collaby:trackingOn"
      Helper.addMenuItem "Sync from server", "collaby:syncClient"

    )
    ipView.show()

  syncClient: ->
    @client.getFilesFromServer()

  trackingOn: ->
    Helper.addMenuItem "Stop Tracking", "collaby:trackingOff"
    Helper.removeMenuItem "Start Tracking", "collaby:trackingOn"
    @client.startTracking()

  trackingOff: ->
    @events.dispose()
