'use strict'

const R = require('ramda')
const compose = require('micro-compose')

function apiTest(event, ctx) {
  return { foo: 'bar' }
}

const responseFormatter = R.cond([
  [R.is(Array), data => ({ statusCode: 200, body: JSON.stringify({ data }) })],
  [R.equals(undefined), () => ({ statusCode: 204 })],
  [
    R.anyPass([R.is(Number), R.is(String), R.is(Boolean)]),
    body => ({ statusCode: 200, body }),
  ],
  [R.T, data => ({ statusCode: 200, body: JSON.stringify(data) })],
])

function asyncApiHoc(fn) {
  return async (event, context, done) => {
    try {
      const result = await fn(event, context)
      done(null, result)
    } catch (err) {
      done(err)
    }
  }
}

function restApiHOC(fn) {
  return async (event, context) => {
    return responseFormatter(await fn(event, context))
  }
}

module.exports.asyncApiHoc = compose(asyncApiHoc, restApiHOC)(apiTest)
