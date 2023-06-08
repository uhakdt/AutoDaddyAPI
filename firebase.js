const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env["FIREBASE_PROJECT_ID"],
    clientEmail: process.env["FIREBASE_CLIENT_EMAIL"],
    privateKey: process.env["FIREBASE_PRIVATE_KEY"].replace(/\\n/g, "\n"),
  }),
  storageBucket: "autodaddy.appspot.com",
});

const db = admin.firestore();
const storage = admin.storage();

module.exports = {
  db,
  storage,
};
