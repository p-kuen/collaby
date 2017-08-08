# collaby package

Collaborate with this solid addon.

## How does collaby work?
Collaby is working with socket.io and the internal atom methods.

It is possible to **start a server**.
The server will listen on the port written in the settings (default: 80).

Then it will be possible to **join as a client**.
The client is only able to connect to existing servers. He has to input an ip-address to join.
After successful connection the client has to input a working directory, where all the *server directories will be synced*.

## Syncing functionality
The base is always the server. Every project opened on the server will be synced to the client's working directory.
There are also multiple projects from different directories possible. They will all synced as subdirectories in client's working directory.

**Example:**
*Server projects:*
- Themes (C:/Users/projects/themes)
- Sites (D:/Webdesign/sites)

After syncing with the server, the client will sync all the opened projects.
Example: User's working directory: *C:/Software/Collaboration/*

*Client projects:*
- Themes (C:/Software/Collaboration/Themes)
- Sites (C:/Software/Collaboration/Sites)

## Known issues
At every sync process, collaby checks if
	- File exists on client
	- File size is different
	- Change date of server's file is newer than client file's date

If one of this file is an image or any other binary file, the created file on the client is not readable.
