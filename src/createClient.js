'use strict';

const dgram=require("dgram");
const dns = require('dns');
const Client = require('./client');
const assert = require('assert');

module.exports = createClient;


function createClient(options) {
  assert.ok(options, "options is required");
  const port = options.port || 19132;
  const host = options.host || 'localhost';
  const password = options.password;
  const customPackets = options.customPackets || {};
  const customTypes = options.customTypes || {};
  const username = options.username || "echo";

  const client = new Client(port,host,customPackets,customTypes);
  const socket=dgram.createSocket({type: 'udp4'});
  socket.bind();
  socket.on('message',(data,rinfo) => {
    client.address=rinfo.address;
  });
  socket.on("message",(data) => {
    client.handleMessage(data);
  });
  socket.on("listening",() => {
    client.emit("connect");
  });

  client.setSocket(socket);

  client.on("connect",onConnect);
  client.username = username;

  function onConnect() {
    client.write('open_connection_request_1', {
      magic:0,
      protocol:6,
      mtuSize:new Buffer(1446).fill(0)
    });

    client.on('open_connection_reply_1', packet => {
      client.mtuSize=packet.mtuSize;
      client.write('open_connection_request_2', {
        magic:0,
        serverAddress:{ version: 4, address: client.address, port: client.port },
        mtuSize:packet.mtuSize,
        clientID:[ 339724, -6627870 ]
      });
    });

    client.on('open_connection_reply_2',() => {
      client.writeEncapsulated('client_connect',{
        "clientID":[339844,-1917040252],
        "sendPing":[0,43],
        "useSecurity":0,
        "password":new Buffer(password || 0)
      },{reliability:2});
    });

    client.on('server_handshake',() => {
      client.writeEncapsulated('client_handshake',{
        serverAddress:{ version: 4, address: client.address, port: client.port },
        systemAddresses:[
          { version: 4, address: client.socket.address().address, port: client.socket.address().port }
        ]
      });
      client.emit("login");
    })
  }

  return client;
}