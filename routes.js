import app from "./express.js";

import dvlaRoutes from "./routes/dvlaRoutes.js";
import oneAutoApiRoutes from "./routes/oneAutoApiRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import paypalRoutes from "./routes/paypalRoutes.js";
import firebaseRoutes from "./routes/firebaseRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";

app.get("/api/v1", (req, res) => {
  console.log("ﷺ ﷽");
  res.send("ﷺ ﷽");
});

app.use("/api/v1/dvla", dvlaRoutes);
app.use("/api/v1/oneautoapi", oneAutoApiRoutes);
app.use("/api/v1/stripe", stripeRoutes);
app.use("/api/v1/paypal", paypalRoutes);
app.use("/api/v1/firebase", firebaseRoutes);
app.use("/api/v1/email", emailRoutes);

export default app;
