# 🔴 Node-RED Integration Guide for FuseFlow

## 1. How Node-RED Changes PLC Tags
Node-RED acts as a **visual logic engine** that sits between your PLC and FuseFlow.

### The Mechanism:
1.  **Reading**: FuseFlow generates an **"S7 In"** node in Node-RED. This node cyclically polls the PLC (e.g., every 100ms) for the tags you defined.
2.  **Processing**: The data flows through "wires" to other nodes where you can add logic (JavaScript functions, delays, triggers).
3.  **Writing**: To change a tag, you use an **"S7 Out"** node. When a message reaches this node, it writes the value back to the PLC memory address.

---

## 2. What is the Flow Editor?
The **Flow Editor** (at `http://localhost:1881/red`) is your visual programming canvas.

*   **Nodes**: The blocks you drag onto the screen (e.g., `S7 In`, `Debug`, `Function`).
*   **Wires**: The lines connecting nodes, representing the flow of data.
*   **Flow**: The entire diagram that defines your logic.
*   **Deploy**: The button in the top-right that saves and activates your logic.

### FuseFlow's Role:
When you click **"Connect"** in FuseFlow (with Node-RED selected), FuseFlow **automatically writes a Flow** to this editor. It creates:
*   A **PLC Configuration Node** (IP, Rack, Slot).
*   **Input Nodes** for your tags.
*   **MQTT Nodes** to send data back to the FuseFlow dashboard.

---

## 3. How to Test in Flow Editor

### A. Viewing Live Data (Debug)
1.  Open the editor: [http://localhost:1881/red](http://localhost:1881/red)
2.  Look for the green **"Debug"** node (shaped like a bug).
3.  Click the **bug icon** in the right sidebar.
4.  You will see live values streaming in from the PLC.

### B. Writing a Value (Manual Test)
To manually change a PLC tag from Node-RED:
1.  Drag an **"Inject"** node (left sidebar) to the canvas.
2.  Double-click it and set `Payload` to the value you want (e.g., `Number: 100`).
3.  Drag an **"S7 Out"** node.
4.  Double-click it, select the PLC, and choose the Variable (Tag) to write to.
5.  Connect the **Inject** node to the **S7 Out** node.
6.  Click **Deploy**.
7.  Click the button on the **Inject** node. The value will be written to the PLC!

---

## 4. Bi-Directional Sync Workflow

### FuseFlow ➡️ Node-RED (Auto-Sync)
*   **Action**: You add a tag in FuseFlow or click "Connect".
*   **Result**: FuseFlow regenerates the flow and pushes it to Node-RED. Your new tag appears automatically in the editor.

### Node-RED ➡️ FuseFlow (Import)
*   **Action**: You drag new S7 nodes in the editor and define new variables in the PLC Config node.
*   **Result**: Click **"Import from Node-RED"** in FuseFlow (Feature coming next). FuseFlow reads the active flow, finds your new variables, and adds them to your dashboard.
