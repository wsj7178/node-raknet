const RakNet = require('../')

const HOST = '127.0.0.1'
const PORT = 9999

describe('Client', () => {
  let client
  let server

  beforeAll(() => {
    return new Promise(function(resolve, reject) {
      // Create the server
      server = RakNet.createServer({
        host: HOST,
        port: PORT
      })

      // Once the server is listening, create the client
      server.socket.once('listening', () => {
        client = RakNet.createClient({
          host: HOST,
          port: PORT
        })

        resolve()
      })
    })
  })

  it('can connect', (done) => {
    client.on('connect', done)
  })
})
