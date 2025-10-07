// src/server.ts
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.js";
import userRouter from "./routes/users.js";
const port = Number(process.env.PORT) || 3350;
const app = express();
// Middleware
const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};
app.use(logger);
app.use(cors());
app.use(express.json());
app.use("/api/products", productsRouter);
app.use("/users", userRouter);
// Start server
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
//# sourceMappingURL=server.js.map