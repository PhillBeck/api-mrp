// Load modules
var Produto = require('./controller/ProdutoController');

// API Server Endpoints
exports.endpoints = [
  { 
  	method: 'post',
  	path: '/produtos',
  	config: Produto.create
  },
  {
  	method: 'put',
  	path: '/produtos/{_id}',
  	config: Produto.update
  },
  {
  	method: 'get',
  	path: '/produtos',
  	config: Produto.getProducts 
  },
  {
    method: 'get',
    path:'/produto/{_id}',
    config: Produto.getProductById
  },
  {
    method: 'delete',
    path:'/produto/{_id}',
    config: Produto.remove
  }

];
