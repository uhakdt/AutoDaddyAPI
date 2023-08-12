import { app, server } from "./src/routes.js";

const port = 4242;
server.listen(port, () => console.log(`Listening on port ${port}...`));
