import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import nock from 'nock';

import Couch from '../src/couch-promised';

chai.use(chaiAsPromised);
let expect = chai.expect;

const DB_URL = 'http://127.0.0.1:5984';

describe('CouchPromised', () => {

  let couch;

  beforeEach(() => {
    couch = new Couch({ path: '/test-db' });
  });

  it('should be a constructor function', () => {
    expect(Couch).to.be.a('function');
  });

  describe('constructor', () => {

    it('should throw an error if no database path is provided', () => {
      let test = () => new Couch();
      expect(test).to.throw(Error, /path/);
    });
  });

  describe('#request', () => {

    it('should throw an error if not passed an HTTP method', () => {
      let test = () => couch.request('/my-resource');
      expect(test).to.throw(Error, /request requires/);
    });

    it('should return a promise', () => {
      expect(couch.request('get', '/1')).to.be.an.instanceOf(Promise);
    });

    it('should resolve to the server response on success', () => {
      let response = { done: true };
      nock('http://127.0.0.1:5984').get('/test-db/pass').reply(200, response);
      return expect(couch.request('get', '/pass')).to.eventually.become(response);
    });

    it('should reject with the server error on error', () => {
      let response = new Error('fail');
      nock('http://127.0.0.1:5984').get('/test-db/fail').replyWithError(response);
      let promise = couch.request('get', '/fail');
      return expect(promise).to.be.rejectedWith(Error, 'fail');
    });
  });

  describe('#createDB', () => {

    it('should make a PUT request to the configured path', () => {
      let response = { ok: true };
      nock(DB_URL).put('/test-db', {}).reply(201, response);
      return expect(couch.createDB()).to.eventually.become(response);
    });
  });

  describe('#deleteDB', () => {

    it('should make a DELETE request to the configured path', () => {
      let response = { ok: true };
      nock(DB_URL).delete('/test-db', {}).reply(200, response);
      return expect(couch.deleteDB()).to.eventually.become(response);
    });
  });

  describe('#get', () => {

    it('should make a GET request to the specified path', () => {
      let response = { _id: 2 };
      nock(DB_URL).get('/test-db/2').reply(200, response);
      return expect(couch.get('2')).to.eventually.become(response);
    });
  });

  describe('#fetch', () => {

    it('should make a POST request to the specified path', () => {

      let response = {
        rows: [
          { id: '3', key: '3', doc: { _id: 3 } },
          { id: '4', key: '4', doc: { _id: 4 } },
        ],
      };

      nock(DB_URL).post('/test-db/_all_docs?include_docs=true')
      .reply(200, response);

      return expect(couch.fetch([ '3', '4' ]))
      .to.eventually.become([ { _id: 3 }, { _id: 4 } ]);
    });

    it('should convert an arguments list into an array', () => {

      let response = {
        rows: [
          { id: '5', key: '5', doc: { _id: 5 } },
          { id: '6', key: '6', doc: { _id: 6 } },
        ],
      };

      nock(DB_URL).post('/test-db/_all_docs?include_docs=true')
      .reply(200, response);

      return expect(couch.fetch('5', '6'))
      .to.eventually.become([ { _id: 5 }, { _id: 6 } ]);
    });

    it('should throw an error if a document is not found', () => {

      let response = {
        rows: [
          { id: '5', key: '7', doc: { _id: 5 } },
          { key: 'missing', error: 'not_found' },
        ],
      };

      nock(DB_URL).post('/test-db/_all_docs?include_docs=true')
      .reply(200, response);

      return expect(couch.fetch('7', '8'))
      .to.be.rejectedWith(Error, /not found/);
    });
  });

  describe('#insert', () => {

    it('should make a POST request when given data with no ID', () => {

      nock(DB_URL).post('/test-db')
      .reply(201, { id: 123, rev: 1 });

      return expect(couch.insert({ name: 'test' }))
      .to.eventually.become({ _id: 123, _rev: 1 });
    });

    it('should make a PUT request when given data with an ID', () => {

      nock(DB_URL).put('/test-db/123')
      .reply(201, { id: 123, rev: 1 });

      return expect(couch.insert({ _id: 123, name: 'test' }))
      .to.eventually.become({ _id: 123, _rev: 1 });
    });
  });

  describe('#update', () => {

    it('should throw an error if given a document with no ID', () => {
      let test = () => couch.update({});
      expect(test).to.throw(Error, /_id property/);
    });

    it('should throw an error if given a document with no revision', () => {
      let test = () => couch.update({ _id: 1 });
      expect(test).to.throw(Error, /_rev property/);
    });

    it('should make a PUT request when given a valid document', () => {

      nock(DB_URL).put('/test-db/to-update')
      .reply(201, { id: 'to-update', rev: 2 });

      return expect(couch.update({ _id: 'to-update', _rev: 1 }))
      .to.eventually.become({ _id: 'to-update', _rev: 2 });
    });
  });

  describe('#delete', () => {

    it('should throw an error if given a document with no ID', () => {
      let test = () => couch.delete({});
      expect(test).to.throw(Error, /_id property/);
    });

    it('should throw an error if given a document with no revision', () => {
      let test = () => couch.delete({ _id: 1 });
      expect(test).to.throw(Error, /_rev property/);
    });

    it('should make a DELETE request when given a valid document', () => {

      nock(DB_URL).put('/test-db/to-delete')
      .reply(201, { id: 'to-delete', rev: 2 });

      return expect(couch.update({ _id: 'to-delete', _rev: 1 }))
      .to.eventually.become({ _id: 'to-delete', _rev: 2 });
    });
  });

  describe('#view', () => {

    it('should make a GET request to a given view', () => {

      let rows = [ { id: 1, key: [ 2, 3 ], value: null } ];

      nock(DB_URL).get('/test-db/_design/d/_view/v')
      .reply(200, { rows });

      return expect(couch.view('d', 'v'))
      .to.eventually.become(rows);
    });
  });
});
