Viewed grievance.controller.ts:135-144

Here is the complete step-by-step workflow with an example of how the new architecture works seamlessly between the Frontend UI, the Backend API, and the Database. 

Let's use **Tracking a Grievance** as the example.

### Step 1: The Citizen Requests an OTP
1. **Frontend (UI)**: The citizen visits the portal, enters their Ticket Number (e.g., `ZMN-GRV-001`), and clicks **"Get OTP"**.
2. **API Call**: Frontend sends `POST /api/grievance/track-otp` with the payload:
   ```json
   { "ticketNo": "ZMN-GRV-001" }
   ```
3. **Backend Logic**: 
   - The backend looks up the ticket and finds the citizen's registered phone number: `9876543210`.
   - It calls the new `OtpService.generateAndSendOtp()`.
4. **Database Action**: The `citizen_otp` table inserts a new row:
   - `id`: `"uuid-abc-123"` *(This is the reference_id)*
   - `identifier`: `"9876543210"`
   - `action`: `"TRACK"`
   - `otp`: `"456123"`
   - `expires_at`: `[Current Time + 5 Minutes]`
5. **WhatsApp**: The backend sends `"456123"` to the citizen's WhatsApp.
6. **API Response**: The backend responds to the frontend with the `reference_id` (so the frontend knows which OTP session this is) and the masked mobile number:
   ```json
   {
     "status": true,
     "message": "OTP sent to registered mobile number",
     "data": {
       "reference_id": "uuid-abc-123",
       "maskedMobile": "98******10"
     }
   }
   ```

---

### Step 2: The Citizen Verifies the OTP
1. **Frontend (UI)**: The citizen checks their phone, enters `456123` into the input box, and clicks **"Verify & Track"**.
2. **API Call**: Frontend sends `POST /api/grievance/track` with the payload:
   ```json
   { 
     "ticketNo": "ZMN-GRV-001",
     "reference_id": "uuid-abc-123", 
     "otp": "456123" 
   }
   ```
3. **Backend Logic**: The backend calls `OtpService.verifyOtp({ reference_id: "uuid-abc-123", otp: "456123" })`.
4. **Database Verification (`citizen_otp` table)**:
   - Finds row `id = "uuid-abc-123"`.
   - **Check 1**: Is `is_used` false? *(Yes)*
   - **Check 2**: Is current time `< expires_at`? *(Yes)*
   - **Check 3**: Are `attempts < max_attempts`? *(Yes)*
   - **Check 4**: Does DB `otp` match User `otp`? *(Yes)*
   - **DB Update**: It immediately updates `is_used = true` so this OTP can never be reused.
5. **API Response**: The backend returns the full grievance timeline data to the frontend so the citizen can view it.

---

### Edge Cases (What makes this architecture "Advanced")

* **Scenario A: Citizen enters the wrong OTP (e.g., "999999")**
  * The DB updates `attempts = attempts + 1` (now 1 out of 3).
  * API Returns: `400 Bad Request` → *"Incorrect OTP. 2 attempt(s) remaining."*

* **Scenario B: Citizen guesses wrong 3 times**
  * The DB sees `attempts >= max_attempts`.
  * API Returns: `400 Bad Request` → *"Too many incorrect attempts. Please request a new OTP."* (The `reference_id` is now permanently locked).

* **Scenario C: Citizen gets coffee, comes back 10 minutes later**
  * The DB sees `expires_at` is in the past.
  * API Returns: `400 Bad Request` → *"OTP has expired. Please request a new one."*

* **Scenario D: Hacker intercepts the API payload and tries to use the same `reference_id` + `otp` again**
  * The DB sees `is_used == true`.
  * API Returns: `400 Bad Request` → *"This OTP has already been used. Please request a new OTP."*

This exact same flow works for **Submitting a Grievance** (`/api/grievance/send-otp` -> `/api/grievance/submit`) and can be easily copied to your Property or Water modules!