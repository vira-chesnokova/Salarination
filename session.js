const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");

document.getElementById("sessionIdTag").textContent = `Session ID: ${sessionId}`;

const sessionIdFromUrl = new URLSearchParams(window.location.search).get("sessionId");
if (sessionIdFromUrl) {
  determineAndRedirectRole(sessionIdFromUrl);
  showReveailRange(sessionIdFromUrl);
} 

function copyLink() {
  const link = `${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert(`Link copied to the clipboard`);
  });
}

async function submitRange() {
  const sessionId = new URLSearchParams(window.location.search).get("sessionId");
  const range = document.getElementById("salaryInput").value.trim();
  if (!range) {
    alert("Please enter a salary range.");
    return;
  }

  const record = await fetchSessionFromFirebase(sessionId);
  if (!record) {
    alert("Session not found.");
    return;
  }

  await updateSalaryRange(sessionId, range);
  markRangeSubmitted(sessionId);

  // Update the UI
  document.getElementById("submitHere").classList.add("hidden");
  document.getElementById("statusSelf").textContent = `✅ Your range: ${range}`;
  document.getElementById("statusOther").textContent = `Waiting for other person...`;

  db.ref(`sessions/${sessionId}`).on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const count = (data["Range 1"] ? 1 : 0) + (data["Range 2"] ? 1 : 0);

    if (count === 2) {
      showReveailRange(sessionId);

      // Stop listening to prevent duplicate UI updates
      db.ref(`sessions/${sessionId}`).off();
    }
  });
}

async function showReveailRange(sessionId) {
  const record = await fetchSessionFromFirebase(sessionId);
  if (!record) return;

  let count = 0;
  if (record["Range 1"]) count++;
  if (record["Range 2"]) count++;

  if (count === 2) {
    const joinId = getOrCreateLocalJoinId();

  if (record["Person 1 Joined"] !== joinId && record["Person 2 Joined"] !== joinId) {
    return;
  }

    document.getElementById("revealRange").classList.remove("hidden");

    document.getElementById("statusOther").classList.add("hidden");
    console.log("✅ Ready to reveal");

    document.getElementById("range1").textContent = record["Range 1"];
    document.getElementById("range2").textContent = record["Range 2"];
  }
}


function hasSubmittedRange(sessionId) {
  const submittedMap = JSON.parse(localStorage.getItem("rangeSubmissions") || "{}");
  return submittedMap[sessionId] === true;
}

function markRangeSubmitted(sessionId) {
  const submittedMap = JSON.parse(localStorage.getItem("rangeSubmissions") || "{}");
  submittedMap[sessionId] = true;
  localStorage.setItem("rangeSubmissions", JSON.stringify(submittedMap));
}

async function determineAndRedirectRole(sessionId) {
  const record = await fetchSessionFromFirebase(sessionId);
  if (!record) {
    alert("Session not found.");
    return;
  }

  if (hasSubmittedRange(sessionId)) {
    return;
  }

  const joinId = getOrCreateLocalJoinId();

  if (record["Person 1 Joined"] === joinId || record["Person 2 Joined"] === joinId) {
    // Already joined — show UI
    document.getElementById('negotioation').classList.remove("hidden");
    return;
  } 

  if (!record["Person 1 Joined"]) {
    updatePersonJoined(sessionId, "Person 1 Joined", joinId);
    document.getElementById('negotioation').classList.remove("hidden");
    return;
  } else if (!record["Person 2 Joined"]) {
    updatePersonJoined(sessionId, "Person 2 Joined", joinId);
    document.getElementById('negotioation').classList.remove("hidden");
    return;
  } else {
    alert("Both roles already taken.");
    return;
  }
  
}

function getOrCreateLocalJoinId() {
  let joinId = localStorage.getItem("joinId");
  if (!joinId) {
    joinId = crypto.randomUUID(); // generates a UUID v4
    localStorage.setItem("joinId", joinId);
  }
  return joinId;
}

async function updateJoinedCount(sessionId) {
  const record = await fetchSessionFromFirebase(sessionId);
  if (!record) return;

  const fields = record;
  let count = 0;
  if (fields["Person 1 Joined"]) count++;
  if (fields["Person 2 Joined"]) count++;

  document.getElementById("joinedCount").textContent = `${count}/2 joined`;
};

function openIndex() {
  window.location.href = "https://blueviolet-rail-310845.hostingersite.com/index.html";
};

// Real-time listener for joined counter
db.ref(`sessions/${sessionIdFromUrl}`).on('value', (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const count = (data["Person 1 Joined"] ? 1 : 0) + (data["Person 2 Joined"] ? 1 : 0);
  document.getElementById("joinedCount").textContent = `${count}/2 joined${count === 2 ? " ✅" : ""}`;

  if (count === 2) {
    db.ref(`sessions/${sessionIdFromUrl}`).off(); // stop listening when complete
    console.log("✅ Both joined. Stopped listening.");
  }
});
