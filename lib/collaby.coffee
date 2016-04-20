global.collaby = {}
CollabyView  = require './collabyView'
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
    'collaby:stop': => @stop()
    @events.add atom.commands.add 'atom-workspace',
    'collaby:trackingOn': => @trackingOn()
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:trackingOff': => @trackingOff()
    @subscriptions.add atom.commands.add 'atom-workspace',
    'collaby:join': => @join()

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

  stop: ->
    @io.close()
    console.log "Server closed."

        # #collaby menu for later usage - manipulating
        # for cat in atom.menu.template
        #   if cat.label == "&Packages"
        #     for pkg in cat.submenu
        #       if pkg.label == "collaby"
        #         console.log "Found!"
        #         console.log pkg
        #         break;
        #
        # atom.menu.update()
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

    )
    ipView.show()

  trackingOn: ->
    @client.startTracking()

  trackingOff: ->
    @events.dispose()
