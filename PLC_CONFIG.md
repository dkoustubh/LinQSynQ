# PLC Configuration Guide - Updated Setup

## 🎯 Current PLC Status
Your PLC is **running and up** at IP: `192.168.103.24`

## ⚠️ Important: Protocol Clarification

### What Protocol Does Your PLC Use?

Your Spring Boot configuration shows:
```yaml
server-url: "opc.tcp://192.168.103.24/4840"
```

This indicates **OPC UA** protocol (port 4840).

However, **FuseFlow is currently configured for S7 native protocol** (ISO-on-TCP, port 102).

### You Have Two Options:

#### Option 1: Use S7 Native Protocol (Recommended - Current Setup)
- **Port**: 102
- **Protocol**: ISO-on-TCP / RFC1006
- **Advantages**: 
  - Faster performance
  - Direct memory access
  - No extra PLC configuration needed
  - Works with all S7-1200/1500 PLCs

**Required TIA Portal Settings**:
1. Enable PUT/GET communication
2. Disable "Optimized Block Access" on Data Blocks
3. Ensure PLC is accessible on port 102

#### Option 2: Use OPC UA (If Required)
- **Port**: 4840
- **Protocol**: OPC UA
- **Advantages**:
  - Standardized protocol
  - Built-in security
  - Works across different PLC brands

**Note**: FuseFlow would need to be modified to use `node-opcua` library instead of `nodes7`.

---

## 📊 Current Tag Configuration

Based on your Spring config, I've mapped generic tags. **You need to verify these addresses in TIA Portal**:

| Tag Name | OPC UA Node ID (Spring) | S7 Address (FuseFlow) | Notes |
|----------|-------------------------|------------------------|-------|
| TEST_TAG | - | `DB1,INT0` | Default test tag |
| PRODUCTION_DATA | `ns=2;s=Telegram_Production` | `DB2,INT0` | Update based on actual offset |
| MACHINE_STATUS | `ns=2;s=Telegram_Status` | `DB2,INT10` | Update based on actual offset |
| PROCESS_VALUES | `ns=2;s=Telegram_Process` | `DB2,REAL20` | Update based on actual offset |

### ⚠️ Action Required: Map Your Tags

The OPC UA node IDs from your Spring config cannot be directly converted to S7 addresses. 

**You must**:
1. Open TIA Portal
2. Navigate to your Data Blocks (DB1, DB2, etc.)
3. Find the **Byte Offset** for each variable
4. Update `tags.json` with the correct addresses

**Example Mapping**:
```
TIA Portal Variable: "Telegram_Production" in DB2 at Offset 10
→ FuseFlow Address: "DB2,INT10" (if it's an Integer)
```

---

## 🔧 Updated Configuration

### PLC Connection Settings (plc.js)
```javascript
host: '192.168.103.24'  // ✅ Updated to match your PLC
rack: 0                  // Standard for S7-1500
slot: 1                  // Standard for S7-1500
port: 102                // S7 protocol port
```

### Tags (tags.json)
```json
{
  "TEST_TAG": "DB1,INT0",
  "PRODUCTION_DATA": "DB2,INT0",
  "MACHINE_STATUS": "DB2,INT10",
  "PROCESS_VALUES": "DB2,REAL20"
}
```

**📝 These are placeholder addresses - update them based on your actual TIA Portal configuration!**

---

## 🚀 Next Steps

### Step 1: Verify Network Connectivity
```bash
ping 192.168.103.24
```
Ensure your computer can reach the PLC.

### Step 2: Check PLC Port
```bash
nc -zv 192.168.103.24 102
```
This checks if port 102 (S7 protocol) is open.

If you're using OPC UA instead:
```bash
nc -zv 192.168.103.24 4840
```

### Step 3: Update Tag Addresses
1. Open TIA Portal
2. Go to your Data Blocks
3. Right-click the table header → Show "Offset" column
4. Note down the byte offsets for your variables
5. Update `/Users/admin/Desktop/Fuseflow/tags.json` with correct addresses

### Step 4: Start FuseFlow
```bash
cd /Users/admin/Desktop/Fuseflow
npm run dev
```

### Step 5: Test Connection
1. Open browser: `http://localhost:5173`
2. The system should auto-connect to `192.168.103.24`
3. Check if tags show live data

---

## 🔍 Troubleshooting

### "Connection Failed" Error
- **Check**: Is PUT/GET enabled in TIA Portal?
- **Check**: Is port 102 open on the PLC?
- **Check**: Is your computer on the same network?

### "Bad Quality" or Null Values
- **Check**: Are the DB offsets correct?
- **Check**: Is "Optimized Block Access" disabled for those DBs?
- **Check**: Did you recompile and download to the PLC after changes?

### Wrong Protocol
If your PLC only supports OPC UA:
- Let me know, and I'll help you switch FuseFlow to use `node-opcua` instead of `nodes7`
- This requires installing different dependencies and updating the connection logic

---

## 📞 Support

If you need help:
1. Share screenshots of your TIA Portal Data Block (showing offsets)
2. Confirm which protocol your PLC is configured for (S7 or OPC UA)
3. Share any error messages from the FuseFlow console

---

## 🔄 Spring Boot vs FuseFlow

Your Spring Boot service uses OPC UA, while FuseFlow uses S7 protocol. Both can run **simultaneously**:
- **Spring Boot OPC UA Service**: Port 4840, using symbolic names
- **FuseFlow S7 Service**: Port 102, using direct memory addresses

They access the same PLC data but through different protocols.
