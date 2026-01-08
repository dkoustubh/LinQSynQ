# FuseFlow Connection Guide

This guide details how to configure your **Siemens S7-1500 PLC** using **TIA Portal** to allow connections from **FuseFlow**.

## ⚠️ Important Note on Protocols
FuseFlow uses the **Native S7 Protocol (ISO-on-TCP / RFC1006)** to communicate with the PLC.
-   **Why?** It is faster, requires less overhead than OPC UA, and works with almost all Siemens PLCs (S7-300/400/1200/1500) without requiring extra licenses.
-   **OPC UA?** While the S7-1500 supports OPC UA, FuseFlow bypasses the need for it, connecting directly to the memory addresses. This means you do **NOT** need to enable the OPC UA server on the PLC for FuseFlow to work.

---

## Step 1: TIA Portal Configuration

To allow FuseFlow (which acts like an HMI or external partner) to read/write data, you must change two critical settings.

### 1. Enable PUT/GET Communication
By default, the S7-1500 blocks external "PUT" (Write) and "GET" (Read) requests for security.

1.  Open your project in **TIA Portal**.
2.  Go to **Devices & Networks** and open the **Device View** of your PLC.
3.  Click on the PLC CPU to select it.
4.  In the **Properties** tab (bottom window), navigate to:
    -   **General** -> **Protection & Security** -> **Connection Mechanisms**.
5.  **Check** the box: ☑️ **"Permit access with PUT/GET communication from remote partner"**.

### 2. Disable "Optimized Block Access"
FuseFlow addresses data by **Offset** (e.g., Byte 0, Byte 2), not by symbolic name. "Optimized" blocks shuffle data in memory, making offsets impossible to predict. You must use "Standard" access.

1.  In the **Project Tree**, locate the **Data Block (DB)** you want to access (e.g., `Data_block_1 [DB1]`).
2.  Right-click the DB and select **Properties**.
3.  Go to **Attributes**.
4.  **Uncheck** the box: ☐ **"Optimized block access"**.
5.  Click **OK**.

### 3. Compile and Download
1.  Right-click the PLC in the Project Tree.
2.  Select **Compile** -> **Hardware (rebuild all)**.
3.  Select **Compile** -> **Software (rebuild all)**.
4.  **Download** the changes to the PLC.

---

## Step 2: Addressing Tags

Since we are using direct memory addressing, you need to know the **Offset** and **Data Type** of your variables.

### Finding the Address in TIA Portal
1.  Open your Data Block (e.g., DB1).
2.  Look at the **Offset** column. (If hidden, right-click the header and show "Offset").
    -   *Note: You must compile the block after disabling "Optimized access" to see offsets.*

### Mapping to FuseFlow
FuseFlow uses the `nodes7` addressing format:

| TIA Portal Type | TIA Offset | FuseFlow Address Format | Example |
| :--- | :--- | :--- | :--- |
| **Bool** | 0.0 | `DBx,Xy.z` | `DB1,X0.0` |
| **Int** (16-bit) | 2.0 | `DBx,INTy` | `DB1,INT2` |
| **Real** (Float) | 4.0 | `DBx,REALy` | `DB1,REAL4` |
| **DInt** (32-bit) | 8.0 | `DBx,DINTy` | `DB1,DINT8` |
| **String** | 12.0 | `DBx,Sy.len` | `DB1,S12.20` |

*Where `x` is DB Number, `y` is Byte Offset, `z` is Bit Offset.*

---

## Step 3: Connecting FuseFlow

1.  **Network**: Ensure your computer acts as part of the same subnet as the PLC.
    -   *Example*: PLC IP `192.168.0.1` (Subnet `255.255.255.0`) -> PC IP `192.168.0.50`.
2.  **Launch FuseFlow**:
    ```bash
    npm run dev
    ```
3.  **Dashboard**:
    -   **IP**: Enter the PLC's IP (e.g., `192.168.0.1`).
    -   **Rack**: `0` (Standard for S7-1500).
    -   **Slot**: `1` (Standard for S7-1500).
4.  **Click Connect**.
5.  **Add Tags**: Enter the Name (e.g., `Temperature`) and Address (e.g., `DB1,REAL4`).

---

## Troubleshooting

-   **Connection Refused**: Check if "PUT/GET" is enabled. Check if your firewall is blocking Port 102.
-   **Bad Values / Null**: Check if "Optimized Block Access" is disabled for that specific DB. Ensure you recompiled and downloaded.
-   **PLCSIM**: If using **S7-PLCSIM** (Basic), it does not support external TCP connections easily. Use **PLCSIM Advanced** and set the "PLCSIM Virtual Eth. Adapter" as your network interface.
