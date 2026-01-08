# LinQ-SynQ - Industrial IoT Platform

**Created by Koustubh Deodhar (2025) @ ATS Conveyors India Pvt. Ltd.**

A powerful, lightweight, Node.js-based alternative to Kepware for connecting Siemens S7 PLCs, Rockwell PLCs, and OPC UA servers to modern IT systems.

---

## 🚀 Key Features

*   **Universal Connectivity**: Connects to Siemens S7-1500/1200, Rockwell Automation, and OPC UA compliant devices.
*   **Protocol Support**: Native support for **OPC UA**, **Snap7 (S7 Comm)**, **MQTT**, and **EtherNet/IP**.
*   **Real-Time Dashboard**: React-based UI for live monitoring, controlling, and visualizing tag data.
*   **One-Click Setup**: Automated setup scripts for Windows and macOS/Linux.
*   **Node-RED Integration**: Embedded Node-RED engine for drag-and-drop logic flows and edge processing.
*   **Data Logging**: Automatic CSV logging and database integrations (MongoDB).
*   **Security**: Role-Based Access Control (RBAC) and Audit Trails.

---

## ⚡ Quick Start

### 1. Installation

**Windows**:
Double-click `install-setup.bat` to automatically install Node.js dependencies and set up MongoDB.

**Mac / Linux**:
```bash
chmod +x install-setup.sh
./install-setup.sh
```

### 2. Start Application

To start the full stack (Backend + Frontend + Node-RED) with **OPC UA** as the default driver:

**Windows**:
```bash
npm run dev:opcua
```

**Mac / Linux**:
```bash
./restart-opcua.sh
```

### 3. Access Dashboard

*   **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
*   **Backend API**: [http://localhost:3001](http://localhost:3001)
*   **Node-RED Editor**: [http://localhost:1881/red](http://localhost:1881/red)

---

## 🔧 Configuration

### PLC Setup (Siemens S7)

1.  **Open TIA Portal** → Device View.
2.  **Select CPU** → Properties.
3.  Go to: **Protection & Security** → **Connection Mechanisms**.
4.  ✅ Check: **"Permit access with PUT/GET communication"**.
5.  **Disable "Optimized Block Access"** for any Data Blocks (DBs) you wish to access directly via absolute addressing.
6.  Compile and Download.

### adding Tags
*   **OPC UA**: Uses NodeIDs (e.g., `ns=3;s="MyDataBlock"."MyTag"`).
*   **S7 Comm**: Uses S7 addressing (e.g., `DB1,INT0`, `DB2,REAL4`).
*   Go to the **"Tag Management"** panel in the Dashboard (requires specific permissions) to add new tags.

---

## 📂 Project Structure

| Directory/File | Description |
| :--- | :--- |
| `client/` | React Frontend application (Vite). |
| `server-opcua.js` | Main backend server for OPC UA connectivity. |
| `server.js` | Legacy backend server (Snap7 focus). |
| `install-setup.bat` | **Windows** one-click setup script. |
| `install-setup.sh` | **Mac/Linux** setup script. |
| `tags-opcua.json` | Persistent storage for configured tags. |
| `node-red-runner.js`| Script to manage the embedded Node-RED instance. |

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Copyright (c) 2025 Koustubh Deodhar, ATS Conveyors India Pvt. Ltd.**
