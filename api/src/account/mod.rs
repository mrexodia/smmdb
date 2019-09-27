mod request;
mod response;

pub use request::*;
pub use response::*;

use crate::session::AuthSession;

use mongodb::oid::ObjectId;
use mongodb::ordered::OrderedDocument;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Account {
    #[serde(rename = "_id")]
    id: ObjectId,
    googleid: String,
    username: String,
    email: String,
    apikey: String,
    downloadformat: Option<DownloadFormat>,
    session: Option<AuthSession>,
    permissions: Option<i32>,
}

impl From<OrderedDocument> for Account {
    fn from(document: OrderedDocument) -> Account {
        Account {
            id: document
                .get_object_id("_id")
                .expect("[Account::from] id unwrap failed")
                .to_owned(),
            googleid: document
                .get_str("googleid")
                .expect("[Account::from] googleid unwrap failed")
                .to_string(),
            username: document
                .get_str("username")
                .expect("[Account::from] username unwrap failed")
                .to_string(),
            email: document
                .get_str("email")
                .expect("[Account::from] email unwrap failed")
                .to_string(),
            apikey: document
                .get_str("apikey")
                .expect("[Account::from] apikey unwrap failed")
                .to_string(),
            downloadformat: document
                .get_i32("downloadformat")
                .ok()
                .map(|format| format.into()),
            session: document
                .get_document("session")
                .ok()
                .map(|session| session.clone().into()),
            permissions: None,
        }
    }
}

impl Account {
    pub fn new(account: AccountReq, id: ObjectId, session: AuthSession) -> Self {
        Account {
            id,
            googleid: account.googleid,
            username: account.username,
            email: account.email,
            apikey: "".to_string(),
            downloadformat: None,
            session: Some(session),
            permissions: None,
        }
    }

    pub fn get_id(self) -> ObjectId {
        self.id
    }

    pub fn get_id_ref(&self) -> &ObjectId {
        &self.id
    }

    pub fn get_username(&self) -> &String {
        &self.username
    }
}

#[derive(Debug, Serialize)]
enum DownloadFormat {
    WiiU = 0,
    N3DS = 1,
    Protobuf = 2,
}

impl Default for DownloadFormat {
    fn default() -> Self {
        Self::WiiU
    }
}

impl From<i32> for DownloadFormat {
    fn from(i: i32) -> Self {
        match i {
            0 => DownloadFormat::WiiU,
            1 => DownloadFormat::N3DS,
            2 => DownloadFormat::Protobuf,
            _ => panic!(),
        }
    }
}

impl Into<i32> for DownloadFormat {
    fn into(self: DownloadFormat) -> i32 {
        match self {
            Self::WiiU => 0,
            Self::N3DS => 1,
            Self::Protobuf => 2,
        }
    }
}