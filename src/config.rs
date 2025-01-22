use serde::Deserialize;

#[derive(Deserialize, Clone)]
pub struct Config {
    pub port: u16,
    pub database: String,
    pub servers: Vec<Server>,
}

#[derive(Deserialize, Clone)]
pub struct Server {
    pub name: String,
    pub categories: Vec<Category>,
}

#[derive(Deserialize, Clone)]
pub struct Category {
    pub name: String,
    pub services: Vec<Service>,
}

#[derive(Deserialize, Clone)]
pub struct Service {
    pub id: u64,
    pub name: String,
    pub info: String,
    pub command: String,
}

/// Load the configuration from the config.yml file, panic if it fails
pub fn load_config() -> Config {
    let reader = std::fs::File::open("config.yml")
        .expect("Could not open config.yml");
    serde_yml::from_reader(reader)
        .expect("Could not parse config.yml")
}