# 🖥️ FuseFlow Frontend Testing Guide

## Current Status
Your dashboard shows: **PLC Connection: ONLINE** ✅

This means:
- ✅ Network connection successful
- ✅ ISO-on-TCP handshake completed
- ⚠️ Data reading may fail (PUT/GET needed)

---

## 📋 Testing Procedure

### Test 1: Add a Simple Tag

**Location**: Scroll down to "Add New Tag" section

**Enter These Values**:
```
Tag Name:    TestTag
Tag Address: DB1,INT0
```

**Click**: "Add Tag" button

---

### Test 2: Check Live Data Table

After adding the tag, look at the **Live Data** section above.

#### ✅ SUCCESS (PUT/GET Enabled):
| Tag Name | Current Value | Quality | Status |
|----------|---------------|---------|--------|
| TestTag  | 123 (or any number) | Good | 🟢 |

The value updates every second.

#### ❌ BLOCKED (PUT/GET NOT Enabled - Current State):
| Tag Name | Current Value | Quality | Status |
|----------|---------------|---------|--------|
| TestTag  | null or 0 | Bad Quality | 🔴 |

**Backend Console Shows**:
```
[API] Invalid Response Code - 5
[API] Error reading PLC data: true
```

---

### Test 3: Try Different Tag Types

If Test 1 shows "Bad Quality", it confirms PUT/GET is the issue.

Once PUT/GET is enabled, try these tags:

| Description | Tag Name | Address | Expected Result |
|-------------|----------|---------|-----------------|
| Integer | MyInt | DB1,INT0 | Number value |
| Float | MyFloat | DB1,REAL4 | Decimal value |
| Boolean | MyBool | DB1,X8.0 | true/false |

**Note**: These addresses are examples. Use actual offsets from your TIA Portal Data Blocks!

---

## 🎯 What Each Field Means

### Connection Section (Top of Page)

```
PLC Connection: ONLINE          ← ISO-on-TCP connected
IP: 192.168.103.24              ← Your PLC IP (correct!)
Rack: 0                         ← CPU Rack (correct!)
Slot: 1                         ← CPU Slot (correct!)
[Reconnect]                     ← Force reconnection if needed
```

### Add New Tag Section

```
Tag Name: [Enter name]          ← Any name you want (e.g., "Temperature")
Address:  [Enter address]       ← S7 address format: DB{num},{TYPE}{offset}
[Add Tag]                       ← Adds tag to monitoring list
```

**Address Format Examples**:
- `DB1,INT0` - Integer at Data Block 1, Byte 0
- `DB2,REAL10` - Float at Data Block 2, Byte 10
- `DB1,X0.0` - Boolean at Data Block 1, Byte 0, Bit 0
- `DB5,DINT20` - Double Integer at Data Block 5, Byte 20

### Live Data Section

```
Tag Name  | Current Value | Quality     | Last Updated | Actions
----------|---------------|-------------|--------------|----------
TestTag   | 123          | Good        | 17:06:45     | [Delete]
Temp      | 25.5         | Good        | 17:06:46     | [Delete]
Running   | true         | Good        | 17:06:46     | [Delete]
```

**Quality Indicators**:
- **Good** = Data reading successfully ✅
- **Bad Quality** = Cannot read (PUT/GET issue) ⚠️
- **Uncertain** = Connection intermittent ⚠️

---

## 🔧 Current Expected Behavior

**What You Should See NOW** (before enabling PUT/GET):

1. **Connection Status**: ✅ ONLINE (this is working!)
2. **Add Tag**: ✅ Can add tags (interface works)
3. **Live Data**: ❌ Shows "Bad Quality" or null values
4. **Console**: Shows "Invalid Response Code - 5" errors

**This is NORMAL!** The connection works, but data access is blocked.

---

## ✅ Expected Behavior AFTER Enabling PUT/GET

**What You'll See** (after TIA Portal configuration):

1. **Connection Status**: ✅ ONLINE
2. **Add Tag**: ✅ Can add tags
3. **Live Data**: ✅ Shows REAL values from PLC
4. **Quality**: Shows "Good"
5. **Console**: Shows "✅ Reading tags: TestTag=123..."
6. **Trend Chart**: Click a row to see live chart

**Additional Features Available**:
- ✍️ **Write to PLC**: Enter value in "Write Value" column
- 📊 **Trend Charts**: Click any tag row to see real-time graph
- 📡 **MQTT Publishing**: Data auto-publishes to MQTT broker
- 📝 **CSV Logging**: Data saves to `logs/` folder

---

## 🧪 Step-by-Step Test

### Current Test (Do this NOW):

```
Step 1: Scroll down to "Add New Tag"
Step 2: Enter:
        Name: TestTag
        Address: DB1,INT0
Step 3: Click "Add Tag"
Step 4: Check Live Data table above
Step 5: Look at Quality column
```

