    const createBtn = document.getElementById("createSessionBtn");
    const startBtn = document.getElementById("startBtn");
    const linkDisplay = document.getElementById("confirmation");
    const postCreation = document.getElementById("postCreation");

    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get("sessionId");

    if (sessionIdFromUrl) {
      linkDisplay.textContent = `Loaded session: ${sessionIdFromUrl}`;
      startBtn.classList.add("hidden");
      createBtn.classList.add("hidden");
    }

    function generateId(length = 8) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    }

    async function generateUniqueSessionId(maxRetries = 5) {
      const tried = [];

      for (let i = 0; i < maxRetries; i++) {
        const sessionId = generateId();
        tried.push(sessionId);
        const snapshot = await db.ref(`sessions/${sessionId}`).once('value');
        if (!snapshot.exists()) return sessionId;
      }

      throw new Error(`Failed to generate a unique session ID after ${maxRetries} attempts. Tried: ${tried.join(', ')}`);
    }

    createBtn.addEventListener("click", () => {
      const sessionId = generateId();
      generateUniqueSessionId().then((sessionId) => {
        createSessionInFirebase(sessionId);

        let baseUrl;
        if (window.location.origin === "null") {
          baseUrl = "https://blueviolet-rail-310845.hostingersite.com/index.html";
        } else {
          // Use current origin + path minus trailing slash
          const path = window.location.pathname.replace(/\/$/, '');
          baseUrl = window.location.origin + path;
        }

        const fullLink = baseUrl + "?sessionId=" + sessionId;

        postCreation.classList.remove("hidden");
        createBtn.classList.add("hidden");
        startBtn.onclick = () => {
          redirectOnStart(sessionId);
        };
      });
    });

    function redirectOnStart(sessionId) {
      if (!sessionId) {
        alert("Session ID not found in URL.");
        return;
      }

      window.location.href = `session.html?sessionId=${sessionId}`;
    }