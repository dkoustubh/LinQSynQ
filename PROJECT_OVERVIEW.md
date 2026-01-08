# LinQSynQ Project Overview

**Project Name:** LinQSynQ  
**Created By:** Koustubh Deodhar  
**Date:** December 9, 2025  

## Purpose
The primary objective of **LinQSynQ** is to serve as a modern, lightweight, and open-source alternative to **Kepware EX6** for industrial connectivity. It is specifically designed to bridge the gap between Operational Technology (OT) and Information Technology (IT) by establishing a seamless connection with **Siemens S7-1500 PLCs**.

LinQSynQ aims to:
1.  **Eliminate Licensing Costs**: Provide a free, robust solution for basic PLC connectivity without expensive proprietary licenses.
2.  **Modernize the Stack**: Utilize web technologies (Node.js, React) for better flexibility, ease of development, and integration with modern cloud systems.
3.  **Bridge Data**: Act as a gateway to forward industrial data to MQTT brokers, enabling easy integration with cloud platforms like AWS IoT, Azure, or SCADA systems.

## Technical Architecture

LinQSynQ is built as a full-stack web application:

### 1. Backend (Node.js)
-   **Core Logic**: Built with **Express.js**.
-   **PLC Driver**: Uses the `nodes7` library to communicate with Siemens PLCs via the **ISO-on-TCP (RFC1006)** protocol. This allows direct reading of Data Blocks (DBs), Merkers (M), and Inputs/Outputs without needing an OPC server.
-   **Real-Time Engine**: Utilizes **Socket.io** to stream data changes to the frontend instantly, ensuring a live view of the process.
-   **IoT Gateway**: Integrated **MQTT Client** (`mqtt.js`) to publish tag data to any standard MQTT broker.

### 2. Frontend (React)
-   **Framework**: Built with **React** and **Vite** for high performance.
-   **UI/UX**: Features a premium "Dark Mode" industrial dashboard design.
-   **Functionality**:
    -   **Connection Manager**: Configure PLC IP, Rack, and Slot.
    -   **Tag Browser**: Add and monitor tags (e.g., `DB1,INT0`) dynamically.
    -   **MQTT Config**: Set up the upstream broker connection directly from the UI.
    -   **Live Visualization**: View real-time values and quality status of all connected tags.

## Key Features
-   **Direct S7-1500 Support**: Connects directly to the PLC's Ethernet port.
-   **No OPC UA Required**: Bypasses the need for complex OPC UA configuration for simple data access.
-   **Bi-Directional Communication**: ✅ **FULLY OPERATIONAL** - Both read from AND write to the PLC with built-in safety confirmations.
-   **Cloud Ready**: Native MQTT support makes it ready for Industry 4.0 applications.


## Configuration Requirements
To ensure successful connection with Siemens S7-1500 PLCs, the following TIA Portal settings are mandatory:
1.  **Permit PUT/GET**: Enabled in the PLC's "Protection & Security" settings.
2.  **Non-Optimized Block Access**: Data Blocks must have "Optimized block access" disabled to be addressable via absolute offsets.

---
*LinQSynQ represents a significant step towards democratizing industrial connectivity, empowering engineers to build custom IIoT solutions with ease.*
