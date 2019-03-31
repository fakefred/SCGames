const gridElem = document.querySelector('#grid');
const gridContainer = document.querySelector('#grid-container');
const screenWidth = window.innerWidth;
gridContainer.style += ` left: ${(window.innerWidth - 368) / 2};`;

function resetGrid() {
    let html = '';
    for (let y = 0; y < 8; y++) {
        html += '<tr class="row">';
        for (let x = 0; x < 8; x++) {
            html += `<td><button class="btn btn-warning block" onclick="editBlock(${y}, ${x})"></button></td>`;
        }
        html += '</tr>';
    }
    gridElem.innerHTML = html;
}

resetGrid();

function setGrid(grid) {
    const flatGrid = grid.flat();
    for (let n = 0; n < flatGrid.length; n++) {
        document.getElementsByClassName('block')[n].innerHTML = flatGrid[n];
    }
}

const socket = io('/');

socket.on('err', data => {
    alert(data.msg);
});

let name = 'user';

function submitName() {
    name = document.querySelector('#player-id').value;
    socket.emit('join', { name });
}

socket.on('identified', data => {
    document.querySelector('#welcome').hidden = true;
});

function updatePlayerList(players) {
    let html = '';
    players.forEach(player => {
        html += `<li id="player-${player}" class="list-group-item">${player}</li>`;
    });
    document.querySelector('#players').innerHTML = html;
}

socket.on('init', data => {
    updatePlayerList(data.players);
    setGrid(data.grid);
});

socket.on('player-list', data => {
    updatePlayerList(data.players);
});

let editing = {};

function editBlock(y, x) {
    editing = { y, x };
    document.querySelector(
        '#char-input'
    ).value = document.getElementsByClassName('block')[8 * y + x].innerHTML;
}

function setBlock(y, x, char) {
    document.getElementsByClassName('block')[8 * y + x].innerHTML = char || '';
}

function submitChar() {
    const char = document.querySelector('#char-input').value;
    if (char !== '' && editing !== {}) {
        socket.emit('setchar', {
            y: editing.y,
            x: editing.x,
            char,
            player: name
        });
        setBlock(editing.y, editing.x, char);
        editing = {};
    }
}

function clearBlock() {
    if (editing !== {}) {
        socket.emit('clearblock', {
            y: editing.y,
            x: editing.x,
            player: name
        });
        setBlock(editing.y, editing.x, '');
        editing = {};
    }
}

socket.on('setchar', data => {
    setBlock(data.y, data.x, data.char);
    const playerElem = document.querySelector(`#player-${data.player}`);
    playerElem.classList.add('active');
    setTimeout(() => {
        playerElem.classList.remove('active');
    }, 200);
});
