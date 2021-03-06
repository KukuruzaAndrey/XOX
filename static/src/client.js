/* global requestAnimationFrame */
import {
  addX,
  addO,
  stats,
  rayCaster,
  mouse,
  camera,
  placeX,
  placeO,
  renderer,
  scene,
  init,
  animateWin,
  // animateStart,
  startBtn,
  view,
  restart
} from './3D.js'
import { SmartWS } from './smartWS.js'

// let animateS
const plane = init()
view.init()
const board = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
]
const first = 'x'
const second = 'o'
let playerOrder = first

let sock = null
const drawMy = order => order === first ? addX : addO
const drawOpp = order => order === second ? addX : addO
const place = order => order === first ? placeX : placeO
let isClick = false
let gameOver = false
let canMove = false
window.addEventListener('mouseup', () => {
  console.log('mouseup')
  isClick = false
}, false)
// window.addEventListener('mousedown', () => {
//   console.log('mousedown')
//   isClick = true
// }, false)
window.addEventListener('touchend', () => {
  console.log('touchend')
  isClick = false
}, false)
window.addEventListener('click', () => {
  console.log('click')
  isClick = true
}, false)
const animate = () => {
  requestAnimationFrame(animate)
  stats.update()
  // logDebug(`${mouse.x} ${mouse.y}`)
  view.update(mouse)
  rayCaster.setFromCamera(mouse, camera)
  if (playerOrder && !gameOver) {
    const children = startBtn ? startBtn.children.map(ch => ch.children[0]) : []
    const intersects = rayCaster.intersectObjects([plane, ...children]) // : rayCaster.intersectObjects([plane])
    if (intersects.length === 1) {
      const [{ point, object }] = intersects
      if (object.name.startsWith('startBtn')) {
        // change color on hover
        if (!startBtn.animateHover.isActive()) startBtn.animateHover.play()

        // animate start
        if (!object.animation.isActive()) object.animation.restart()

        document.body.style.cursor = 'pointer'
        if (isClick) {
          // start game
          console.log('start')
          isClick = false
          view.start()
          sock = connect()
        }
      } else if (Math.abs(point.x) < 10 && Math.abs(point.z) < 10) {
        // show placeholder for move
        const cellX = convertGlobalToCell(point.x)
        const cellY = convertGlobalToCell(point.z)
        const p = place(playerOrder)
        if (p && board[cellX][cellY] === '') {
          p.position.x = 6 * (cellX - 1)
          p.position.z = 6 * (cellY - 1)
        }
        // player move
        if (isClick && canMove && board[cellX][cellY] === '') {
          move(cellX, cellY, sock)
          isClick = false
        }
      } else {
        // hide placeholder
        const p = place(playerOrder)
        p.position.x = -100
        p.position.z = -100
      }
    } else {
      document.body.style.cursor = 'default'

      if (!startBtn.animateHover.reversed()) {
        startBtn.animateHover.reverse()
      }
    }
  }
  renderer.render(scene, camera)
  isClick = false
}

// document.querySelector('#replay').addEventListener('click', e => {
//   sock.emit('replay')
// })

const connect = () => {
// eslint-disable-next-line no-undef
  const sock = new SmartWS(location.origin.replace(/^http/, 'ws'))
  // sock.addEventListener('open', () => {
  //   console.log('open')
  // })
  // sock.on('rooms', rooms => renderRooms(rooms))

  sock.on('message', text => setMessage('message', text))

  sock.on('countOnline', number => setMessage('countOnline', number))

  sock.on('start', order => {
    playerOrder = order
    if (playerOrder === first) {
      canMove = true
      setMessage('message', 'Let the game begin!Your turn!')
    } else if (playerOrder === second) {
      canMove = false
      setMessage('message', 'Let the game begin!Opponent turn!')
    }
  })

  sock.on('move', cmd => {
    const [x, y] = cmd.split('')
    board[x][y] = playerOrder === first ? second : first
    drawOpp(playerOrder)(x, y)
    canMove = true
    setMessage('message', 'Your turn!')
  })

  sock.on('restart', order => {
    console.log('restart')
    restart()
    playerOrder = order
    if (playerOrder === first) {
      canMove = true
      setMessage('message', 'New game begin!Your turn!')
    } else if (playerOrder === second) {
      canMove = false
      setMessage('message', 'New game begin!Opponent turn!')
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[i][j] = ''
      }
    }
  })

  sock.on('status', ({ status, combination, winner }) => {
    switch (status) {
      case 'continue':
        return
      case 'draw':
        setMessage('message', 'You lose! Same as your opponent')
        break
      case 'victory':
        if (winner === playerOrder) {
          setMessage('message', 'You win! Congratulation!')
        } else {
          setMessage('message', 'You lose! Maybe next time...')
        }
        gameOver = true
        animateWin(combination)
    }
  })

  sock.on('score', score => {
    const [you, op] = score.split(',')
    setMessage('score', `Score - You:${you}; Opponent:${op}`)
  })

  return sock
}

const move = (x, y, sock) => {
  // if (!canMove || board[x][y] !== '') return
  board[x][y] = playerOrder
  sock.emit('move', `${x}${y}`)
  drawMy(playerOrder)(x, y)
  canMove = false
  setMessage('message', 'Opponent turn!')
}
const setMessage = (id, message) => {
  document.querySelector(`#${id}`).innerHTML = message
}
// const logDebug = log => setMessage('debug', log)

const convertGlobalToCell = x => Math.min(Math.floor(Math.abs(x / 3)), 1) * Math.sign(x) + 1

// const renderRooms = (rooms) => {
//   rooms.forEach(room => {
//     const div = document.createElement('div')
//     const p = document.createElement('p')
//     // 👨‍💻
//     const text = document.createTextNode(`[${'👩‍💻'.repeat(room)}]`)
//     p.appendChild(text)
//     div.appendChild(p)
//     if (room === 1) {
//       const but = document.createElement('button')
//       const text = document.createTextNode('join')
//       but.appendChild(text)
//       but.addEventListener('click', e => {
//         sock.emit('joinRoom', '0')
//       })
//       div.appendChild(but)
//     }
//     document.querySelector('#rooms').appendChild(div)
//   })
// }
animate()
