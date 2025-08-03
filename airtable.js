    
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
}

// Your existing session creation logic
function createSessionInAirtable(sessionId) {
  const Timestamp = getCETTimestamp();
  console.log(Timestamp);
  fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
    method: "POST",
    headers: {
    "Authorization": `Bearer ${AIRTABLE_API_TOKEN}`,
    "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: {
        "Session Id": sessionId,
        "Timestamp": Timestamp
      }
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Session created in Airtable:", data);
  })
  .catch(error => {
    console.error("Error creating session in Airtable:", error);
  });
}

async function checkIfSessionIdExists(sessionId) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(`{Session Id} = '${sessionId}'`)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`
    }
  });

  const data = await response.json();
  return data.records && data.records.length > 0;
}

async function fetchSessionFromAirtable(sessionId) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(`{Session Id} = "${sessionId}"`)}`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`
    }
  });
  
  const data = await res.json();
  return data.records[0];
}

async function updatePersonJoined(recordId, fieldName, joinId) {
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [{
        id: recordId,
        fields: {
          [fieldName]: joinId  
        }
      }]
    })
  });

  const data = await response.json();
  return data;
}

async function updateSalaryRange(sessionId, rangeValue) {
  const record = await fetchSessionFromAirtable(sessionId);
  if (!record) {
    alert("Session not found.");
    return;
  }

  const fields = record.fields;
  const recordId = record.id;

  let fieldToUpdate;
  if (!fields["Range 1"]) {
    fieldToUpdate = "Range 1";
  } else if (!fields["Range 2"]) {
    fieldToUpdate = "Range 2";
  } else {
    alert("Both ranges have already been submitted.");
    return;
  }
  
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [{
        id: recordId,
        fields: {
          [fieldToUpdate]: rangeValue
        }
      }]
    })
  });
}