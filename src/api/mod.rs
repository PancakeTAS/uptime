use std::{io, sync::{Arc, Mutex, OnceLock, RwLock}, time::SystemTime};

use actix_web::{App, HttpServer};

use crate::{config::Config, database::Database};

mod json;

/// Current API state encoded as json
static STATE: OnceLock<RwLock<(String, SystemTime)>> = OnceLock::new();

/// Database and configuration for the web api
struct Api {
    database: Arc<Mutex<Database>>,
    config: Arc<Config>,
}

static API: OnceLock<Api> = OnceLock::new();

#[actix_web::get("/")]
async fn get_state() -> String {
    // check if the state needs to be updated
    let refresh = {
        let state = STATE.get().unwrap().read().unwrap();
        let now = state.1.elapsed().map(|d| d.as_secs()).unwrap_or(120);
        now > 60
    };

    // update the state if needed
    if refresh {
        if let Err(e) = refresh_state() {
            eprintln!("Error refreshing state!: {}", e);
            return String::from("Error refreshing state");
        }
    }

    // get the state
    STATE.get().unwrap().read().unwrap().0.clone()
}

/// Attempt to refresh the state of the web api
fn refresh_state() -> rusqlite::Result<()> {
    // fetch system time
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    // get api
    let api = API.get()
        .expect("API not initialized");

    let database = api.database.lock().unwrap();
    let config = api.config.as_ref();

    // build state
    let mut servers = Vec::with_capacity(config.servers.len());
    for server in &config.servers {
        let mut total_status: (i64, i64) = (0, 0);

        let mut categories = Vec::with_capacity(server.categories.len());
        for category in &server.categories {
            let mut services = Vec::with_capacity(category.services.len());
            for service in &category.services {
                let status = database.latest_healthcheck(service.id)?;
                let data_uptimes = database.fetch_history(service.id, 180, now)?
                    .iter().map(|uptime| if *uptime >= 23 { 0 } else if *uptime > 0 { 1 } else { 0 })
                    .collect::<Vec<_>>();

                total_status.0 = total_status.0 + 1;
                total_status.1 = total_status.1 + status as i64;

                services.push(json::Service {
                    name: service.name.clone(),
                    info: service.info.clone(),
                    data_uptimes,
                    status,
                });
            }

            categories.push(json::Category {
                name: category.name.clone(),
                services,
            });
        }

        let is_operational =
            if total_status.0 == 0 {
                0
            } else if total_status.0 == total_status.1 {
                2
            } else {
                1
            };

        servers.push(json::Server {
            title: json::Title {
                name: server.name.clone(),
                is_operational,
            },
            last_update: now as i64,
            categories,
        });
    }
    
    // encode state
    let state = json::State {
        servers,
    };
    let state_str = serde_json::to_string(&state)
        .expect("Could not encode state to json");
    *STATE.get().unwrap().write().unwrap() = (state_str, SystemTime::now());
    
    Ok(())
}

/// Launch the web api in the current async context
pub async fn launch_api(database: Arc<Mutex<Database>>, config: Arc<Config>) -> io::Result<()> {
    let port = config.port;
    API.get_or_init(|| Api { database, config });
    STATE.get_or_init(|| RwLock::new((String::new(), SystemTime::UNIX_EPOCH)));
    HttpServer::new(|| {
        App::new()
            .service(get_state)
    })
    .bind(("127.0.0.1", port))?
    .run()
    .await
}