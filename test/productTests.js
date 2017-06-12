const assert = require('assert'),
	config = require('./config'),
	expect = require('chai').expect,
	request = require('supertest'),
	fs = require('fs'),
	async = require('async');

	messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));

exports.run = function(server) {
	describe('Products', function() {

		describe('Create Product', function() {
			describe('Valid Product', function() {

				var createdProduct = {};

				it('#Should save', function(done) {

					let testProduct = new config.Product();

					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(201);
						createdProduct = res.body;
						done();
					});
				});
			});

			describe('Invalid Product', function() {
				it('Missing code - Should return 400', function(done) {
					let testProduct = new config.Product();
					delete testProduct.code;
					
					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(400);
						done();
					});
				});

				it('Missing name - Should return 400', function(done) {
					let testProduct = new config.Product();
					delete testProduct.name;
					
					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(400);
						done();
					});
				});

				it('Not unique code - Should return 422', function(done) {
					var testProduct = new config.Product();
					
					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						request(server.listener)
						.post('/products')
						.send(testProduct)
						.end(function(e, res) {
							if (e) return done(e);
							expect(res.statusCode).to.equal(422);
							expect(res.body.message).to.include('code');
							done();
						});
					});
				});


				it('Invalid productType - Should return 422', function(done) {
					let testProduct = new config.Product();
					testProduct.productType = 3;
					
					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(422);
						expect(res.body.message).to.contain('[1,2]')
						done();
					});
				});
			});
		});

		describe('Get Products', function() {

			var testProduct = new config.Product();


			before(function(done) {
				request(server.listener)
				.post('/products')
				.send(testProduct)
				.end(function(err, res) {
					if (err) return done(err);
					testProduct = res.body;
					done();
				});
			});

			describe('Valid Inputs', function() {

				it('List products', function(done) {
					request(server.listener)
					.get('/products')
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(200);
						expect(res.body.page).to.equal(1);
						expect(res.body.pages).to.be.at.least(1);
						expect(res.body.total).to.be.at.least(1);
						expect(res.body.limit).to.equal(15);
						expect(res.body.docs).to.be.an('Array');
						done();
					});
				});

				it('Valid query', function(done) {
					request(server.listener)
					.get('/products?_search=code:' + testProduct.code)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(200);
						expect(res.body.page).to.equal(1);
						expect(res.body.pages).to.equal(1);
						expect(res.body.total).to.equal(1);
						expect(res.body.limit).to.equal(15);
						expect(res.body.docs).to.include(testProduct);
						done();
					});
				});


				it('getById', function(done) {
					request(server.listener)
					.get('/products/' + testProduct._id)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.eql(testProduct);
						done();
					});
				});
			});

			describe('Invalid Inputs', function() {

				it('Invalid Search - should return 400', function(done) {
					request(server.listener)
					.get('/products?_search=_page=2')
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(400);
						expect(res.body.message).to.equal(messages["httpUtils.badQuery"]);
						done();
					});
				});

				it('Inexistent page - shold return empty array', function(done) {
					request(server.listener)
					.get('/products')
					.end(function(err, res) {
						if (err) return done(err);
						let invalidPage = res.body.pages + 1;
						request(server.listener)
						.get('/products?_page=' + invalidPage)
						.end(function(e, res) {
							if (e) return done(e);
							expect(res.body.docs).to.be.an('Array');
							expect(res.body.docs).to.be.empty;
							done();
						});
					});
				});

				it('getById inexistent Id - should return 404', function(done) {
					request(server.listener)
					.get('/products/012345678901234567890123')
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(404);
						expect(res.body.message).to.equal('Produto não encontrado.');
						done();
					});
				});
			});
		});

		describe('Update Products', function() {

			var testProduct = new config.Product();

			before(function(done) {
				request(server.listener)
				.post('/products')
				.send(testProduct)
				.end(function(err, res) {
					if (err) return done(err);
					testProduct = res.body;
					done();
				});
			});

			describe('Valid input', function() {

				it('Should Update', function() {
					testProduct.name = 'updatedName';

					request(server.listener)
					.put('/products/' + testProduct._id)
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(204);
						request(server.listener)
						.get('/products/' + testProduct._id)
						.end(function(err, res) {
							if (err) return done(err);
							expect(res.body.name).to.eql(testProduct.name);
							done();
						});
					});
				});
			});


			describe('Invalid Input', function() {

				it('Inexistent Id - should return 404', function(done) {
					testProduct.productType = 1;
					request(server.listener)
					.put('/products/012345678901234567890123')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(404);
						done();
					})
				});
			});
		});

		describe('Remove Products', function() {

			describe('Valid Input', function() {

				var testProduct = new config.Product();

				before(function(done) {
					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						testProduct = res.body
						done();
					});
				});

				it('Should delete', function(done) {
					request(server.listener)
					.delete('/products/' + testProduct._id)
					.end(function(err, res) {
						if (err) return done(err);
						
						expect(res.statusCode).to.equal(204);
						
						request(server.listener)
						.get('/products/' + testProduct._id)
						.end(function(err,res) {
							if (err) return done(err);

							expect(res.statusCode).to.equal(404);
							done();
						})
					});
				});
			});

			describe('Invalid Input', function() {

				var testProduct = new config.Product();

				before(function(done) {
					request(server.listener)
					.post('/products')
					.send(testProduct)
					.end(function(err, res) {
						if (err) return done(err);
						testProduct = res.body
						done();
					});
				});

				it('Inexistent Id - Should return 404', function(done) {
					request(server.listener)
					.delete('/products/012345678901234567890123')
					.end(function(err, res) {
						expect(res.statusCode).to.equal(404);
						done();
					});
				});

				it('Double delete - should return 404', function(done) {
					request(server.listener)
					.delete('/products/' + testProduct._id)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(204);

						request(server.listener)
						.delete('/products/' + testProduct._id)
						.end(function(err, res) {
							if (err) return done(err);
							expect(res.statusCode).to.equal(404);
							done();
						});
					});
				});
			});
		});

		describe('Add children', function() {
			
			var testProducts = [];

			before(function(done) {
				async.times(7, function(n, next) {
					request(server.listener)
					.post('/products')
					.send(new config.Product())
					.end(function(err, res) {
						next(err, res.body);
					});
				}, function(err, docs) {
					if (err) return done(err);
					testProducts = docs;
					done();
				});
			});

			describe('Valid Input', function() {
				it('Should add', function(done) {
					request(server.listener)
					.put('/products/' + testProducts[0]._id + '/children/' + testProducts[1]._id)
					.send({quantity: 1})
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(204);
						
						request(server.listener)
						.get('/products/' + testProducts[0]._id + '/children')
						.end(function(err, res) {
							if (err) return done(err);
							expect(res.statusCode).to.equal(200);
							expect(res.body[0].data._id).to.equal(testProducts[0]._id);
							expect(res.body[0].children[0].data._id).to.equal(testProducts[1]._id);
							expect(res.body[0].children[0].data.quantity).to.equal(1);
							done();
						});
					});
				});
			});

			describe('Invalid Input', function() {
				it('Inexistent Parent - Should return 404', function(done) {
					request(server.listener)
					.put('/products/012345678901234567890123/children/' + testProducts[1]._id)
					.send({quantity: 1})
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(404);
						done();
					});
				});

				it('Inexistent children - should return 404', function(done) {
					request(server.listener)
					.put('/products/' + testProducts[0]._id + '/children/012345678901234567890123')
					.send({quantity: 1})
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(404);
						done();
					});
				});

				it('Invalid payload - should return 400', function(done) {
					request(server.listener)
					.put('/products/' + testProducts[0]._id + '/children/' + testProducts[1]._id)
					.end(function(err, res) {
						if (err) return done(err);
						expect(res.statusCode).to.equal(400);
						done();
					})
				});

				it('Circular Dependencies - should return 422', function(done) {
					async.times(2, function(n, next) {
						request(server.listener)
						.put('/products/' + testProducts[n+2]._id + '/children/' + testProducts[n+3]._id)
						.send({quantity: 1})
						.end(function(err, res) {
							next()
						});
					}, function (err, docs){
						request(server.listener)
						.put('/products/' + testProducts[4]._id + '/children/' + testProducts[2]._id)
						.send({quantity: 1})
						.end(function(err, res) {
							if (err) return done(err);
							expect(res.statusCode).to.equal(422);
							expect(res.body.message).to.contain('circular');
							done();
						});
					});
				});

				it('SoftDeleted Parent - should return 404', function(done) {
					request(server.listener)
					.delete('/products/' + testProducts[5]._id)
					.end(function(err, res) {
						if (err) return done(err);

						request(server.listener)
						.put('/products/' + testProducts[5]._id + '/children/' + testProducts[2]._id)
						.send({quantity: 1})
						.end(function(err, res) {
							if (err) return done(err);
							expect(res.statusCode).to.equal(404);
							done();
						});
					});
				});

				it('Softdeleted Children - should return 404', function(done) {
					request(server.listener)
					.delete('/products/' + testProducts[6]._id)
					.end(function(err, res) {
						if (err) return done(err);

						request(server.listener)
						.put('/products/' + testProducts[1]._id + '/children/' + testProducts[6]._id)
						.send({quantity: 1})
						.end(function(err, res) {
							if (err) return done(err);
							expect(res.statusCode).to.equal(404);
							done();
						});
					});
				});
			});
		});

		describe('Remove children', function() {

			describe('Valid Input', function() {

				var testProducts = [];

				before(function(done) {
					async.times(2, function(n, next) {
						request(server.listener)
						.post('/products')
						.send(new config.Product())
						.end( function(err, res) {
							next(err, res.body);
						})
					},function(err, docs) {
						testProducts = docs;
						request(server.listener)
						.put('/products/' + docs[0]._id + '/children/' + docs[1]._id)
						.send({quantity: 1})
						.end(function(err, res) {
							done();
						})
					});
				});

				it('Should remove', function(done) {
					request(server.listener)
					.delete('/products/' + testProducts[0]._id + '/children/' + testProducts[1]._id)
					.end(function(err, res) {
						if (err) return done(err);

						expect(res.statusCode).to.equal(204);

						request(server.listener)
						.get('/products/' + testProducts[0]._id + '/children')
						.end(function(err, res) {
							expect(res.body[0].data._id).to.equal(testProducts[0]._id);
							expect(res.body[0].children).to.be.empty;
							done();
						});
					});
				});
			});
		});

		describe('Get children', function() {

			describe('Valid Inputs', function() {
				var testProducts = [];

				before(function(done) {
					async.times(5, function(n, next) {
						request(server.listener)
						.post('/products')
						.send(new config.Product())
						.end(function(err, res) {
							next(err, res.body);
						});
					}, function(err, docs) {
						if (err) return done(err);
						testProducts = docs;

						async.times(3, function(n, next) {
							request(server.listener)
							.put('/products/' + testProducts[n]._id + '/children/' + testProducts[n+1]._id)
							.send({quantity: n+1})
							.end(function(err, res) {
								request(server.listener)
								.put('/products/' + testProducts[n]._id + '/children/' + testProducts[n+2]._id)
								.send({quantity: n+2})
								.end(function(err, res) {
									next();
								});
							});
						}, function(err, docs) {
							done();
						});
					});
				});

				it('Should return correct tree', function(done) {
					request(server.listener)
					.get('/products/' + testProducts[0]._id + '/children')
					.end(function(err, res) {
						expect(res.body).to.be.an('Array');
						expect(res.body).to.have.length(1);
						var tree = res.body[0]
						expect(tree.text).to.eql(testProducts[0].code + ' - ' + testProducts[0].name)
						expect(tree.children[0].data.quantity).to.be.oneOf([1,2]);
						expect(tree.children[0].data._id).to.be.oneOf([testProducts[1]._id, testProducts[2]._id])
						done();
					});
				});

				it('Softdeleted son - should return correct tree', function(done) {
					request(server.listener)
					.delete('/products/' + testProducts[3]._id)
					.end(function(err, res) {
						request(server.listener)
						.get('/products/' + testProducts[1]._id + '/children')
						.end(function(err, res) {
							let tree = res.body[0];
							expect(tree.children).to.have.length(1);
							expect(tree.text).to.eql(testProducts[1].code + ' - ' + testProducts[1].name)
							expect(tree.children[0].children).to.have.length(1);
							done();
						});
					});
				});
			});

			describe('Invalid Inputs', function() {
				it('Invalid id - should return 400', function(done) {
					request(server.listener)
					.get('/products/123/children')
					.end(function(err, res) {
						expect(res.statusCode).to.equal(400);
						done();
					});
				});

				it('Inexistent id - should return 404', function(done) {
					request(server.listener)
					.get('/products/012345678901234567890123/children')
					.end(function(err, res) {
						expect(res.statusCode).to.equal(404);
						done();
					});
				})
			});
		});
	});
}