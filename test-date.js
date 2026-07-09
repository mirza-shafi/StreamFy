const { getTodayISO } = require('./lib/matchHelpers.js')
const fs = require('fs')

// We'll just define the function locally to test it in Node
function getTodayISO_local() {
  const now = new Date()
  const bstTime = new Date(now.getTime() + 6 * 60 * 60 * 1000)
  const year = bstTime.getUTCFullYear()
  const month = bstTime.getUTCMonth()
  const date = bstTime.getUTCDate()
  // Midnight UTC on the BST date
  const startOfTodayUTC = new Date(Date.UTC(year, month, date, 0, 0, 0, 0))
  // Midnight BST is 6 hours before midnight UTC
  return new Date(startOfTodayUTC.getTime() - 6 * 60 * 60 * 1000).toISOString()
}

console.log("Current time:", new Date().toISOString())
console.log("getTodayISO_local():", getTodayISO_local())
