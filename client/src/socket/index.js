import { io } from 'socket.io-client';


const options = {
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
}

const socket = io('http://localhost:5000', options);

export default socket;