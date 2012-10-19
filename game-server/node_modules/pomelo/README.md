## pomelo - a Short Description

Fast, scalable game server framework for  [node](http://nodejs.org).
Pomelo provides a full stack of game(especially MMO) server development infrastructure, including framework, libraries and tools.

  * Homepage: http://nodejs.netease.com/pomelo
  * Mailing list: http://groups.google.com/group/pomelo
  * Documentation: http://node.js.netease.com/pomelo/doc
  * go to [main site](http://nodejs.netease.com/pomelo) for more information
  * Wiki: http://github.com/node-pomelo/pomelo/wiki
  * Issues: http://github.com/node-pomelo/pomelo/issues
  * Tags: node.js, game, pomelo

## Viewing demos

 * Visit the [online demo game](http://nodejs.netease.com/lordofpomelo)
 * or you can visit [demo game github](http://github.com/node-pomelo/lordofpomelo)to get the source code and install it on your local machine.

## Features

  * Built on [socket.io] (https://github.com/LearnBoost/socket.io.git)
  * Scalable multi-process architecture, area based partition
  * Easy to scale and extend servers, almost zero config for adding new type of servers
  * Easy client server communication, zero config for client server request and response with websocket
  * Easy channel management and api for broadcasting, multicasting
  * Simple rpc framework for communication between multiple servers, zero config
  * Focus on scalability and high performance,  proved handling more than 2000 online users each area, with real world MMO logic, each request less than 200ms.
  * Full stack of libraries for MMO game development, including ai, aoi(area of interest), scheduler, data-sync, etc.
  * Admin console for managing servers, online users and performance profiler etc.

## Installation
  $ npm install -g pomelo

## QuickStart

The quickest way to get started with pomelo is to utilize the executable `pomelo` to generate an application as shown below:

 Create the app:

  $ npm install -g pomelo
  $ pomelo init /tmp/foo && cd /tmp/foo

 Install dependencies:

  $ npm install -d

 Start the servers:

  $ pomelo start

 Stop the servers:

  $ pomelo stop



## License

(The MIT License)

Copyright (c) 2012 Netease, Inc. and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
