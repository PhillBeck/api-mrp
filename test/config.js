'use strict';

const request = require('supertest');

function Product(){
  this.code= Math.random().toString();
  this.name= 'Test1';
  this.family= 'Test1';
  this.description= 'Test1';
  this.amountInStock= 50;
  this.unit= 'un';
  this.leadTime= 20;
  this.productType = 1;
}

function ProductionOrder(productId) {
  this.productId = productId;
  this.code = Math.random().toString();
  this.originalDeadline = '2017-06-19';
  this.revisedDeadline = '2017-06-19';
  this.quantity = 1;
  this.type = 1;
}

function Warehouse() {
  this.code = Math.random().toString();
  this.description = 'Teste';
  this.validSince = '2017-06-19';
  this.unitId = '59554026b0b92b74ba04a81d';
}

function Movement(fromProduct, fromWareHouse, toProduct, toWarehouse) {
  this.fromProduct = fromProduct || '012345678901234567890123',
  this.fromWarehouse = fromWareHouse || '012345678901234567890123',
  this.fromQuantity = 1,
  this.toProduct = toProduct || '012345678901234567890123',
  this.toWarehouse = toWarehouse || '012345678901234567890123',
  this.toQuantity = 5,
  this.type = "TR",
  this.cancelled = false,
  this.createdAt = "2017-07-03T18:28:57.392Z"
}

function NF() {
  this.nf = Math.random().toString();
  this.cnpj = Math.random().toString();
  this.serie = Math.random().toString();
  this.emittedAt = new Date(),
  this.items = {
    productId: '',
    quantity: 10,
    batch: Math.random().toString(),
    unitPrice: 10.1,
    movementId: ''
  }
}

module.exports = {
  Product: Product,
  Warehouse: Warehouse,
  ProductionOrder: ProductionOrder,
  Movement: Movement,
  NF: NF,
  requests: {
    createTransferMovement(server, movement, callback) {
      let movementToSend = movement || new Movement();

      request(server.listener)
      .post('/movements/transfers')
      .send(movementToSend)
      .end(function(err, res) {
        callback(err, res.body);
      });
    },

    createProduct(server, product, callback) {
      let productToSend = product || new Product();

      request(server.listener)
      .post('/products')
      .send(productToSend)
      .end(function(err, res) {
        callback(err, res.body);
      });
    },

    createWarehouse(server, warehouse, callback) {
      let warehouseToSend = warehouse || new Warehouse();

      request(server.listener)
      .post('/warehouses')
      .send(warehouseToSend)
      .end(function(err, res) {
        callback(err, res.body);
      });
    }
  }
}
