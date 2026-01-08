# FuseFlow Write Functionality Guide

## Overview

FuseFlow now supports **bi-directional communication** with Siemens S7-1500 PLCs. This means you can not only read data from the PLC but also **write values back to PLC tags** directly from the web interface.

## 🔒 Safety Features

Writing to industrial PLCs can be dangerous if not done carefully. FuseFlow implements several safety mechanisms:

1. **Confirmation Dialog**: Every write operation requires user confirmation
2. **Connection Check**: Write operations only work when PLC is connected
3. **Status Feedback**: Clear visual feedback for success/failure
4. **Error Handling**: Graceful error messages if write fails
5. **Tag Validation**: Ensures tag exists before attempting write

## 🎯 How to Write Values

### From the Web Interface

1. **Connect to PLC** first (status must be ONLINE)
2. **Locate your tag** in the Live Data table
3. **Enter new value** in the "Write Value" column
4. **Click "Write" button**
5. **Confirm** the operation in the popup dialog
6. **Monitor status** - A banner will show success/failure

### Value Auto-Detection

FuseFlow automatically tries to parse numeric values:
- Input: `100` → Sent as number `100`
- Input: `true` → Sent as string `"true"` (supports BOOL)
- Input: `3.14` → Sent as float `3.14`

## 📡 API Endpoint

You can also write programmatically using the REST API:

### POST `/api/write`

**Request Body:**
```json
{
  "tagName": "TEST_TAG",
  "value": 456
}
```

**Success Response:**
```json
{
  "success": true,
  "tag": "TEST_TAG",
  "value": 456
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "PLC not connected"
}
```

### Example with cURL
```bash
curl -X POST http://localhost:3001/api/write \
  -H "Content-Type: application/json" \
  -d '{"tagName":"TEST_TAG","value":123}'
```

### Example with JavaScript/Axios
```javascript
const response = await axios.post('http://localhost:3001/api/write', {
  tagName: 'PRODUCTION_COUNT',
  value: 500
});

if (response.data.success) {
  console.log('Write successful!');
}
```

## 🧪 Testing Write Functionality

### Quick Test Procedure

1. **Create a test tag** in TIA Portal:
   - Data Block: `DB1`
   - Variable: `WriteTest` (Type: INT)
   - Offset: Note the byte offset (e.g., `0`)

2. **Add tag in FuseFlow**:
   - Name: `WRITE_TEST`
   - Address: `DB1,INT0` (adjust offset as needed)

3. **Perform write operation**:
   - Enter value `999` in Write Value column
   - Click Write button
   - Confirm operation

4. **Verify in TIA Portal**:
   - Open DB1 in Monitor mode
   - Check if `WriteTest` shows value `999`

## ⚠️ Common Issues

### Write Button Disabled
- **Cause**: PLC not connected
- **Solution**: Click "Connect" button first and ensure status is ONLINE

### Error: "Tag not found"
- **Cause**: Tag doesn't exist in tag list
- **Solution**: Add the tag first using "Add New Tag" section

### Error: "PLC not connected"
- **Cause**: Connection lost after initial connect
- **Solution**: Reconnect to PLC

### Write appears successful but value doesn't change
- **Cause**: PLC block might have "Optimized block access" enabled
- **Solution**: Disable optimization in TIA Portal (see CONNECTION_GUIDE.md)

## 🔧 Advanced Usage

### Writing Different Data Types

**Integer (INT)**:
```
Address: DB1,INT0
Value: 100
```

**Real/Float (REAL)**:
```
Address: DB1,REAL4
Value: 3.14159
```

**Boolean (BOOL)**:
```
Address: DB1,X6.0
Value: 1 (for TRUE) or 0 (for FALSE)
```

**Double Integer (DINT)**:
```
Address: DB1,DINT8
Value: 1000000
```

## 🛡️ Best Practices

1. **Always test with non-critical tags first**
2. **Verify PLC permissions** (PUT/GET must be enabled)
3. **Monitor status messages** after each write
4. **Use appropriate data types** to avoid overflow
5. **Create a separate test DB** for experimentation
6. **Document your tag addresses** for your team

## 🚀 What's Next?

Future enhancements being considered:
- Bulk write operations
- Scheduled writes
- Write value history/undo
- Data type validation
- Write permissions/access control

---

**Need Help?** Check the [TESTING_STEPS.md](/Users/admin/Desktop/Fuseflow/TESTING_STEPS.md) for end-to-end testing procedures.
