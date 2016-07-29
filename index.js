"use strict"

const DATABASE_MYSQL = 'mysql';
const SUPPORT_DATABASE = [DATABASE_MYSQL];

function CPM (options) {
  this._type = options.type ? options.type.toLowerCase() : options.type;
  if (!this._type || SUPPORT_DATABASE.indexOf(this._type) === -1) {
    throw new Error(`[ERROR] database type doesn't support: ${this._type}`);
  }

  this._host = options.host || 'localhost';
  this._user = options.user || undefined;
  this._password = options.password || undefined;
  this._database = options.database || undefined;
  this._connectionLimit = options.connectionLimit || 10;

  this._allConnections = [];
  this._availableConnections = [];
  this._connectionQueue = [];
}

CPM.prototype.acquire = function(cb) {
  let connection = null;

  if (this._availableConnections.length > 0) {
    connection = this._availableConnections.shift();
    cb(null, connection);
    return;
  }

  if (this._allConnections.length < this._connectionLimit) {
    connection = this._createConnection();
    connection.connect((err) => {
      if (err) {
        err = new Error('Can not connect to server');
        cb(err, connection);
      }

      this._allConnections.push(connection);
      cb(null, connection);
    });
    return;
  }

  this._connectionQueue.push(cb);
}

CPM.prototype.release = function(connection) {
  this._availableConnections.push(connection);
  if (this._connectionQueue.length > 0) {
    this.acquire(this._connectionQueue.shift());
  }
}

CPM.prototype._createConnection = function() {
  let connection = null;
  switch (this._type) {
    case DATABASE_MYSQL:
      let mysql = require(DATABASE_MYSQL);
      connection = mysql.createConnection({
        host: this._host,
        user: this._user,
        password: this._password,
        database:this._database
      });
      break;
  }
  return connection;
}
