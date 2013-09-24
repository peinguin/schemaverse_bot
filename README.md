schemaverse_bot
===============

Bot for popular PostgreSQL based online mmorpg.

To start
--------

> npm install

Rename config.example.js to config.js.
Set username/password.
type "node main.js"

Console commands
----------------

You can type commands in console. For example "planets" - to view planets or "ships.count" to view your ships count.
Type "help" to list all commands.

HTML GUI for visualization
--------------------------

There is only map yet. Type "map" in console to view it.
circle - planet
square - ship
Ships near own planets are not displayed.
Map autoupdates after each tic.