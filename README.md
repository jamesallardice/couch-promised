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

### API

As mentioned previously, CouchPromised does not attempt to cover all possible
CouchDB functionality. At its heart is the `request` method, to which all other
methods delegate. If you need more fine-grained control over a request you may
find that method useful.

#### `get( id )`

Find an individual document by unique identifier:

```js
couch.get('my-doc-id').then(function ( doc ) {
  // 'doc' will be an object corresponding to the latest revision of the stored
  // document.
});
```

#### `fetch( ...ids )`

Find many documents by unique identifiers. Takes an array or alternatively any
number of separate parameters:

```js
couch.fetch('my-doc-id-1', 'my-doc-id-2').then(function ( docs ) {
  // 'docs' will be an array of objects corresponding the the latest revisions
  // of the stored documents.
});
```

#### `insert( doc )`

Create a new document. If the provided object has an `_id` property that does
not already exist in the database the new document will be created with that
identifier. If a document already exists and the provided object doesn't have
a valid `_ref` property an error will be thrown. The `update` method is better
suited to that situation.

```js
couch.insert({ something: 1, another: 'x' }).then(function ( res ) {
  // 'res' will be an object with '_id' and '_rev' properties corresponding to
  // the newly stored document.
});
```

#### `update( doc )`

Update an existing document. The provided object must have an `_id` property
that corresponds to a stored document and a `_rev` property that matches the
latest revision of that stored document.

```js
couch.update({ _id: 'my-doc-id', _rev: 1 }).then(function ( res ) {
  // 'res' will be an object with '_id' and '_rev' properties corresponding to
  // the updated document.
});
```

#### `destroy( doc )`

Delete an existing document. The provided object must have an `_id` property
that corresponds to a stored document and a `_rev` property that matches the
latest revision of that stored document.

```js
couch.destroy({ _id: 'my-doc-id', _rev: 1 }).then(function ( res ) {
  // 'res' will be an object with '_id' and '_rev' properties corresponding to
  // the deleted document.
});
```

#### `view( designDocument , viewName [, viewParameters ] )`

Query a database view. Requires the name of a design document and the name of a
view within that document. Optionally also takes a map of view parameters to
their values. The parameters object can contain any of the parameters a CouchDB
view normally accepts. It is converted to a querystring and appended to the
request URL.

```js
couch.view('a-design', 'a-view', { key: 'some-key' }).then(function ( rows ) {
  // 'rows' will be an array of rows returned by the view. Note that the rows
  // are not documents themselves but may have a 'doc' property if e.g. the
  // 'include_docs' parameter was included.
});
```

#### `viewDocs( designDocument , viewName [, viewParameters ] )`

Query a database view and return the document associated with each result. This
is effectively sugar around a call to `view` with the `include_docs` parameter
set.

```js
couch.viewDocs('a-design', 'a-view').then(function ( docs ) {
  // 'docs' will be an array of documents associated with the rows returned by
  // the view.
});
```

#### `bulk( docs )`

Perform a bulk insert or update of documents. Requires an array of documents.
Any element of that array with an `_id` property that corresponds to a document
already stored in the database must also have the correct `_rev` property.

```js
couch.bulk([ { x: 1 }, { y: 2 } ]).then(function ( res ) {
  // 'res' will be an array of objects with '_id' and '_rev' properties
  // corresponding to the inserted or updated document.
});
```

#### `request( method , path [, body ] )`

Send an HTTP request to the CouchDB database. Requires an HTTP method and a URL
path. Optionally also takes an object representing the request body.

```js
couch.request('GET', '/my-doc-id').then(function ( res ) {
  // 'res' will be an object representing the raw HTTP response from CouchDB.
  // The other CouchPromised methods take that response and resolve with the
  // relevant data from within it.
});
```
