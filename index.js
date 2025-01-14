const express = require("express")
const app = express()
require("dotenv").config()

const Person = require("./models/person")

let persons = []

app.use(express.static("dist"))

const errorHandler = (error, req, res, next) => {
  console.log(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}

const morgan = require("morgan")
const cors = require("cors")

app.use(cors())

morgan.token("body", function (req, res) {
  return JSON.stringify(req.body)
})

app.use(express.json())
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
)

app.get("/api/persons", (req, res) => {
  Person.find({}).then((people) => {
    res.json(people)
  })
})

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.get("/info", (req, res) => {
  Person.find({}).then(people => {
    res.send(`<p>Phonebook has info for ${people.length}</p>
              <p>${new Date()}</p>`)
  })
})

app.post("/api/persons", (req, res, next) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).json({
      error: "name or number missing",
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then((savedPerson) => {
    res.json(savedPerson)
  })
  .catch(error => next(error))
})

app.put("/api/persons/:id", (req, res, next) => {
  const { name, number } = req.body

  Person.findByIdAndUpdate(
    req.params.id,
    { name, number },
    { new: true , runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      res.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
  .then(result => {
    res.status(204).end()
  })
  .catch(error => next(error))
})

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
