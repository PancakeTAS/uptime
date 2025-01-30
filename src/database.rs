use std::{path::PathBuf, sync::Mutex};

use rusqlite::Connection;

pub struct Database(Connection);

impl Database {
    /// Open a connection to the database, creating it if it doesn't exist
    fn new(path: &PathBuf) -> rusqlite::Result<Self> {
        let conn = Connection::open(path)?;

        // per-check data, with status lasting for 1 minute
        conn.execute(
            "CREATE TABLE IF NOT EXISTS healthchecks(
                id INTEGER(8) NOT NULL,
                timestamp INTEGER(8) NOT NULL,
                status BOOL(1) NOT NULL,
                PRIMARY KEY (id, timestamp)
            )",
            [],
        )?;

        // per-day data, with uptime in minutes
        conn.execute(
            "CREATE TABLE IF NOT EXISTS history(
                id INTEGER(8) NOT NULL,
                timestamp INTEGER(8) NOT NULL,
                uptime INTEGER(8) NOT NULL,
                PRIMARY KEY (id, timestamp)
            )",
            [],
        )?;

        Ok(Self(conn))
    }
    /// Insert a healthcheck into the database
    pub fn insert_healthcheck(&self, id: u64, timestamp: u64, status: bool) -> rusqlite::Result<()> {
        self.0.execute(
            "INSERT INTO healthchecks (id, timestamp, status) VALUES (?, ?, ?)",
            [id, timestamp, status as u64],
        )?;
        Ok(())
    }
    /// Convert healthchecks to history
    pub fn convert_healthchecks_to_history(&self, id: u64, timestamp: u64) -> rusqlite::Result<()> {
        // get start of this day and end of this day
        let start_of_day = timestamp - timestamp % 86400;
        let end_of_day = start_of_day + 86400;

        // get uptime
        let mut uptime_query = self.0.prepare(
            "SELECT SUM(status) AS uptime FROM healthchecks WHERE timestamp BETWEEN ? AND ? AND id = ?",
        )?;
        let uptime = uptime_query.query_row(
            [start_of_day, end_of_day, id],
            |row| row.get::<_, u64>(0),
        )?;

        // insert into history
        self.0.execute(
            "INSERT INTO history (id, timestamp, uptime) VALUES (?, ?, ?)",
            [id, start_of_day, uptime],
        )?;
        
        Ok(())
    }
    /// Get the latest healthcheck for a id
    pub fn latest_healthcheck(&self, id: u64) -> rusqlite::Result<i8> {
        let mut query = self.0.prepare(
            "SELECT status FROM healthchecks WHERE id = ? ORDER BY timestamp DESC LIMIT 1",
        )?;
        let status = query.query_row([id], |row| row.get::<_, i8>(0))?;
        Ok(status)
    }
    /// Fetch the history for a id
    pub fn fetch_history(&self, id: u64, days: u64, now: u64) -> rusqlite::Result<Vec<i64>> {
        // get start of the day
        let start_of_day = now - now % 86400;

        // get the history
        let mut query = self.0.prepare(
            "SELECT uptime FROM history WHERE id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT ?",
        )?;
        let history = query.query_map([id, start_of_day - 86400 * days, start_of_day, days], |row| row.get::<_, i64>(0))?;
        let mut data = Vec::new();
        for uptime in history {
            data.insert(0, uptime?);
        }
        Ok(data)
    }
}

/// Open the database, panic if it fails
pub fn open_database(db: &String) -> Mutex<Database> {
    Mutex::new(Database::new(&PathBuf::from(db))
        .expect("Could not open database"))
}