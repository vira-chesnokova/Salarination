const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");

document.getElementById("sessionIdTag").textContent = `Session ID: ${sessionId}`;

const sessionIdFromUrl = new URLSearchParams(window.location.search).get("sessionId");
if (sessionIdFromUrl) {
  determineAndRedirectRole(sessionIdFromUrl);
  showReveailRange(sessionIdFromUrl);
} 

const pollingId = setInterval(() => {
  updateJoinedCount(sessionIdFromUrl, pollingId);
}, 1000);

let pollingRange;

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

  const record = await fetchSessionFromAirtable(sessionId);
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

  pollingRange = setInterval(() => {
    showReveailRange(sessionId, pollingRange);
  }, 3000);
}

async function showReveailRange(sessionId) {
  const record = await fetchSessionFromAirtable(sessionId);
  if (!record) return;

  const fields = record.fields;
  let count = 0;
  if (fields["Range 1"]) count++;
  if (fields["Range 2"]) count++;

  if (count === 2) {
    document.getElementById("revealRange").classList.remove("hidden");
    if (pollingRange) {
      clearInterval(pollingRange);
    }
    document.getElementById("statusOther").classList.add("hidden");
    console.log("✅ Ready to reveal");

    document.getElementById("range1").textContent = fields["Range 1"];
    document.getElementById("range2").textContent = fields["Range 2"];
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
  const record = await fetchSessionFromAirtable(sessionId);
  if (!record) {
    alert("Session not found.");
    return;
  }

  if (hasSubmittedRange(sessionId)) {
    return;
  }

  const fields = record.fields;
  const joinId = getOrCreateLocalJoinId();

  if (fields["Person 1 Joined"] === joinId || fields["Person 2 Joined"] === joinId) {
    // Already joined — show UI
    document.getElementById('negotioation').classList.remove("hidden");
    return;
  }

  if (!fields["Person 1 Joined"]) {
    updatePersonJoined(record.id, "Person 1 Joined", joinId);
    document.getElementById('negotioation').classList.remove("hidden");
  } else if (!fields["Person 2 Joined"]) {
    updatePersonJoined(record.id, "Person 2 Joined", joinId);
    document.getElementById('negotioation').classList.remove("hidden");
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
  const record = await fetchSessionFromAirtable(sessionId);
  if (!record) return;

  const fields = record.fields;
  let count = 0;
  if (fields["Person 1 Joined"]) count++;
  if (fields["Person 2 Joined"]) count++;

  document.getElementById("joinedCount").textContent = `${count}/2 joined`;

  if (count === 2 && pollingId) {
    document.getElementById("joinedCount").textContent = `${count}/2 joined ✅`
    clearInterval(pollingId);
    console.log("✅ Both joined. Stopped polling.");
  }
}

function openIndex() {
  window.location.href = "https://blueviolet-rail-310845.hostingersite.com/index.html";
}
