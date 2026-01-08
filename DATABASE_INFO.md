# Database Requirements for FuseFlow

## Current Status: Zero-Dependency (File-Based)
As currently built, FuseFlow **does NOT require an external database server** to run. It is designed to be lightweight and "plug-and-play".

-   **Configuration (Tags)**: Stored in `tags.json` (Local JSON file).
-   **Historical Data**: Stored in `logs/data_log.csv` (Local CSV file).

**✅ Advantage**: You can run this on any laptop or Raspberry Pi immediately without installing SQL Server, MySQL, or Postgres.

---

## Recommended Upgrades for Production
If you plan to deploy this in a factory to replace Kepware EX6 permanently, you might want to upgrade the storage backend depending on your needs:

### 1. SQLite (Recommended for Standalone)
*Best for: Single-server deployments, embedded PCs, simple setup.*
-   **Why**: It is a full SQL database stored in a single file (`database.sqlite`). No server installation required.
-   **Pros**: Much faster and safer than CSV/JSON. Supports SQL queries.
-   **Cons**: Not meant for massive clusters.

### 2. PostgreSQL + TimescaleDB (Recommended for Enterprise)
*Best for: High-speed data logging (millions of points), multiple users, heavy analytics.*
-   **Why**: The industry standard for open-source industrial data. TimescaleDB is an extension specifically for IoT time-series data.
-   **Pros**: Extremely fast for time-series data. Robust.
-   **Cons**: Requires installing and managing a PostgreSQL server.

### 3. InfluxDB
*Best for: Pure time-series visualization (Grafana).*
-   **Why**: Specialized just for timestamped data.
-   **Pros**: Great compression and speed for logs.
-   **Cons**: Not good for relational data (like user management or complex tag configs).

---

## Summary
| Feature | Current (FuseFlow Basic) | Upgrade Option A (SQLite) | Upgrade Option B (PostgreSQL) |
| :--- | :--- | :--- | :--- |
| **Setup** | None (Built-in) | None (npm install sqlite3) | Install Postgres Server |
| **Tag Storage** | `tags.json` | `tags` table | `tags` table |
| **Data History** | `data_log.csv` | `history` table | `hypertable` (Timescale) |
| **Max Tags** | ~100 | ~10,000 | Unlimited |
| **Performance** | Low | Medium | High |

**Recommendation**: Start with the current **File-Based** setup. If you find the CSV file getting too large (>1GB) or the app getting slow, we can switch to **SQLite** with a single code change.
