const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ACTIONS = require('../client/src/socket/actions');
const uuid = require('uuid');



const PORT = process.env.PORT || 5000;

function getClientRooms() {
    const { rooms } = io.sockets.adapter;
    return Array.from(rooms.keys()).filter(roomID => uuid.validate(roomID) && uuid.version(roomID) === 4);
}

function shareRooms() {
    io.emit(ACTIONS.SHARE_ROOMS, {
        rooms: getClientRooms(),
    })
}

const start = () => {
    try {
        io.on("connection", (socket) => {
            shareRooms();
            socket.on(ACTIONS.JOIN, (config) => {
                const { room: roomID } = config;
                const { rooms: joinedRooms } = socket;
                if (Array.from(joinedRooms).includes(roomID)) {
                    return console.warn('Вы уже присоединены к этой комнате')
                }
                Array.from(io.sockets.adapter.rooms.get(roomID) || []).forEach(clientID => {
                    io.to(clientID).emit(ACTIONS.ADD_PEER, {
                        peerID: socket.id,
                        createOffer: false,
                    });
                    socket.emit(ACTIONS.ADD_PEER, {
                        peerID: clientID,
                        createOffer: true,
                    })
                })
                socket.join(roomID);
                shareRooms();
            })
        })

        function leaveRoom(socket) {
            const { rooms: joinedRooms } = socket;
            Array.from(joinedRooms).forEach(roomID => {
                io.sockets.adapter.rooms.get(roomID).forEach(clientID => {
                    io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                        peerID: socket.id
                    })
                    socket.emit(ACTIONS.REMOVE_PEER, {
                        peerID: clientID
                    })
                })
                socket.leave(roomID);
            })
            shareRooms();
        }



        io.on(ACTIONS.LEAVE, leaveRoom);
        io.on("disconnection", leaveRoom);
        server.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}


start();