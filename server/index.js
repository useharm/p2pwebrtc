const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);



const PORT = process.env.PORT || 5000;


const start = () => {
    try {
        io.on("connection", (socket) => console.log('socket connected'))
        server.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}


start();