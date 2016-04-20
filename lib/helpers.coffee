path = require 'path'
{CompositeDisposable} = require 'atom'

module.exports = Helper =

  waitFor: (test, exp, cb) ->
    while (test != exp)
      setTimeout =>
        @waitFor( test, exp, cb )
      , 500
      return
    cb()

  compareFiles: (serverFiles, clientFiles, localPath) ->
    console.log serverFiles
    console.log clientFiles
    console.log localPath
    diffFiles = []
    fs = require 'fs'

    for sName, sFile of serverFiles
      filePath = localPath + "\\" + sName
      if sFile.type is "directory"
        @createFileIfNotExists( {path: filePath}, ->
          clientFiles[sName] = {name: sName, content: {}, type: "directory"}
        )

        diffFiles = diffFiles.concat @compareFiles( serverFiles[sName].content, clientFiles[sName].content, filePath )
      else
        if clientFiles[sName]?
          dC = new Date(clientFiles[sName].stats.ctime)
          dS = new Date(serverFiles[sName].stats.ctime)
          if clientFiles[sName].stats.size != serverFiles[sName].stats.size
            diffFiles.push( {serverFile: sFile, p: localPath} )
          else if dS.getTime() > dC.getTime()
            diffFiles.push( {serverFile: sFile, p: localPath} )
        else
          diffFiles.push( {serverFile: sFile, p: localPath} )

    for cName, cFile of clientFiles
      if !(serverFiles[cName]?)
        filePath = localPath + "\\" + cName
        if cFile.type is "directory"
          @deleteFolderRecursive( cFile, filePath )
        else
          fs.unlinkSync( filePath )

    return diffFiles

  createFileIfNotExists: ({type, path, content}={}, cb) ->
    fs = require 'fs'
    content ?= ""
    try
      fs.statSync path
    catch e
      if type == "file"
        fs.writeFileSync( path, content )
      else
        fs.mkdirSync( path )
      cb()

  deleteFolderRecursive: (file, path) ->
    fs = require 'fs'
    for name, f of file.content
      if f.type is "directory"
        @deleteFolderRecursive(f, path + "/" + name)
      else
        fs.unlinkSync f.path
    fs.rmdirSync(path)

  getBufferOfFile: (filePath) ->

    findBuffer=() =>
      for buf in atom.project.getBuffers()
        if !buf.file or !buf.file.path
          continue;

        if filePath is buf.file.path
          return buf

      return null

    buf = findBuffer()

    if buf != null
      return buf

    # open the file
    atom.workspace.open( filePath, {activateItem: false} )

    # get the buffer
    buf = findBuffer()

    if buf is null
      atom.notifications.addError("File buffer on client could not be found!")
      return null
    else
      return buf

  recFScan: (scanPath) ->
    fs = require 'fs'
    path = require 'path'

    output = {}

    FScan = (curPath) ->
      files = fs.readdirSync curPath
      arr = {}
      for file in files
        filePath = curPath + "\\" + file
        stat = fs.statSync filePath
        if stat.isDirectory()
          arr[file] = {name: file, type: "directory",
          content: FScan filePath}
        else
          #fileContent = fs.readFileSync(filePath, "utf8")
          arr[file] = {name: file, type: "file", stats: stat, path: filePath}
      return arr

    return FScan(scanPath)
