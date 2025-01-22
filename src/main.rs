use std::{io, sync::Arc};

pub mod api;
pub mod config;
pub mod database;
pub mod uptime;

#[actix_web::main]
async fn main() -> io::Result<()> {
    let config = Arc::new(config::load_config());
    let database =  Arc::new(database::open_database(&config.database));
    
    uptime::launch_uptime(database.clone(), config.clone());
    api::launch_api(database, config).await
}
