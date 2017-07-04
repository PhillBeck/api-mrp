let sync = require('async')

class BaseOperations {

    constructor(server, request) {
        this.server = server;
        this.request = request;
    }

    addNF(object, expect, callback) {
        var _self = this;
        this.request(this.server.listener)
            .post('/nfs')
            .send(object)
            .end(function(err, res) {
                if (err) return callback(err);
                expect(res.statusCode).to.equal(201);
                _self.nf = res.body;
                callback(undefined, res)
            });
    }

    executeSequece(fn, done) {
        var _self = this;
        sync.mapSeries(fn, function(data, callback) {
            _self[data.fn](data.object, _self.expect, (err, result) => {
                return callback(null, result.body);
            })
        }, (err, result) => {
            done(err, result)
        });
    }

    setExpect(expect) {
        this.expect = expect;
    }
}


module.exports = {
    BaseOperations: BaseOperations
}
