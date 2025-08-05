const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_PROJECT_ID + ".appspot.com",
  messagingSenderId: FIREBASE_SENDER_ID,
  appId: FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Export the db and core database methods
//export { db, createSessionInAirtable };

function getCETTimestamp() {
  const now = new Date();
  const options = {
    timeZone: 'Europe/Amsterdam', // CET/CEST region
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(now);

  // Compose it as "YYYY-MM-DD HH:mm:ss"
  const getPart = (type) => parts.find(p => p.type === type).value;
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
};

async function createSessionInFirebase(sessionId) {
  const sessionRef = db.ref(`sessions/${sessionId}`);
  await sessionRef.set({
    "Person 1 Joined": "",
    "Person 2 Joined": "",
    "Range 1": "",
    "Range 2": "",
    "Session Id": sessionId,
    "Timestamp": getCETTimestamp()
  });
};

async function fetchSessionFromFirebase(sessionId) {
  const snapshot = await db.ref(`sessions/${sessionId}`).once('value');
  if (!snapshot.exists()) return null;

  return snapshot.val(); // returns the session object directly
};

async function updateSalaryRange(sessionId, rangeValue) {
  const snapshot = await db.ref(`sessions/${sessionId}`).once('value');
  if (!snapshot.exists()) {
    alert("Session not found.");
    return;
  }

  const session = snapshot.val();

  let fieldToUpdate;
  if (!session["Range 1"]) {
    fieldToUpdate = "Range 1";
  } else if (!session["Range 2"]) {
    fieldToUpdate = "Range 2";
  } else {
    alert("Both ranges have already been submitted.");
    return;
  }

  await db.ref(`sessions/${sessionId}/${fieldToUpdate}`).set(rangeValue);
};

async function updatePersonJoined(sessionId, fieldName, joinId) {
  await db.ref(`sessions/${sessionId}/${fieldName}`).set(joinId);
};



