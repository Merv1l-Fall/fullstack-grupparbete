import express from 'express'
import type { Express, Request, RequestHandler, Response } from 'express'
import userRouter from './routes/users.js'


const port: number = Number(process.env.PORT)
const app: Express = express()


// Middleware
const logger: RequestHandler = (req, res, next) => {
	console.log(`${req.method}  ${req.url}`)
	next()
}
app.use('/', logger)
app.use('/', express.json())

// Resurser (routermoduler med endpoints)
app.use('/user', userRouter)



// Endpoints





// Starta servern
app.listen(port, () => {
	console.log('Server listening on port ' + port)
})