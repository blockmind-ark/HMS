You are an expert full-stack engineer. Implement native biometric fingerprint authentication using the **WebAuthn API** (supporting built-in laptop biometric sensors like Windows Hello, Touch ID, or integrated USB fingerprint readers) in our Next.js HMS application.

### Requirements:
1. **Patient Biometric Registration:**
   - Create a registration service using `navigator.credentials.create({ publickey: ... })` that prompts the user for fingerprint verification via the laptop's built-in biometric sensor.
   - Store the generated credential ID and public key securely in the PostgreSQL database linked to the Patient record via Prisma.

2. **Patient Biometric Verification (Login/Visit Lookup):**
   - Create a verification routine using `navigator.credentials.get({ publickey: ... })` when scanning a returning patient's fingerprint.
   - Match the returned credential ID with the database and instantly retrieve the patient's profile and visit history.

3. **Backend API Routes:**
   - `/api/biometric/register-challenge`: Generates challenge options for registration.
   - `/api/biometric/register-verify`: Verifies and saves the biometric credential.
   - `/api/biometric/auth-challenge`: Generates challenge options for authentication.
   - `/api/biometric/auth-verify`: Verifies the assertion and returns the patient record.