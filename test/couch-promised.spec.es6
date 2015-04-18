import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import nock from 'nock';

import Couch from '../src/couch-promised';

chai.use(chaiAsPromised);
let expect = chai.expect;

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
});
