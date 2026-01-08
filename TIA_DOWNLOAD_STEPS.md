# How to Download Configuration to S7-1500 PLC

Since you have a physical PLC and TIA Portal, follow these steps to "Download" your settings (like the PUT/GET permission) to the PLC.

## Step 1: Physical Connection
1.  Connect an **Ethernet Cable** from your Computer to the **X1 (P1)** port on the S7-1500 PLC.
2.  Ensure your Computer's Network Adapter is in the same range as the PLC.
    -   *Example*: If PLC is `192.168.0.1`, set your PC to `192.168.0.50`.

## Step 2: Select the PLC in TIA Portal
1.  Open your project in **TIA Portal**.
2.  In the **Project Tree** (left sidebar), click on your PLC folder (e.g., `PLC_1 [CPU 1511-1 PN]`) to highlight it.

## Step 3: Start the Download
1.  Look at the **Toolbar** at the top.
2.  Click the **Download to device** button.
    -   *Icon*: A computer screen with an arrow pointing **down** into a blue PLC chip.
    -   *Shortcut*: `Ctrl + L`.

## Step 4: Configure Connection (Extended Download)
If this is your first time connecting, a window "Extended download to device" will appear:
1.  **Type of PG/PC interface**: Select `PN/IE`.
2.  **PG/PC interface**: Select your computer's **Ethernet Adapter** (Realtek, Intel, USB adapter, etc.).
3.  **Connection to interface/subnet**: Select `Direct at slot '1 X1'`.
4.  Click **Start Search**.
5.  Your PLC should appear in the list with its IP address. Select it.
6.  Click **Load**.

## Step 5: Compile and Load
1.  TIA Portal will compile the configuration.
2.  A "Load preview" window will appear.
3.  You might see warnings (e.g., "The modules will be stopped").
    -   Check the box **"Stop all"** or **"Overwrite all"** in the Action column.
4.  Click **Load**.
5.  In the final window, check **"Start module"** and click **Finish**.

## ✅ Success
Your PLC is now updated with the new configuration!
-   **PUT/GET** is enabled.
-   **Optimized Access** is disabled (for your DBs).
-   You can now connect **FuseFlow**.
