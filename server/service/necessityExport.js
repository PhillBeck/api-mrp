var xlsx = require('xlsx'),
  formatOutput = require('../utils/format');


const data = JSON.parse(`{
	"_id" : "5a535c77e9d38d0c8b4c7c05",
	"updatedAt" : "2018-01-08T11:56:39.887Z",
	"createdAt" : "2018-01-08T11:56:39.887Z",
	"items" : [
		{
			"_id" : "5a535c77e9d38d0c8b4c7bb9",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.3954994856637408",
			"quantity" : 6
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bba",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.3198192857579558",
			"quantity" : 7
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bbb",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.88421892520734",
			"quantity" : 8
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bbc",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.3372349705243438",
			"quantity" : 9
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bbd",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.47180187825784503",
			"quantity" : 10
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bb6",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.6168579256760116",
			"quantity" : 3
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bb7",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.9096604044439551",
			"quantity" : 4
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bb8",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.43421919443933343",
			"quantity" : 5
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bb4",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.8264046776048202",
			"quantity" : 1
		},
		{
			"_id" : "5a535c77e9d38d0c8b4c7bb5",
			"DELETED" : false,
			"productType" : 1,
			"leadTime" : 20,
			"unit" : "un",
			"description" : "Test1",
			"family" : "Test1",
			"name" : "Test1",
			"code" : "0.27616207323450026",
			"quantity" : 2
		}
	],
	"__v" : 0
}
`)

module.exports = function exportNecessity(obj) {
  let sheet = xlsx.utils.json_to_sheet(format(obj.items))

  wb = xlsx.readFile("files/model.xlsx")

  if (!wb.Sheets['necessidade']) {
    wb.SheetNames.push('necessidade')
  }

  wb.Sheets['necessidade'] = sheet

  xlsx.writeFile(wb, `files/${obj._id}.xlsx`)
}


function format(items) {
  return items.map((item) => {
    let i = formatOutput(item, ['_id', 'DELETED'])
    i.productType = getProductType(i.productType)

    return makeHeaders(i)
  })
}

function getProductType(enumValue) {
  if (enumValue == 1) {
    return 'comprado'
  }

  return 'fabricado'
}


function makeHeaders(item) {
  return {
    Tipo: item.productType,
    Unidade: item.unit,
    Descrição: item.description,
    Família: item.family,
    Nome: item.name,
    Código: item.code,
    Quantidade: item.quantity
  }
}