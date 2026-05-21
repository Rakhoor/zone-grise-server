const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

const rooms = {}

function genererCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

io.on("connection", (socket) => {
  console.log("Joueur connecté :", socket.id)

  socket.on("create_room", (pseudo, callback) => {
    const code = genererCode()

    rooms[code] = {
      joueurs: [
        {
          id: socket.id,
          pseudo,
        },
      ],
    }

    socket.join(code)

    callback(code)

    io.to(code).emit("room_update", rooms[code])
  })

  socket.on("join_room", ({ code, pseudo }, callback) => {
    const room = rooms[code]

    if (!room) {
      callback({
        success: false,
      })
      return
    }

    room.joueurs.push({
      id: socket.id,
      pseudo,
    })

    socket.join(code)

    callback({
      success: true,
    })

    io.to(code).emit("room_update", room)
  })

  socket.on("disconnect", () => {
    console.log("Joueur déconnecté :", socket.id)

    Object.keys(rooms).forEach((code) => {
      rooms[code].joueurs =
        rooms[code].joueurs.filter(
          (j) => j.id !== socket.id
        )

      io.to(code).emit(
        "room_update",
        rooms[code]
      )
    })
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})