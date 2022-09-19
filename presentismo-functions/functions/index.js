const functions = require("firebase-functions");
const admin = require('firebase-admin');

admin.initializeApp();

const RFID = admin.firestore().collection('RFID');
const AttendanceLog = admin.firestore().collection('AttendanceLog');
const Users = admin.firestore().collection('Users');

const getResource = (resource, where = []) => {
  functions.logger.info("getResource: Start", { structuredData: true });
  var ref = resource;
  where.forEach(({ field, operator, value }) => {
    ref = ref.where(field, operator, value);
  });
  functions.logger.info("getResource: finished parsing query", { structuredData: true });

  return ref
    .get()
    .then((data) => {
      let collection = [];
      data.forEach(doc => {
        collection.push(doc.data());
      });
      return collection;
    })
    .catch(e => functions.logger.error(e));
}


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((_, res) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase!");
});

//
exports.getAttendanceLog = functions.https.onRequest(async (_, res) => {
  functions.logger.info("getAttendanceLog: Start", { structuredData: true });
  const attendanceLog = await getResource(AttendanceLog);
  return res.json(attendanceLog);
});

exports.postAttendanceLog = functions.https.onRequest(async (request, res) => {
  functions.logger.info("postAttendanceLog: Start", { structuredData: true });
  const { rfid } = request.body;
  const now = new Date();
  const newLog = {
    rfid,
    timeStamp: now,
    dateHash: now.toISOString().split('T')[0],

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
      res.json({ message: "success", owner: newLog.owner })
    })
    .catch(e => {
      functions.logger.error(e);
      res.status(500).json({ error: 'something went wrong' })
    })
});

exports.getUsers = functions.https.onRequest(async (_, res) => {
  functions.logger.info("getUsers: Start", { structuredData: true });
  const users = await getResource(Users);
  return res.json(users);
});

exports.getDailyUserTable = functions.https.onRequest(async (req, res) => {
  functions.logger.info("getDailyUserTable: Start", { query: req.query }, { structuredData: true });
  const [users, attendance] = await Promise.all(
    [
      getResource(Users),
      getResource(AttendanceLog, [{ field: 'dateHash', operator: '==', value: `${req.query.date}` }])
    ]
  );

  const userTable = users.map(({ userName }) => {
    const log = attendance.find(({ owner }) => owner === userName);
    return ({
      userName,
      isPresent: !!log,
      time: log && new Date(log.timeStamp._seconds * 1000).toTimeString().split(' ')[0]
    })
  })

  return res.json({ userTable });
});