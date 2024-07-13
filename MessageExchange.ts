enum PacketType {
    Message = "message",
    HeartBeat = "heartbeat",
    Ack = "ack"
}

export default class MessageExchange {
    sock: SocketLayer;
    sockFactory: () => SocketLayer;
    onReceive: (data: any) => void
    sendBuff: Record<string, string> = {};  // msgId -> msg (JSON)
    recvTime: Record<string, number> = {};  // msgId -> timestamp
    reconnectHandle?: number;

    constructor(sockFactory: () => SocketLayer) {
        this.sockFactory = sockFactory;

        this.connect();
        setInterval(() => {
            this._resend();
        }, 1000);

        setInterval(() => {
            this._cleanRecvTime();
        }, 1000);

        setInterval(() => {
            const heartbeatPacket = {
                msgId: "0",
                type: PacketType.HeartBeat,
            };
            if (this.sock) {
                this.sock.send(JSON.stringify(heartbeatPacket));
            }
            else {
                this._reconnect();
            }
        }, 5000);
    }

    connect() {
        console.log("reconnecting...");
        const newSock = this.sockFactory();
        if (!newSock) {
            return;
        }

        this.sock = newSock;
        this.sock.onerror = (evt) => {
            console.debug("Error", evt);
            this._reconnect();
        };
        this.sock.onmessage = (data) => {
            this._receive(data);
        }
    }

    _reconnect() {
        if (this.reconnectHandle===undefined) {
            this.reconnectHandle = setTimeout(() => {
                if (this.reconnectHandle) {
                    clearTimeout(this.reconnectHandle);
                    this.reconnectHandle = undefined;
                }
                this.connect();
            }, 3000);
        }
    }

    send(data: any) {
        const msgId = Math.random().toString(36).substring(2);

        const packet = {
            msgId: msgId,
            type: PacketType.Message,
            data: data
        };
        this.sendBuff[msgId] = JSON.stringify(packet);

        this._send(msgId);
    }

    _send(msgId: string) {
        if (this.sock) {
            this.sock.send(this.sendBuff[msgId]);
        }
        else {
            this._reconnect();
        }
    }

    _resend() {
        // console.debug("resend size: ", Object.keys(this.sendBuff).length);
        for (const msgId in this.sendBuff) {
            this._send(msgId);
        }
    }

    _cleanRecvTime() {
        // console.debug("recvTime size: ", Object.keys(this.recvTime).length);
        const now = Date.now();
        for (const msgId in this.recvTime) {
            if (now - this.recvTime[msgId] > 5000) {
                delete this.recvTime[msgId];
            }
        }
    }

    _receive(pckStr: any) {
        // console.debug("sock received: ", pckStr);
        try {
            const packet = JSON.parse(pckStr);
            const msgId = packet.msgId;
            const pckType = packet.type;
            if (pckType===PacketType.Ack) {
                if (this.sendBuff[msgId]) {
                    delete this.sendBuff[msgId];
                }
                return;
            } else if (pckType===PacketType.Message) {
                const ackPacket = {
                    msgId: msgId,
                    type: PacketType.Ack,
                };
                // response ack only once
                this.sock?.send(JSON.stringify(ackPacket));

                if (this.onReceive) {
                    if (!(msgId in this.recvTime)) {
                        this.recvTime[msgId] = Date.now();
                        this.onReceive(packet.data);
                    }
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
}

export class SocketLayer {
    onmessage: (data: any) => void;
    onerror: (evt: Event) => void;
    send: (data: any) => void;
}