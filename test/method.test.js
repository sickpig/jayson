var should = require('should');
var jayson = require('./../');
var support = require('./support');

describe('jayson.method', function() {

  var Method = jayson.Method;

  it('should return an instance when called as a function', function() {
    Method(function() {}).should.be.instanceof(Method);
  });

  describe('instance', function() {

    var method = null;

    beforeEach(function() {
      method = new Method();
    });

    it('should have some default options', function() {
      method.options.should.containDeep({
        useContext: false
      });
    });

    describe('getHandler and setHandler', function() {

      var fn = function() {};

      it('should accept the "handler" argument in the options object in the constructor', function() {
        method = new Method({handler: fn});
        method.getHandler().should.equal(fn);
      });

      it('should return the handler with get if set', function() {
        method.setHandler(fn);
        method.getHandler().should.equal(fn);
      });

      it('should return the handler function when given in constructor', function() {
        var method = new Method(fn);
        method.getHandler().should.equal(fn);
      });
    
    });

    describe('execute', function() {

      var server = null;

      beforeEach(function() {
        server = new jayson.Server();
      });

      describe('options.params Array', function() {

        var add = function(args, callback) {
          args.should.be.instanceof(Array);
          callback(null, args.reduce(function(sum, value) {
            return sum + value;
          }, 0));
        };

        beforeEach(function() {
          method = new Method(add, {
            params: Array
          });
        });

        it('should pass named params as an array', function(done) {
          method.execute(server, {a: 1, b: 2, c: 3}, function(err, sum) {
            if(err) return done(err);
            sum.should.eql(1 + 2 + 3);
            done();
          });
        });

        it('should pass array params as given', function(done) {
          method.execute(server, [1, 2, 3, 4], function(err, sum) {
            if(err) return done(err);
            sum.should.eql(1 + 2 + 3 + 4);
            done();
          });
        });
      
      });

      describe('options.params Object', function() {

        var add = function(args, callback) {
          args.should.be.instanceof(Object);
          args.should.not.be.instanceof(Array);

          var sum = 0;
          for(var name in args) {
            sum += args[name];
          }

          callback(null, sum);

        };

        beforeEach(function() {
          method = new Method(add, {
            params: Object
          });
        });

        it('should pass a param object as given', function(done) {
          method.execute(server, {a: 1, b: 2, c: 3}, function(err, sum) {
            if(err) return done(err);
            sum.should.eql(1 + 2 + 3);
            done();
          });
        });

        it('should cast an array to an object', function(done) {
          method.execute(server, [1, 2, 3, 4], function(err, sum) {
            if(err) return done(err);
            sum.should.eql(1 + 2 + 3 + 4);
            done();
          });
        });
      
      });

      describe('options.params list of params', function() {

        var add = function(args, callback) {
          args.should.be.instanceof(Object);
          args.should.not.be.instanceof(Array);
          args.should.have.keys('a', 'b', 'c');
          var sum = (args.a || 0) + (args.b || 0) + (args.c || 0);
          callback(null, sum);
        };

        beforeEach(function() { 
          method = new Method(add, {
            params: ['a', 'b', 'c']
          });
        });

        it('should replace missing params with undefined', function(done) {
          method.execute(server, {a: 1}, function(err, sum) {
            if(err) return done(err);
            sum.should.eql(1);
            done();
          });
        });

        it('should leave all params as undefined when given an array', function(done) {
          method.execute(server, [1,2,3], function(err, sum) {
            if(err) return done(err);
            sum.should.eql(0);
            done();
          });
        });
      
      });

      describe('options.params map of default values', function() {

        var add = function(args, callback) {
          args.should.be.instanceof(Object);
          args.should.not.be.instanceof(Array);

          args.should.have.property('a').and.be.instanceof(Number);
          args.should.have.property('b').and.be.instanceof(Number);
          args.should.have.property('c').and.be.instanceof(Number);

          var sum = args.a + args.b + args.c;
          callback(null, sum);
        };

        beforeEach(function() {
          method = new Method(add, {
            params: {a: 0, b: 0, c: 0}
          });
        });

        it('should fill in missing properties with named param values as defaults', function(done) {
          method.execute(server, {a: 5}, function(err, sum) {
            if(err) return done(err);
            sum.should.eql(5);
            done();
          });
        });

        it('should fill in defaults when given an array', function(done) {
          method.execute(server, [1,2,3], function(err, sum) {
            if(err) return done(err);
            sum.should.eql(0);
            done();
          });
        });
      
      });

      describe('options.params undefined', function() {

        var add = function(args, callback) {

          if(args instanceof Array) {

            // given Array
            return callback(null, args.reduce(function(sum, value) {
              return sum + value;
            }, 0));

          } else {

            // given Object
            var sum = 0;
            for(var name in args) {
              sum += args[name];
            }

            return callback(null, sum);
          }

        };

        it('should pass an array when given an array', function(done) {
          var fn = function(args, callback) {
            args.should.be.instanceof(Array);
            callback();
          };

          method = new Method(fn);
          method.execute(server, [1,2,3], done);
        });

        it('should pass an object when given an object', function(done) {
          var fn = function(args, callback) {
            args.should.not.be.instanceof(Array);
            args.should.be.instanceof(Object);
            callback();
          };

          method = new Method(fn);
          method.execute(server, {a: 1, b: 2, c: 3}, done);
        });
      
      });

      describe('options.useContext', function() {

        it('should pass an extra object to the handler when option is true and an object is given', function(done) {
          const fn = function(args, context, callback) {
            callback(null, context);
          };
          const method = new Method(fn, {useContext: true});
          const context = {hello: true};
          method.execute(server, {}, context, function(err, response) {
            if(err) return done(err);
            should(response).eql(context);
            done();
          });
        });

        it('should pass an extra object to the handler when option is true and no object is given', function(done) {
          const fn = function(args, context, callback) {
            callback(null, context);
          };
          const method = new Method(fn, {useContext: true});
          method.execute(server, {}, function(err, response) {
            if(err) return done(err);
            should(response).eql({});
            done();
          });
        });

        it('should not pass an extra object to the handler when option is false even if given', function(done) {
          const fn = function(args, callback) {
            callback(null, {});
          };
          const method = new Method(fn, {useContext: false});
          const context = {hello: true};
          method.execute(server, {}, context, function(err, response) {
            if(err) return done(err);
            should(response).eql({});
            done();
          });
        });
      
      });
    
    });
  
  });

});
