import 'core-js/shim';
import http from 'http';

export default class CouchPromised {

  // Create a new CouchPromised instance. Requires a URL to a database on a
  // running CouchDB server. If the database does not exist it will be created.
  // Optionally also takes a Node HTTP agent, and uses the default global agent
  // if one is not provided.
  constructor( config = {} ) {

    // If custom configuration options are not provided the instance will try
    // to use a local database running on the CouchDB default port.
    this.config = Object.assign({}, config, {
      host: '127.0.0.1',
      port: 5984,
    });

    if ( typeof config.path !== 'string' ) {
      throw new Error('CouchPromised requires a path to a database.');
    }
  }

  // Create the database at the path specified when the instance was created.
  // Databases in CouchDB are created by performing a simple PUT request to a
  // non-existent database.
  createDB() {
    return this.request('PUT', '');
  }

  // Delete the database at the path specified when the instance was created.
  deleteDB() {
    return this.request('DELETE', '');
  }

  // Get an individual document by its unique identifier.
  get( id ) {
    return this.request('GET', `/${ id }`);
  }

  // Get multiple documents by their unique identifiers. If the first parameter
  // is an array it's treated as an array of identifiers. If it's anything else
  // we assume the identifiers have been provided as individual parameters.
  fetch( ids ) {

    if ( !Array.isArray(ids) ) {
      ids = Array.from(arguments);
    }

    return this.request('POST', '/_all_docs?include_docs=true', {
      keys: ids,
    })
    .then(( response ) => response.rows.map(( row, i ) => {

      if ( row.error || !row.doc ) {
        throw new Error(`Document with ID ${ ids[ i ] } not found.`);
      }

      return row.doc;
    }));
  }

  // Insert a new document. This will also allow for updating an existing
  // document if a revision is present on the parameter object. If an ID is
  // present a PUT request is made to that ID. If not, a POST is made to the
  // main database URL.
  insert( doc ) {

    let path = doc._id;
    let promise;

    if ( path ) {
      promise = this.request('PUT', `/${ path }`, doc);
    } else {
      promise = this.request('POST', '', doc);
    }

    return promise
    .then(( res ) => {

      // Normalize the response data. When retrieving documents the identifier
      // and revision properties are always prefixed with an underscore so we
      // make that consistent here.
      return {
        _id: res.id,
        _rev: res.rev,
      };
    });
  }

  // Update an existing document. Existing documents will always have an _id
  // property. Requires that the value of the _rev property match that stored
  // in the database.
  update( doc ) {

    validateDocument(doc);
    return this.insert(doc);
  }

  // Delete an existing document.
  delete( doc ) {

    validateDocument(doc);
    return this.request('DELETE', `/${ doc._id }?rev=${ doc._rev }`, doc);
  }

  // The base request method. Most of the other methods are sugar around this.
  // Requires an HTTP method and a URL path which will be appended to the
  // instance-wide database URL. Optionally also takes a request body in the
  // form of an object. If present this object will be serialized and sent as
  // an HTTP request body to the aforementioned URL.
  request( method, path, body ) {

    // We need both an HTTP method an a path to append to the instance-wide
    // database URL. If either of those is not present we cannot continue.
    if ( typeof method !== 'string' || typeof path !== 'string' ) {
      throw new Error('CouchPromised#request requires a method and a path');
    }

    // Build up the request options. CouchDB requests and responses will always
    // be JSON so the Content-Type and Accepts headers are hard-coded. The rest
    // of the options are configurable either via the CouchPromised instance or
    // the call to this method.
    let options = {
      headers: {
        'content-type': 'application/json',
        'accepts': 'application/json',
      },
      host: this.config.host,
      port: this.config.port,
      path: `${ this.config.path }${ path }`,
      agent: this.config.agent,
      method,
    };

    // Make an HTTP request to the CouchDB server and return a promise for a
    // response. The promise will be rejected with any error from the database
    // or will be resolved with all response data once the connection closes.
    return new Promise(( resolve, reject ) => {

      let request = http.request(options, ( response ) => {

        let buffer = '';

        response.on('data', ( chunk ) => {
          buffer += chunk;
        });

        response.on('end', () => {
          resolve(buffer && JSON.parse(buffer));
        });
      });

      request.on('error', ( err ) => {
        reject(err);
      });

      // If we need to send data to the server we write a serialized copy of it
      // to the request body now.
      if ( body ) {
        request.write(JSON.stringify(body));
      }

      // All relevant event handlers have been registered so it's now safe to
      // send the request.
      request.end();
    });
  }
}

// Ensure a document has an _id property and a _rev property. This should be
// the case for any existing document and both properties must be present for
// any operations that modify a document.
function validateDocument( doc ) {

  if ( !doc.hasOwnProperty('_id') ) {
    throw new Error('An _id property is required to modify a document.');
  }

  if ( !doc.hasOwnProperty('_rev') ) {
    throw new Error('A _rev property is required to modify a document.');
  }

  return true;
}
