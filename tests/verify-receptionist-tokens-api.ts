const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function extractCookies(response: Response, existingCookies: Record<string, string> = {}) {
  const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  for (const cookieStr of setCookies) {
    const parts = cookieStr.split(";")[0].split("=");
    const name = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    existingCookies[name] = val;
  }
  return existingCookies;
}

function cookieString(cookieObj: Record<string, string>) {
  return Object.entries(cookieObj)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function login(email: string, pass: string) {
  const jar: Record<string, string> = {};
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  extractCookies(csrfRes, jar);
  const { csrfToken } = await csrfRes.json();

  const authRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieString(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password: pass,
      json: "true",
    }).toString(),
    redirect: "manual",
  });

  extractCookies(authRes, jar);
  return cookieString(jar);
}

async function run() {
  console.log("================================================================================");
  console.log("   AUTOMATED VERIFICATION: RECEPTIONIST OPD TOKENS HTTP API & TAB");
  console.log("================================================================================\n");

  console.log("🔐 1. Authenticating as Receptionist...");
  const cookie = await login("receptionist@hms.local", "reception123");
  const headers = {
    Cookie: cookie,
    "Content-Type": "application/json",
  };
  console.log("   ✔ Receptionist session authenticated.\n");

  console.log("📡 2. Testing GET /api/receptionist/tokens...");
  const getRes = await fetch(`${BASE_URL}/api/receptionist/tokens`, { headers });
  if (!getRes.ok) {
    throw new Error(`GET /api/receptionist/tokens returned status ${getRes.status}`);
  }
  const statusData = await getRes.json();
  console.log(`   ✔ Current date queue: ${statusData.dateStr}`);
  console.log(`   ✔ Next auto token: #${statusData.counter.nextAutoToken}`);
  console.log(`   ✔ Total tokens issued today: ${statusData.stats.totalToday}\n`);

  console.log("📡 3. Testing POST /api/receptionist/tokens (AUTO)...");
  const postAutoRes = await fetch(`${BASE_URL}/api/receptionist/tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "AUTO" }),
  });
  if (!postAutoRes.ok) {
    throw new Error(`POST /api/receptionist/tokens failed: ${postAutoRes.status}`);
  }
  const autoData = await postAutoRes.json();
  console.log(`   ✔ Issued Auto Token: #${autoData.token.tokenNumber} (${autoData.token.tokenType})\n`);

  // Find an available manual slot from statusData.counter.issuedManualTokens
  const issuedList: number[] = statusData.counter.issuedManualTokens || [];
  const availableSlot = [1, 2, 3, 4].find((n) => !issuedList.includes(n));
  const testSlot = availableSlot || 2;

  if (availableSlot) {
    console.log(`📡 4. Testing POST /api/receptionist/tokens (MANUAL Slot #${testSlot})...`);
    const postManualRes = await fetch(`${BASE_URL}/api/receptionist/tokens`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "MANUAL", manualNum: testSlot }),
    });
    if (!postManualRes.ok) {
      throw new Error(`POST /api/receptionist/tokens manual failed: ${postManualRes.status}`);
    }
    const manualData = await postManualRes.json();
    console.log(`   ✔ Issued Manual Reserved Token: #${manualData.token.tokenNumber}\n`);
  } else {
    console.log("   (All manual slots 1-4 used today, proceeding to duplicate test)\n");
  }

  console.log(`📡 5. Testing Duplicate Manual Token Block (Slot #${testSlot} again)...`);
  const postDupRes = await fetch(`${BASE_URL}/api/receptionist/tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "MANUAL", manualNum: testSlot }),
  });
  if (postDupRes.status !== 400) {
    throw new Error(`Expected HTTP 400 for duplicate manual token, got ${postDupRes.status}`);
  }
  const dupErr = await postDupRes.json();
  if (dupErr.error !== "Token already issued today") {
    throw new Error(`Expected 'Token already issued today', got '${dupErr.error}'`);
  }
  console.log(`   ✔ Correctly blocked: "${dupErr.error}" (HTTP 400)\n`);

  console.log("🌐 6. Testing /receptionist page rendering (OPD Token Generation as first tab)...");
  const pageRes = await fetch(`${BASE_URL}/receptionist`, { headers });
  const html = await pageRes.text();
  if (!html.includes("OPD Token Generation")) {
    throw new Error("Receptionist page does not contain 'OPD Token Generation' tab!");
  }
  console.log("   ✔ Confirmed 'OPD Token Generation' is rendered on the Receptionist portal.\n");

  console.log("================================================================================");
  console.log("   🎉 ALL API & UI CHECKS PASSED!");
  console.log("================================================================================\n");
}

run().catch((e) => {
  console.error("❌ Verification failed:", e);
  process.exit(1);
});
