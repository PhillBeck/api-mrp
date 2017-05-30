// Load modules
var Produto = require('./controller/ProdutoController');
var Necessity = require('./controller/NecessityController');

// API Server Endpoints
exports.endpoints = [
  { 
  	method: 'post',
  	path: '/products',
  	config: Produto.create
  },
  {
  	method: 'put',
  	path: '/products/{_id}',
  	config: Produto.update
  },
  {
  	method: 'get',
  	path: '/products',
  	config: Produto.getProducts 
  },
  {
    method: 'get',
    path: '/products/{_id}',
    config: Produto.getProductById
  },
  {
    method: 'delete',
    path: '/products/{_id}',
    config: Produto.remove
  },
  {
    method: 'put',
    path: '/products/{_parentId}/children/{_childId}',
    config: Produto.addChildren
  },
  {
    method: 'get',
    path: '/products/{_id}/children',
    config: Produto.getChildren
  },
  {
    method: 'delete',
    path: '/products/{_parentId}/children/{_childId}',
    config: Produto.removeChildren
  },
  {
    method: 'post',
    path: '/necessities',
    config: Necessity.createNecessity
  },
  {
    method: 'get',
    path: '/necessities',
    config: Necessity.getNecessities
  },
  {
    method: 'put',
    path: '/necessities/{_id}',
    config: Necessity.updateNecessity
  },
  {
    method: 'get',
    path: '/necessities/{_id}',
    config: Necessity.getNecessityById
  },
  {
    method: 'delete',
    path: '/necessities/{_id}',
    config: Necessity.deleteNecessity
  },
  {
    method: 'post',
    path: '/necessities/{_id}/items',
    config: Necessity.addItem
  },
  {
    method: 'delete',
    path: '/necessities/{necessityId}/items/{itemId}',
    config: Necessity.removeItem
  },
  {
    method: 'put',
    path: '/necessities/{necessityId}/items/{itemId}',
    config: Necessity.updateItem
  }
];
