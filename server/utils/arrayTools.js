'use strict'

function groupBy(array, property) {
  let groupedArray = {}

  array.forEach((item) => {
    if (item[property] !== undefined) {
      let key = typeof item[property] === 'string' ? item[property] : item[property].toString()
      if (!groupedArray[key]) {
        groupedArray[key] = []
      }

      groupedArray[key].push(item)
    } else {
      if (!groupedArray["undefined"]) {
        groupedArray["undefined"] = []
      }

      groupedArray["undefined"].push(item)
    }

  })

  return groupedArray
}

module.exports = { groupBy }