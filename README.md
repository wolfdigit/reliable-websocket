# `MessageExchange` usage
## `constructor(sockFactory: () => SocketLayer)`
Receive a "socket factory" function as a parameter.
The socket factory function should establish a connection to the server if it's client side, or return the latest connection from client if it's server side.

To make both client and server side have common interface, the developers shoud wrap the websocket with a class which implements `SocketLayer` interface.

### `SocketLayer`
`SocketLayer` should implement `send` method and triggers `onmessage` and `onerror` listeners when needed:
* `send(data: any): void`: The method which sends data through the socket.
* `onmessage: (data: any) => void`: The event handler which receives the data when data arrives from the socket.
* `onerror: (evt: Event) => void`: The event handler which is triggered when errors occur, such as connection lost or no client connected yet.

## `send(data: any)`
Send a message through the MessageExchange framework.
The data can be any JSON serializable object.

## `onReceive: (data: any) => void`
The event handler which receives the data when data arrives from the socket.

# Mechanism
## ack & resend
To cope with the network unstable problem, every message should be acknowledged by the other side, otherwise the message will be resend after a period of time.

Every message is assigned a unique msgId and kept in the `sendBuff` object. Periodically invoke `_resend` method to go through the `sendBuff` object and send out those messages by `_send` method.

The corresponding ACK packet should use the same msgId and send back to the sender. When the sender receives the ACK packet, it should delete the msgId from the `sendBuff` object.



## eliminate repeated messages
Due to the resend mechanism, a message can be sent multiple times. If more than one copies of the same message arrive to the receiver, this framework will keep the msgId and timestamp of the first copy in the `recvTime` object, and ignore the later copies if the msgId is in the `recvTime`. Periodically invoke `_cleanRecvTime` method to clean up the msgId after some amount of time after it is received.

## reconnect
When the socket error is raised, it may be connection lost occurs, and we will try to reconnect. The `_reconnect` sets a timer to re-connect after 3 seconds. If another error occurs during this waiting period, we will check if the previous timer is still kept in `reconnectHandle`, if so, we will ignore this reconnect request and let the previous one to establish the connection.

## heartbeat
The network connection can be cut off if it is idle for too long. So we will send out a heartbeat message every 5 seconds to keep the connection alive.

# Future Improvements
* Consider limiting the number of times a message is resent. And raise an error when it exceeds the limit.