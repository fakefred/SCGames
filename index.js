const express = require('express');
const app = express();
const http = require('http').Server(app);
app.use(express.static(__dirname + '/static'));

const io = require('socket.io')(http);

const config = require('./config.json');

let players = new Set();
let grid = [];

function setToArray(set) {
    let array = [];
    set.forEach(item => {
        array.push(item);
    });
    return array;
}

for (let y = 0; y < 8; y++) {
    grid[y] = [];
    for (let x = 0; x < 8; x++) {
        grid[y][x] = '';
    }
}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/static/grid.html');
});

io.on('connection', socket => {
    let player = '';

    socket.on('join', data => {
        if (players.size < config['max-players']) {
            if (!players.has(data.name)) {
                player = data.name;
                players.add(player);
                socket.emit('identified', { name: player });
                socket.broadcast.emit('player-list', {
                    players: setToArray(players)
                });
                socket.emit('init', {
                    players: setToArray(players),
                    grid
                });
            } else {
                socket.emit('err', { msg: 'This user name already exists' });
            }
        } else {
            socket.emit('err', { msg: 'This room is full' });
        }
    });

    socket.on('setchar', data => {
        if (typeof data.y === 'number' && typeof data.x === 'number') {
            console.log(data);
            grid[data.y][data.x] = data.char;
            socket.broadcast.emit('setchar', data);
        }
    });

    socket.on('clearblock', data => {
        if (typeof data.y === 'number' && typeof data.x === 'number') {
            console.log(data);
            grid[data.y][data.x] = '';
            socket.broadcast.emit('setchar', data);
        }
    })

    socket.on('disconnect', () => {
        if (players.has(player)) {
            players.delete(player);
        }
        socket.broadcast.emit('player-list', { players: setToArray(players) });
    });
});

http.listen(1937);
