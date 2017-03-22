
/**
 * Module dependencies.
 */
const should = require('should'),
  //  app = require('../../server'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  User = mongoose.model('User', new Schema({}));

//  Globals
let user;

//  The tests
describe('<Unit Test>', () => {
  describe('Model User:', () => {
    before((done) => {
      user = new User({
        name: 'Full name',
        email: 'test@test.com',
        username: 'user',
        password: 'password'
      });
      done();
    });
    describe('Method Save', () => (
      it('should be able to save whithout problems', (done) => {
        return user.save((err) => {
          should.not.exist(err)
          done()
        });
      });

      it('should be able to show an error when try to save witout name', (done) => (
        user.name = '';
        user.save(function(err) {
            should.exist(err);
            done();
        });
      ));
    });

  after(function(done) {
      done();
  });
  });
});
