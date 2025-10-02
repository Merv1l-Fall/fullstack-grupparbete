// src/server.ts
import express from "express";
import productsRouter from "./routes/products.js";
const port = Number(process.env.PORT) || 3350;
const app = express();
// Middleware
const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};
app.use(logger);
app.use(express.json());
app.use("/api/products", productsRouter);
// Start server
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
//# sourceMappingURL=server.js.map