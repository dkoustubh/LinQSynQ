# Converting OPC UA Node IDs to S7 Addresses

## Your OPC UA Tags (from Spring Boot config)

Based on your Spring configuration, here are your OPC UA tags that need conversion:

### Tags from Spring Config:

1. **Tag1**
   - OPC UA: `ns=0;i=2253`
   - S7 Address: *Need to identify in TIA Portal*

2. **Tag2**
   - OPC UA: `ns=2;i=5001`
   - S7 Address: *Need to identify in TIA Portal*

3. **PLC**
   - OPC UA: `ns=3;s=PLC`
   - S7 Address: *Need to identify in TIA Portal*

4. **STKR1_Heart Bit** (Your current query)
   - OPC UA: `ns=3;s="PLC_To_WMS"."STKR1_Heart Bit"`
   - S7 Address: **Need to find in TIA Portal**

### Telegrams:

1. **ProductionData**
   - OPC UA: `ns=2;s=Telegram_Production`
   - Type: ByteString, Length: 100
   - S7 Address: *Need to identify*

2. **MachineStatus**
   - OPC UA: `ns=2;s=Telegram_Status`
   - Type: String, Length: 50
   - S7 Address: *Need to identify*

3. **ProcessValues**
   - OPC UA: `ns=2;s=Telegram_Process`
   - Type: ByteString, Length: 200
   - S7 Address: *Need to identify*

---

## 🔍 How to Find S7 Addresses in TIA Portal

### For "PLC_To_WMS"."STKR1_Heart Bit":

1. **Open TIA Portal** → Project tree
2. **Locate Data Block**: 
   - Look for a DB named `PLC_To_WMS` or similar
   - It might be under PLC → Program blocks → Data blocks
3. **Open the Data Block**
4. **Enable Offset Column**:
   - Right-click the table header
   - Check ✅ "Offset"
5. **Find the Variable**:
   - Look for `STKR1_Heart Bit` or `STKR1_Heart_Bit`
   - Note its **Offset** (e.g., 0.0, 2.5, etc.)
   - Note its **Data Type** (Bool, Int, Real, etc.)

### Reading the Offset:

**Format**: `Byte.Bit`

Examples:
- `0.0` = Byte 0, Bit 0
- `0.5` = Byte 0, Bit 5
- `2.3` = Byte 2, Bit 3
- `10.0` = Byte 10 (for Int, Real, etc.)

---

## 🎯 Conversion Table

### Data Type Mapping:

| TIA Type | Offset Example | S7 Address Format | FuseFlow Example |
|----------|----------------|-------------------|------------------|
| **Bool** | 0.0 | `DBx,Xy.z` | `DB1,X0.0` |
| **Bool** | 2.5 | `DBx,Xy.z` | `DB1,X2.5` |
| **Int** (16-bit) | 10.0 | `DBx,INTy` | `DB1,INT10` |
| **DInt** (32-bit) | 20.0 | `DBx,DINTy` | `DB1,DINT20` |
| **Real** (Float) | 30.0 | `DBx,REALy` | `DB1,REAL30` |
| **String** | 40.0 | `DBx,Sy.len` | `DB1,S40.20` |

Where:
- `x` = DB number (e.g., 1, 2, 10)
- `y` = Byte offset
- `z` = Bit offset (for Bool only)
- `len` = String length

---

## 📝 Example Conversion Process

### Example: Converting "STKR1_Heart Bit"

**Step 1**: Open TIA Portal, find DB

```
Found in: Program blocks → Data blocks → "PLC_To_WMS" [DB10]
```

**Step 2**: Open DB10, show offsets

```
Name              | Data Type | Offset | Initial Value
------------------|-----------|--------|---------------
STKR1_Heart_Bit   | Bool      | 0.0    | FALSE
STKR1_Mission_ID  | Int       | 2.0    | 0
STKR1_Status      | DInt      | 4.0    | 0
```

**Step 3**: Convert to S7 address

```
Variable: STKR1_Heart_Bit
Type: Bool
DB: 10
Offset: 0.0

S7 Address: DB10,X0.0
```

**Step 4**: Add to FuseFlow

In the frontend:
```
Tag Name: STKR1_HeartBit
Address: DB10,X0.0
```

---

## 🗺️ Quick Reference: Your Tags

Based on your Spring config, here's what you likely need to find:

### Expected Data Blocks:

| Spring OPC UA Name | Likely DB Name | Variables to Find |
|--------------------|----------------|-------------------|
| `PLC` | DB with PLC info | Various PLC tags |
| `PLC_To_WMS` | WMS communication DB | STKR1_Heart Bit, etc. |
| `Telegram_Production` | Production data | Byte arrays |
| `Telegram_Status` | Status data | Status strings |
| `Telegram_Process` | Process values | Process data |

---

## ✅ Recommended Tags to Add First

### 1. Heart Bit (Your Current Query)

**Find in TIA Portal**:
```
DB: PLC_To_WMS (DB number = ?)
Variable: STKR1_Heart Bit
Type: Bool
Offset: ? (you need to check)
```

**Add to FuseFlow** (example if DB10, offset 0.0):
```
Tag Name: STKR1_HeartBit
Address: DB10,X0.0
```

### 2. Other Common Tags

Once you find the DB structure, add:

```
Tag Name: STKR1_MissionID
Address: DB10,INT2   (if Int at offset 2)

Tag Name: STKR1_Status
Address: DB10,DINT4   (if DInt at offset 4)
```

---

## 🔧 After Finding Addresses

### Update tags.json:

```json
{
  "STKR1_HeartBit": "DB10,X0.0",
  "STKR1_MissionID": "DB10,INT2",
  "STKR1_Status": "DB10,DINT4",
  "ProductionCount": "DB5,INT0",
  "MachineStatus": "DB5,INT10"
}
```

### Restart FuseFlow:

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

---

## 🆘 Can't Find the Data Block?

### Option A: Ask Your PLC Programmer
They should know:
- Which DB contains `PLC_To_WMS` data
- The structure of that DB
- The byte offsets for each variable

### Option B: Browse in TIA Portal
1. Go to **Project tree**
2. Expand: **PLC → Program blocks → Data blocks**
3. Open each DB and search for variable names that match your Spring config

### Option C: Use OPC UA Browser
Since OPC UA is enabled, you can:
1. Use UAExpert (free OPC UA client)
2. Connect to `opc.tcp://192.168.103.24:4840`
3. Browse the address space
4. Find where each variable is located

### Option D: Switch to OPC UA
Let me modify FuseFlow to use OPC UA instead, so you can use the exact addresses from Spring config!

---

## 🎯 Need Help?

Please provide:
1. **Screenshot** of TIA Portal showing the Data Block list
2. **Screenshot** of the `PLC_To_WMS` DB structure (if you can find it)
3. **Confirmation** if you want to switch to OPC UA instead

Then I can provide exact S7 addresses or create an OPC UA version for you!
