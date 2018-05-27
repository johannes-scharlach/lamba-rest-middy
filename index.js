'use strict'

const middy = require('middy')
const R = require('ramda')

function apiTest(event, ctx, callback) {
  callback(new Error('An error occurred'))
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

function apiMiddlewareFactory(validateFunc) {
  return {
    before(ctx, next) {
      if (validateFunc) {
        try {
          const error = validateFunc(ctx.event)
          ctx.callback({ statusCode: 400, body: JSON.stringify(error) })
        } catch (e) {
          ctx.callback({ statusCode: 400, body: JSON.stringify(e) })
        }
      } else {
        next()
      }
    },
    after(ctx, next) {
      ctx.callback(null, responseFormatter(ctx.response))
    },
    onError(ctx, next) {
      console.log(ctx.error)
      ctx.callback(null, { statusCode: 500, body: 'Server Error' })
    },
  }
}

module.exports = {
  apiTest: middy(apiTest).use(apiMiddlewareFactory()),
}
