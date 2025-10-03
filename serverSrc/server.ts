// src/server.ts
import express from "express";
import cors from "cors";
import type { Express, RequestHandler } from "express";
import cors from "cors"

import productsRouter from "./routes/products.js";
import cartRouter from "./routes/cart.js"

const port: number = Number(process.env.PORT) || 3350;
const app: Express = express();

// Middleware
const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};


app.use(logger);
app.use(cors())
app.use(express.json());

app.use("/api/products", productsRouter);

app.use("/cart", cartRouter)
app.use("/users", userRouter);


// Start server
app.listen(port, () => {
  console.log("Server listening on port " + port);
});
