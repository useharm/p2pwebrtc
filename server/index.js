const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);



const PORT = process.env.PORT || 5000;


const start = () => {
    try {
        server.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}


start();