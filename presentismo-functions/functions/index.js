const functions = require("firebase-functions");
const admin = require('firebase-admin');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

//
exports.getAttendanceLog = functions.https.onRequest((request, response) => {
  functions.logger.info("Fetching AttendanceLog", { structuredData: true });
  admin
    .firestore()
    .collection('AttendanceLog')
    .get()
    .then((data) => {
      let attendanceLog = [];
      data.forEach(doc => {
        attendanceLog.push(doc.data())
      });
      return response.json(attendanceLog)
    })
    .catch(e => functions.logger.error(e))
});

exports.postAttendanceLog = functions.https.onRequest((request, response) => {
  const newLog = {
    rfid: request.body.rfid,
    date: admin.firestore.Timestamp.fromDate(new Date())
  };
  admin
    .firestore()
    .collection('AttendanceLog')
    .add(newLog)
    .then((doc) => {
      response.json({ message: "success" })
    })
    .catch(e => {
      functions.logger.error(e);
      response.status(500).json({ error: 'something went wrong' })
    })
});