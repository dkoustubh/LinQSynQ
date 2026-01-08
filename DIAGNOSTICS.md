# 🔧 PLC Connection Diagnostics

## Current Status: ⚠️ Connection Issues Detected

### Error Analysis
**Error**: `Invalid Response Code - 5`

**What this means**:
- The network connection to the PLC works (port 102 is accessible)
- The S7 protocol handshake is failing
- Response Code 5 typically indicates **access denied** or **parameter error**

---

## 🎯 Root Cause & Solutions

### Most Common Causes:

#### 1. PUT/GET Communication Not Enabled ⭐ MOST LIKELY
**Solution**:
1. Open **TIA Portal**
2. Go to **Device Configuration** → Select your CPU
3. Navigate to **Properties** → **Protection & Security** → **Connection Mechanisms**
4. ✅ **Check**: "Permit access with PUT/GET communication from remote partner"
5. **Compile** and **Download** to PLC
6. **Restart** the PLC (or go STOP → RUN)

#### 2. Wrong Rack/Slot Configuration
**Current Settings**:
- Rack: `0`
- Slot: `1`

For **S7-1500**:
- Standard is usually Rack `0`, Slot `1`
- But verify in TIA Portal: Device View → Hardware Catalog shows the slot number

**To Check in TIA Portal**:
1. Go to **Device View**
2. Look at the **CPU module** in the rack
3. Count the position (Slot 0 = leftmost, usually power supply)
4. CPU is typically Slot 1, but verify

**If Different**: Update `/Users/admin/Desktop/Fuseflow/plc.js` line 11-12

#### 3. PLC in STOP Mode
**Check**:
- Look at the physical PLC - is the RUN LED on?
- In TIA Portal: Go Online → Check CPU status

**Solution**: Put PLC in RUN mode

#### 4. Optimized Block Access Still Enabled
Even if the connection works, data reading can fail if:
- Your Data Blocks still have "Optimized Block Access" enabled
- You haven't recompiled after disabling it

**Solution**:
1. Right-click each DB (DB1, DB2, etc.) → Properties
2. Attributes tab → ❌ **Uncheck** "Optimized block access"
3. **Compile** and **Download**

#### 5. Security/Access Level
Some PLCs have protection levels that block external access.

**Check in TIA Portal**:
1. Properties → Protection
2. Ensure protection level allows external access
3. No password protection is active for connection

---

## 🧪 Quick Test Steps

### Test 1: Verify PUT/GET is Enabled
```bash
# This is already done - connection to port 102 works
# Now you need to enable PUT/GET in TIA Portal
```

### Test 2: Try Different Rack/Slot
If the above doesn't work, try these common combinations:

| PLC Model | Typical Rack | Typical Slot |
|-----------|--------------|--------------|
| S7-1500   | 0            | 1            |
| S7-1200   | 0            | 1            |
| S7-1500 with HMI | 0    | 2            |

### Test 3: Check PLC Mode
**Via TIA Portal**:
1. Go Online with the PLC
2. Check if it says "RUN" or "STOP"
3. If STOP → Right-click → RUN

---

## 📝 Checklist (Do in Order)

- [ ] **Step 1**: Open TIA Portal and go online with PLC
- [ ] **Step 2**: Verify PLC is in **RUN** mode
- [ ] **Step 3**: Enable **PUT/GET communication** in CPU properties
- [ ] **Step 4**: Check CPU **Slot** number (confirm it's Slot 1)
- [ ] **Step 5**: Disable **Optimized Block Access** for all Data Blocks you want to read
- [ ] **Step 6**: **Compile** Hardware and Software
- [ ] **Step 7**: **Download** to PLC
- [ ] **Step 8**: **Restart** FuseFlow: `npm run dev`
- [ ] **Step 9**: Check browser at `http://localhost:5173`

---

## 🔄 Alternative: Use OPC UA Instead

Since your Spring Boot config uses OPC UA and **port 4840 is also accessible**, we could switch FuseFlow to use OPC UA instead of S7 protocol.

### Advantages of OPC UA:
- No need for PUT/GET configuration
- Works with symbolic names (no need to know offsets)
- Better security
- Standard protocol

### Disadvantages:
- Requires OPC UA server to be enabled on PLC
- Slightly more overhead
- Need to add `node-opcua` dependency

**Would you like me to create an OPC UA version of FuseFlow?**

---

## 📊 Expected Behavior After Fix

Once PUT/GET is enabled and PLC is in RUN mode, you should see:

```
[API] PLC Connected Successfully!
[API] ✅ Successfully read tags: TEST_TAG=123, PRODUCTION_DATA=456...
```

Instead of:

```
[API] Invalid Response Code - 5
[API] Error reading PLC data: true
```

---

## 🆘 Still Having Issues?

### Provide These Details:

1. **PLC Model**: S7-1500? S7-1200? Specific CPU?
2. **TIA Portal Version**: V16? V17? V18?
3. **PUT/GET Status**: Is it enabled? (Check the box in TIA Portal)
4. **PLC Mode**: RUN or STOP?
5. **Slot Number**: Confirmed from TIA Portal Device View
6. **Screenshot**: Of TIA Portal's "Connection Mechanisms" settings

### Alternative Approach:
If S7 protocol continues to fail, we can use **OPC UA** instead since port 4840 is accessible and matches your Spring Boot config.

---

## 🎓 Understanding the Error

**S7 Response Codes**:
- `0` = Success
- `1` = Hardware fault
- `3` = Object does not exist
- `5` = **Access denied / Invalid parameter**
- `6` = Data type not supported
- `10` = Object access denied

Response Code 5 almost always means:
- PUT/GET not enabled, OR
- Wrong rack/slot, OR
- PLC in STOP mode