**Expected Result**: 
- Quality shows "Bad Quality" or "Uncertain"
- Value shows null, 0, or strange numbers
- Console shows "Invalid Response Code - 5"

✅ **This confirms PUT/GET is not enabled**

---

### After Enabling PUT/GET (Future):

```
Step 1: Enable PUT/GET in TIA Portal
Step 2: Restart FuseFlow: npm run dev
Step 3: Add same tag: TestTag / DB1,INT0
Step 4: Check Live Data table
```

**Expected Result**:
- Quality shows "Good" ✅
- Value shows actual PLC data (e.g., 123)
- Value updates every 1 second
- Console shows "✅ Successfully read tags"

---

## 📊 Dashboard Sections Explained

### 1. Connection Panel (Top)
Shows connection status and configuration.
- **ONLINE** = Can connect to PLC
- **OFFLINE** = Cannot reach PLC

### 2. MQTT Configuration (Middle)
Configure MQTT broker for data publishing.
- Optional feature
- Publishes all tag data to MQTT topics

### 3. Add New Tag (Middle)
Add tags to monitor.
- Tag Name: Your label
- Address: S7 memory address

### 4. Live Data Table (Below Add Tag)
Shows current values of all tags.
- Updates every 1 second
- Click row to see trend chart
- Enter value to write to PLC

### 5. Advanced Logic / Node-RED (Bottom)
Visual flow-based programming.
- Click "Open Node-RED"
- Opens in new tab: http://localhost:1881/red

---

## 🎬 Video Demonstration

**What to do in the UI:**

1. **Check Connection**: 
   - Top shows "ONLINE" ✅
   
2. **Add a Tag**:
   - Scroll to "Add New Tag"
   - Name: TestTag
   - Address: DB1,INT0
   - Click "Add Tag"

3. **Observe Live Data**:
   - Table shows your tag
   - If Quality = "Bad", PUT/GET needed
   - If Quality = "Good", everything works!

4. **Try Writing** (after PUT/GET enabled):
   - Type value in "Write Value" column
   - Click "Write" button
   - Value updates in PLC

5. **View Trend**:
   - Click any tag row
   - Chart appears showing history
   - Updates in real-time

---

## 🆘 Troubleshooting

### Issue: All values show null or 0
**Cause**: PUT/GET not enabled  
**Solution**: Enable in TIA Portal (see STATUS_REPORT.md)

### Issue: Connection shows OFFLINE
**Cause**: PLC unreachable or wrong IP  
**Solution**: Check network, verify IP: 192.168.103.24

### Issue: Cannot add tags
**Cause**: Frontend/backend not communicating  
**Solution**: Check backend is running on port 3001

### Issue: Values don't update
**Cause**: PLC in STOP mode or DB doesn't exist  
**Solution**: Put PLC in RUN mode, verify DB1 exists

---

## 📸 What You Should See

### Current State (PUT/GET NOT Enabled):
```
┌─────────────────────────────────────────┐
│ PLC Connection                          │
│ ● ONLINE                                │
│ IP: 192.168.103.24                      │
│ Rack: 0  Slot: 1                        │
│ [Reconnect]                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Live Data                               │
├──────┬──────┬─────────┬────────┬────────┤
│ Tag  │Value │ Quality │ Time   │ Action │
├──────┼──────┼─────────┼────────┼────────┤
│TestT.│ null │ Bad     │17:06:45│[Delete]│
└──────┴──────┴─────────┴────────┴────────┘
           ⚠️  This is expected!
```

### After PUT/GET Enabled:
```
┌─────────────────────────────────────────┐
│ PLC Connection                          │
│ ● ONLINE                                │
│ IP: 192.168.103.24                      │
│ Rack: 0  Slot: 1                        │
│ [Reconnect]                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Live Data                               │
├──────┬──────┬─────────┬────────┬────────┤
│ Tag  │Value │ Quality │ Time   │ Action │
├──────┼──────┼─────────┼────────┼────────┤
│TestT.│ 123  │ Good ✅ │17:06:46│[Delete]│
└──────┴──────┴─────────┴────────┴────────┘
           ✅  Success!
```

---

## 🎯 Summary

**What to Enter on Frontend**:

1. **Connection** (Already configured!):
   - IP: 192.168.103.24 ✅
   - Rack: 0 ✅
   - Slot: 1 ✅

2. **Test Tag**:
   - Name: `TestTag`
   - Address: `DB1,INT0`

3. **Expected Now**: Bad Quality (PUT/GET issue)

4. **Expected After Fix**: Good Quality with real values

---

**Next Step**: Try adding the TestTag now and see what happens!
