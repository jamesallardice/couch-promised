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

    // The body parameter is optional. If a value was provided for it we add a
    // serialized copy of it to the request options.
    if ( body ) {
      options.body = JSON.stringify(body);
    }

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

      // All relevant event handlers have been registered so it's now safe to
      // send the request.
      request.end();
    });
  }
}
