const functions = require("firebase-functions");
const admin = require('firebase-admin');

admin.initializeApp();

const app = require('express')();
const cors = require('cors');
app.use(cors());


const AttendanceLog = admin.firestore().collection('AttendanceLog');
const Users = admin.firestore().collection('Users');
const localeConfig = ["es-AR", { timeZone: "America/Argentina/Tucuman" }];

const lexicSort = (a, b) => {
  if (a.userName === b.userName) {
    return 0;
  }
  return a.userName < b.userName ? -1 : 1;
}

const getResource = (resource, where = [], limit) => {
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
app.get('/helloWorld', (_, res) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase!");
});

//
app.get("/attendanceLog", async (_, res) => {
  functions.logger.info("getAttendanceLog: Start", { structuredData: true });
  const attendanceLog = await getResource(AttendanceLog);
  return res.json(attendanceLog);
});

app.post("/attendanceLog", async (request, res) => {
  functions.logger.info("postAttendanceLog: Start", { structuredData: true });
  const { rfid } = request.body;
  const now = new Date();
  const newLog = {
    rfid: `${rfid}`,
    timeStamp: now,
    dateHash: now.toLocaleDateString(...localeConfig),

  };
  functions.logger.info("postAttendanceLog: fetching user", { structuredData: true });
  // get entry on rfid collection to get who owns it
  const user = await getResource(Users, [{ field: 'rfid', operator: '==', value: `${rfid}` }], 1);

  user.forEach(o => {
    newLog.userName = o.userName;
  })

  functions.logger.info("postAttendanceLog: posting result", { structuredData: true });
  AttendanceLog
    .add(newLog)
    .then(() => {
      res.json({ message: "success", userName: newLog.userName })
    })
    .catch(e => {
      functions.logger.error(e);
      res.status(500).json({ error: 'something went wrong' })
    })
});

app.get("/user", async (_, res) => {
  functions.logger.info("getUsers: Start", { structuredData: true });
  const users = await getResource(Users);
  return res.json(users.sort(lexicSort));
});

app.post("/user", async (req, res) => {
  functions.logger.info("addUser: Start", { structuredData: true });
  const { rfid, userName } = req.body;
  const existingUser = await getResource(Users, [{ field: 'rfid', operator: '==', value: `${rfid}` }], 1);
  if (existingUser.length > 0) {
    return res.status(422).json({ message: "there is already a user with that rfid", existingUser });
  } else {
    Users
      .add({ rfid: `${rfid}`, userName: `${userName}` })
      .then(() => {
        res.status(201).json({ message: "success" })
      })
      .catch(e => {
        functions.logger.error(e);
        res.status(500).json({ error: 'something went wrong' })
      })
  }

})

app.get("/dailyUserTable", async (req, res) => {
  functions.logger.info("getDailyUserTable: Start", { query: req.query }, { structuredData: true });
  const [users, attendance] = await Promise.all(
    [
      getResource(Users),
      getResource(AttendanceLog, [{ field: 'dateHash', operator: '==', value: `${req.query.date}` }])
    ]
  );

  const scanned = {};

  const userTable = users.map(({ rfid, userName }) => {
    const log = attendance.find((log) => log.rfid === rfid);
    if (log) {
      scanned[log.rfid] = true;
    }

    return ({
      userName,
      isPresent: !!log,
      time: log && new Date(log.timeStamp._seconds * 1000).toLocaleTimeString(...localeConfig)
    })
  });


  const unrecognisedRFIDs = attendance.reduce((acc, log) => {
    if (!(acc.some(({ rfid }) => log.rfid === rfid) || log.userName || scanned[log.rfid])) {
      acc.push({ rfid: log.rfid, time: new Date(log.timeStamp._seconds * 1000).toLocaleTimeString(...localeConfig) });
      scanned[log.rfid] = true;
    }
    return acc;
  }, [])

  return res.json({ userTable: userTable.sort(lexicSort), unrecognisedRFIDs });
});


exports.api = functions.https.onRequest(app);