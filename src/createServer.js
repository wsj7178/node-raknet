'use strict';

var Server = require('./server');

function createServer(options) {
  options = options || {};
  const port = options.port != null ?
    options.port :
    options['server-port'] != null ?
      options['server-port'] :
      19132;

  const host = options.host || '0.0.0.0';
  const customPackets = options.customPackets || {};
  const customTypes = options.customTypes || {};


  const server = new Server(customPackets,customTypes);

  server.name=options.name || "MCPE;A Minecraft server;45 45;0.0.1;0;20";

  server.on("connection", function (client) {
    client.on("open_connection_request_1",(packet) =>
      client.write("open_connection_reply_1",{
        magic:0,
        serverID:[ 339724, -6627871 ],
        serverSecurity:0,
        mtuSize:1492
      }));

    client.on("open_connection_request_2",packet => {
      client.mtuSize=Math.min(Math.abs(packet.mtuSize), 1464);
      client.write("open_connection_reply_2",
        {
          magic: 0,
          serverID: [ 339724, -6627871 ],
          clientAddress: { version: 4, address: client.address, port: client.port },
          mtuSize: packet.mtuSize,
          serverSecurity: 0
        });
    });

    client.on("client_connect",packet => {
      const addresses=[];
      for(let i=0;i<10;i++) addresses.push({ version: 4, address: server.address, port: server.port });
      client.writeEncapsulated("server_handshake",{
        clientAddress:{ version: 4, address: client.address, port: client.port },
        serverSecurity:0,
        systemAddresses:addresses,
        sendPing:[ 0, 73 ],
        sendPong:[ 0, 73 ]
      },{priority:0})
    });

    client.on("client_handshake",packet => {
      client.emit("login");
    });

    client.on("ping",packet => {
      client.writeEncapsulated("pong",{
        "pingID":packet.pingID
      })
    });

    client.on('unconnected_ping', function(packet) {
      client.write('unconnected_pong', {
        pingID: packet.pingID,
        serverID: [ 339724, -6627871 ],
        magic: 0,
        serverName: server.name
      });
    });
  });

  server.listen(port, host);
  return server;
}

module.exports = createServer;