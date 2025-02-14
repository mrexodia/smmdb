use crate::database::Database;
use crate::routes::{courses, courses2, index, swagger};

use actix_web::{middleware, App, HttpServer};
use std::sync::{Arc, Mutex};

pub struct Server {}

pub struct ServerData {
    pub database: Arc<Mutex<Database>>,
}

impl Server {
    pub fn start(database: Arc<Mutex<Database>>) -> std::io::Result<()> {
        std::env::set_var("RUST_LOG", "actix_web=debug");
        env_logger::init();

        HttpServer::new(move || {
            App::new()
                .data(ServerData {
                    database: Arc::clone(&database),
                })
                .wrap(middleware::Compress::default())
                .wrap(middleware::Logger::default())
                .service(index)
                .service(swagger)
                .service(courses::service())
                .service(courses2::service())
        })
        .bind("0.0.0.0:3030")?
        .workers(1)
        .run()
    }
}

impl ServerData {
    pub fn get_courses(
        &self,
        query: courses::GetCourses,
    ) -> Result<String, courses::GetCoursesError> {
        let database = self
            .database
            .lock()
            .expect("[ServerData::get_courses] lock() failed");
        match query.into_ordered_document(&database) {
            Ok(query) => Ok(database.get_courses(query)),
            Err(error) => Err(error),
        }
    }

    pub fn get_courses2(
        &self,
        query: courses2::GetCourses2,
    ) -> Result<String, courses2::GetCourses2Error> {
        let database = self
            .database
            .lock()
            .expect("[ServerData::get_courses] lock() failed");
        match query.into_ordered_document(&database) {
            Ok(query) => Ok(database.get_courses2(query)),
            Err(error) => Err(error),
        }
    }
}
