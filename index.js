import { app, server } from "./routes.js";

const port = 4242;
server.listen(port, () => console.log(`Listening on port ${port}...`));
