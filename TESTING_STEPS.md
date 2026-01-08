# End-to-End Testing Guide: FuseFlow + Siemens S7-1500

**Current PLC**: 192.168.103.24 (✅ Network accessible, ⚠️ PUT/GET must be enabled)

**📊 For current connection status and diagnostics, see**: `STATUS_REPORT.md`

Follow these exact steps to verify the connection between your physical PLC and FuseFlow.

## Phase 1: Prepare the PLC (TIA Portal)

1.  **Open TIA Portal** and load your project.
2.  **Configure Security**:
    -   Go to *Device Configuration* -> *Properties* -> *Protection & Security* -> *Connection Mechanisms*.
    -   ✅ Check **"Permit access with PUT/GET communication"**.
3.  **Create a Test Data Block**:
    -   Create a new Data Block (e.g., named `FuseTest` as **DB10**).
    -   Right-click DB10 -> *Properties* -> *Attributes*.
    -   ❌ **Uncheck** "Optimized block access".
    -   Click OK.
4.  **Add a Variable**:
    -   Open DB10.
    -   Add a variable: Name=`TestVal`, Type=`Int`, Start Value=`123`.
    -   **Note the Offset**: It should be `0.0`.
5.  **Download**:
    -   Right-click the PLC -> *Download to device*.
    -   Ensure you select "Stop all" if prompted to overwrite.
6.  **Go Online**:
    -   Click the **"Monitor all"** (eyeglasses icon) button in the DB editor.
    -   You should see the "Monitor value" as `123`.

## Phase 2: Connect FuseFlow

1.  **Start FuseFlow**:
    -   Ensure `npm run dev` is running.
    -   Open **http://localhost:5173**.
2.  **Enter Connection Details**:
    -   **IP Address**: Enter your PLC's IP (e.g., `192.168.0.1`).
    -   **Rack**: `0`
    -   **Slot**: `1`
    -   Click **Connect**.
    -   *Status should turn Green (ONLINE).*

## Phase 3: Verify Data

1.  **Add the Tag**:
    -   In the "Add New Tag" section:
    -   **Name**: `Test_Integer`
    -   **Address**: `DB10,INT0` (Matches DB10, Offset 0 from Phase 1).
    -   Click **Add**.
2.  **Check the Value**:
    -   The table should show `123` (or whatever value is in the PLC).
    -   *Status should be "Good".*

## Phase 4: Bi-Directional Test (Read from PLC)

1.  **Change Value in TIA Portal**:
    -   In the DB Monitor view, right-click the `TestVal` "Modify value" column.
    -   Type `456` and click the lightning bolt icon (Modify).
2.  **Check FuseFlow**:
    -   The value in the FuseFlow dashboard should update to `456` within 1 second.
    -   The **Trend Chart** (if you clicked the row) should show the jump.

## Phase 4b: Write to PLC (New Feature!)

**FuseFlow now supports WRITING values to the PLC!**

1.  **Write from FuseFlow Dashboard**:
    -   Locate the `Test_Integer` row in the Live Data table.
    -   In the **"Write Value"** column, enter a new value (e.g., `789`).
    -   Click the **"Write"** button.
2.  **Confirm the Operation**:
    -   A confirmation dialog will appear asking you to confirm the write operation.
    -   Click **OK** to proceed.
3.  **Check Status**:
    -   A status banner will appear showing "✅ Successfully wrote 789 to Test_Integer".
    -   The **Current Value** column should update to `789` within 1 second.
4.  **Verify in TIA Portal**:
    -   Look at the DB Monitor view in TIA Portal.
    -   The `TestVal` Monitor value should now show `789`.
    -   **🎉 You've successfully written to the PLC from FuseFlow!**


## Phase 5: Node-RED Check (Optional)

1.  Open **http://localhost:1881/red**.
2.  Drag an **s7 in** node.
3.  Configure it with your PLC IP.
4.  Set the variable to `DB10,INT0`.
5.  Connect a **debug** node and deploy.
6.  You should see the value `456` in the debug sidebar.

---
**🎉 If you see the value update, your "Kepware Replacement" is fully operational!**
