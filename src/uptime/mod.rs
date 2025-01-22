use std::{process::{self, Stdio}, sync::{Arc, Mutex}, thread, time::{Duration, SystemTime}};

use crate::{config::Config, database::Database};

struct Uptime {
    database: Arc<Mutex<Database>>,
    services: Vec<(u64, String)>,
}

impl Uptime {
    /// Create a new uptime module
    fn create(database: Arc<Mutex<Database>>, config: Arc<Config>) -> Self {
        let services = config.servers
            .iter()
                .flat_map(|server| server.categories.iter()
                    .flat_map(|category| category.services.iter()
                        .map(|service| (service.id, service.command.clone()))))
                .collect();

        Uptime { database, services }
    }
    /// Entry point for the uptime module, does not return until the program is terminated
    fn run(&self) {
        // get unix timestamp
        let mut now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
    
        // initialize timers
        let mut next_healthcheck = now - (now % 60) + 60;
        loop {
            // update time
            now = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs();
    
            // check if healthcheck is due
            if now >= next_healthcheck {
                next_healthcheck += 60;
    
                let db = self.database.lock().unwrap();
                for service in &self.services {
                    let status = self.healthcheck(&service.1);
                    db.insert_healthcheck(service.0, now, status)
                        .expect("Failed to insert healthcheck");
                }
            }
    
            // check if next healthcheck is tomorrow
            let end_of_day = now - (now % 86400) + 86400;
            if next_healthcheck >= end_of_day {
                // convert healthchecks to history
                let db = self.database.lock().unwrap();
                for service in &self.services {
                    db.convert_healthchecks_to_history(service.0, now)
                        .expect("Failed to convert healthchecks to history");
                }

                // wait until tomorrow, could be done better, but this is good enough
                thread::sleep(Duration::from_secs(end_of_day - now + 1));
            }
    
            // sleep for 1 second
            thread::sleep(Duration::from_secs(1));
        }
    }
    /// Perform a health check
    fn healthcheck(&self, cmd: &String) -> bool {
        process::Command::new("sh")
            .args(["-c", cmd])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .expect("Failed to execute command")
            .success()
    }
}

/// Launch the uptime module in a new thread
pub fn launch_uptime(database: Arc<Mutex<Database>>, config: Arc<Config>) {
    let uptime = Uptime::create(database, config);
    thread::spawn(move || {
        uptime.run();
    });
}
