import express from 'express';
const port = Number(process.env.PORT) || 3350;
const app = express();
// Middleware
const logger = (req, res, next) => {
    console.log(`${req.method}  ${req.url}`);
    next();
};
app.use('/', logger);
app.use('/', express.json());
// Resurser (routermoduler med endpoints)
// Endpoints
// Starta servern
app.listen(port, () => {
    console.log('Server listening on port ' + port);
});
//# sourceMappingURL=server.js.map