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
      nock('http://127.0.0.1:5984').get('/test-db/1').reply(200, response);
      return expect(couch.request('get', '/1')).to.eventually.become(response);
    });

    it('should reject with the server error on error', () => {
      let response = new Error('fail');
      nock('http://127.0.0.1:5984').get('/test-db/1').replyWithError(response);
      let promise = couch.request('get', '/1');
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
});
