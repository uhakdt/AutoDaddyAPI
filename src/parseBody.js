import bodyParser from "body-parser";

const parseBody = (req, res, next) => {
  bodyParser.urlencoded({ extended: false })(req, res, () => {
    bodyParser.json({
      verify: (req, _, buf) => {
        try {
          JSON.parse(buf.toString());
          req.rawBody = buf.toString();
        } catch (e) {
          console.error(`Invalid JSON: ${buf.toString()}`);
        }
      },
    })(req, res, next);
  });
};

export default parseBody;
