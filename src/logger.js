import morgan from "morgan";
import rfs from "rotating-file-stream";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generator = (time) => {
  if (!time) time = new Date();
  return `${time.getDate()}-${(time.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${time.getFullYear()}.log`;
};

const accessLogStream = rfs.createStream(generator, {
  interval: "1d",
  path: path.join(__dirname, "../logs"),
  maxSize: "10M",
  maxFiles: 10,
});

morgan.token("datetime", () => new Date().toLocaleString());

const logger = morgan("[:datetime] :status :url :method :response-time ms", {
  stream: accessLogStream,
});

export default logger;
