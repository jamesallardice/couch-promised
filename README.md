# couch-promised

A promise-based wrapper around CouchDB. CouchPromised does not aim to be a full-
featured CouchDB client and instead aims to provide a minimal set of methods for
some of the most common interactions.

## Installation

The package is available through npm and can be installed as usual:

```sh
npm install --save couch-promised
```

Once installed you can import the package into your script as usual:

```js
var CouchPromised = require('couch-promised');
```

## Usage

The `CouchPromised` variable above refers to a constructor function. You must
create instance before you can interact with a database:

```js
var couch = new CouchPromised({
  host: 'example.com',   // Your CouchDB server. Defaults to 127.0.0.1.
  port: 5984,            // Port of CouchDB server. Defaults to 5984.
  path: '/my-database',  // Path to a database stored on the CouchDB instance.
});
```
