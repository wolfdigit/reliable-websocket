const WebSocketServer = require('ws').WebSocketServer;
const MessageExchange = require('../MessageExchange.js').default;
const SocketLayer = require('../MessageExchange.js').SocketLayer;

class Server extends SocketLayer {
  sock;

  constructor(ws) {
    super();
    this.sock = ws;
    this.sock.on('error', (evt) => {
      if (this.onerror) {
        this.onerror(evt);
      }
    });

    this.sock.on('message', (data) => {
      if (this.onmessage) {
        this.onmessage(data);
      }
    });
  }

  send(data) {
    this.sock.send(data, { binary: false }, (err) => {
      if (err && this.onerror) {
        this.onerror(err);
      }
    });
    return;
  }
}

let latestConnection = null;
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
  const sock = new Server(ws);
  latestConnection = sock;
  console.log("new connection");
});

const messageExchange = new MessageExchange(() => latestConnection);
messageExchange.onReceive = (data) => {
  console.log("received: ", data);
}

function loop() {
  const msg = {
    event: "non-scan",
    time: new Date().toLocaleString(),
  };
  console.log("sending: ", msg);
  messageExchange.send(msg);

  const rndTimeGap = Math.random() * 5000;
  setTimeout(loop, rndTimeGap);
}
loop();