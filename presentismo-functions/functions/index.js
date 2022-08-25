const functions = require("firebase-functions");
const admin = require('firebase-admin');

admin.initializeApp();

const RFID = admin.firestore().collection('RFID');
const AttendanceLog = admin.firestore().collection('AttendanceLog');

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
  AttendanceLog
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

exports.postAttendanceLog = functions.https.onRequest(async (request, response) => {
  functions.logger.info("postAttendanceLog: start", { structuredData: true });
  const { rfid } = request.body;
  const newLog = {
    rfid,
    date: admin.firestore.Timestamp.fromDate(new Date())
  };
  functions.logger.info("postAttendanceLog: fetching owner", { structuredData: true });
  // get entry on rfid collection to get who owns it
  const ownerRef = await RFID.where('rfid', '==', `${rfid}`).limit(1).get();

  ownerRef.forEach(o => {
    newLog.owner = o.data().owner;
  })

  functions.logger.info("postAttendanceLog: posting result", { structuredData: true });
  AttendanceLog
    .add(newLog)
    .then(() => {
      response.json({ message: "success", owner: newLog.owner })
    })
    .catch(e => {
      functions.logger.error(e);
      response.status(500).json({ error: 'something went wrong' })
    })
});