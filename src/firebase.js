import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env["FIREBASE_PROJECT_ID"],
    clientEmail: process.env["FIREBASE_CLIENT_EMAIL"],
    privateKey: process.env["FIREBASE_PRIVATE_KEY"].replace(/\\n/g, "\n"),
  }),
  storageBucket: "autodaddy.appspot.com",
});

const db = admin.firestore();

db.settings({
  ignoreUndefinedProperties: true
});

const storage = admin.storage();

export { db, storage };
