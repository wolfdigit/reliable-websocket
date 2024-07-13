import MessageExchange, { SocketLayer } from '../MessageExchange'

class Client extends SocketLayer {
  sock;

  constructor(url) {
      super();
      this.sock = new WebSocket(url);
      this.sock.onopen = (evt) => {
        console.log("connected");
      }
      this.sock.onclose = (evt) => {
        console.log("closed");
      }
      this.sock.onmessage = ({ data }) => {
          if (this.onmessage) {
              this.onmessage(data);
          }
      }
      this.sock.onerror = (evt) => {
          if (this.onerror) {
              this.onerror(evt);
          }
      }
  }

  send(data) {
    try {
      return this.sock.send(data);
    }
    catch (err) {
      if (this.onerror) {
        this.onerror(err);
      }
    }
  }

  close() {
    return this.sock.close();
  }
}

document.getElementById('recvText').value = '';
const messageExchange = new MessageExchange(() => new Client('ws://localhost:8080/'));
messageExchange.onReceive = (data) => {
  document.getElementById('recvText').value += JSON.stringify(data) + '\n';
};

document.getElementById('sendBtn').addEventListener('click', () => {
  const value = document.getElementById('sendText').value;
  const data = {
    barcode: value,
    time: new Date().toLocaleString(),
  };
  console.log("sending: ", data);
  messageExchange.send(data);
});