use serde::Serialize;

/// State for the web api, to be encoded as json and sent to the client
#[derive(Serialize, Default)]
pub struct State {
    pub servers: Vec<Server>
}

#[derive(Serialize, Default)]
pub struct Server {
    pub title: Title,
    pub last_update: i64,
    pub categories: Vec<Category>,
}

#[derive(Serialize, Default)]
pub struct Title {
    pub name: String,
    pub is_operational: i8,
}

#[derive(Serialize, Default)]
pub struct Category {
    pub name: String,
    pub services: Vec<Service>,
}

#[derive(Serialize, Default)]
pub struct Service {
    pub name: String,
    pub info: String,
    pub data_uptimes: Vec<i8>,
    pub status: i8,
}
