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

const games = {}

io.on("connection", (socket) => {
  console.log("Joueur connecté :", socket.id)

  socket.on("create-game", ({ pseudo }) => {
    const code = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()

    games[code] = {
      joueurs: [
        {
          id: socket.id,
          pseudo,
        },
      ],
    }

    socket.join(code)

    socket.emit("game-created", {
      code,
      joueurs: games[code].joueurs,
    })

    console.log("Partie créée :", code)
  })

  socket.on("join-game", ({ code, pseudo }) => {
    const game = games[code]

    if (!game) {
      socket.emit("error-message", "Partie introuvable")
      return
    }

    game.joueurs.push({
      id: socket.id,
      pseudo,
    })

    socket.join(code)

    io.to(code).emit("players-update", game.joueurs)

    console.log(`${pseudo} a rejoint ${code}`)
  })
})

server.listen(3001, () => {
  console.log("Serveur lancé sur le port 3001")
})