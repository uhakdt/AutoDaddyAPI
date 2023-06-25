import morgan from "morgan";
import rfs from "rotating-file-stream";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pad = (num) => (num > 9 ? "" : "0") + num;

const generator = (time, index) => {
  if (!time) time = new Date();

  const month = pad(time.getMonth() + 1);
  const day = pad(time.getDate());
  const year = time.getFullYear();

  return `${day}-${month}-${year}.log`;
};

const accessLogStream = rfs.createStream(generator, {
  interval: "1d",
  path: path.join(__dirname, "logs"),
  maxSize: "10M",
  maxFiles: 10,
});

morgan.token("datetime", () => {
  const currentDateTime = new Date().toLocaleString();
  return currentDateTime;
});

const logger = morgan("[:datetime] :status :url :method :response-time ms", {
  stream: accessLogStream,
});

export default logger;
