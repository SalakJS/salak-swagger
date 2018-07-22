'use strict'

/**
 * 单个路由生成对应的swagger文档
 *
 * 创 建 者：wengeek <wenwei897684475@gmail.com>
 * 创建时间：2017-12-08
 */

const pathToRegex = require('path-to-regexp')
const j2s = require('salak-joi-to-swagger')
const isEqual = require('lodash/isEqual')
const size = require('lodash/size')
const httpCodes = require('./httpCodes')

const warn = console.warn

/**
 * 路由schema转换为swagger spec
 *
 * @param {Object} paths - refer to swagger.paths
 * @param {Object} definitions - refer to swagger.definitions
 * @param {string} routePath - 路由具体路径
 * @param {Object} route - 路由具体信息
 * @param {Array|string} route.method - 路由请求方式
 * @param {Object} route.meta - route相关简介
 * @param {Object} route.validate - route对应校验规则
 * @param {Object} route.validate.header - route头部校验规则
 * @param {Object} route.validate.params - route路径参数校验规则
 * @param {Object} route.validate.body - route 请求body校验规则
 * @param {Object} route.validate.responses - route 响应体校验规则
 * @param {Object} options - 通用配置
 * @param {Object} options.defaultResponses - 默认responses
 */
exports.routeSchemaToSwaggerSpec = (paths, definitions, routePath, route, options = {}) => {
  const { alias, method = ['GET'], meta = {
    summary: routePath
  }, validate = {} } = route
  const swaggerPath = swaggerizePath(routePath)
  paths[swaggerPath] = paths[swaggerPath] || {}

  if (alias) {
    paths[swaggerPath] = {
      '$ref': '#/paths/~1' + alias.split('/').filter((item) => item !== '').join('~1')
    }

    return
  }

  const {
    defaultResponses = {
      200: {
        description: 'Success'
      }
    }
  } = options

  const methods = Array.isArray(method) ? method : [method]
  const routeSpec = {}

  Object.assign(routeSpec, meta)

  const type = validate.type
  if (!type) {
    // nothing to do
  } else if (type === 'json') {
    routeSpec.consumes = ['application/json']
  } else if (type === 'form') {
    routeSpec.consumes = ['application/x-www-form-urlencoded']
  } else if (type === 'multipart') {
    routeSpec.consumes = ['multipart/form-data']
  }

  const parameters = validateToSwaggerParameters(validate, definitions)
  routeSpec.responses = outputToSwaggerResponse(validate.responses, definitions) || defaultResponses

  // 检查路径是否包含:
  const pathCaptures = routePath.match(/(:\w+)/g)
  if (pathCaptures) {
    for (let item of pathCaptures) {
      item = item.replace(':', '')

      let isExisted = false
      for (let parameter of parameters) {
        if (parameter.in === 'path' && parameter.name === item) {
          isExisted = true
          break
        }
      }

      if (!isExisted) {
        parameters.push({
          name: item,
          in: 'path',
          type: 'string',
          required: true
        })
      }
    }
  }

  routeSpec.parameters = parameters

  methods.forEach((method) => {
    method = method.toLowerCase()
    if (paths[swaggerPath][method]) {
      warn(`${routePath}[${method}] was existed in mulitiple routes`)
      return
    }

    paths[swaggerPath][method] = routeSpec
  })
}

function outputToSwaggerResponse (responses, definitions) {
  if (size(responses) === 0) {
    return
  }

  const res = {}
  for (let key in responses) {
    // 301,304,400-600
    const resCodes = key.split(',').filter((item = '') => item.trim() !== '')

    const spec = outputToSwagger(responses[key].body, definitions)
    const headers = outputHeaderToSwagger(responses[key].headers)

    if (headers) {
      spec.headers = headers
    }

    resCodes.forEach((code) => {
      if (code.indexOf('-') !== -1) {
        code = code.split('-')[0]
      }

      res[code] = makeOutputSpec(Object.assign({}, {
        description: typeof responses[key].description === 'string' ? responses[key].description : (typeof responses[key] === 'string' ? responses[key] : '')
      }, spec), code)
    })
  }

  return res
}

function outputHeaderToSwagger (schema) {
  if (!schema) {
    return
  }

  const { swagger } = j2s(schema)
  return swagger && swagger.properties
}

function makeOutputSpec (spec, code) {
  let description = httpCodes[code]
  if (!description) {
    description = (code > 399 && code < 600) ? 'Failure' : 'Success'
  }

  spec.description = spec.description || description

  return spec
}

function outputToSwagger (schema, definitions) {
  if (!schema) {
    return {}
  }

  const { swagger, definitions: outputDefinitions } = j2s(schema)

  extendsDefinitions(definitions, outputDefinitions)

  return {
    schema: swagger,
    description: swagger.description
  }
}

function validateToSwaggerParameters (validate, definitions) {
  let parameters = []

  if (validate.header) {
    addSchemaToParameters(parameters, 'header', validate.header)
  }

  if (validate.params) {
    addSchemaToParameters(parameters, 'path', validate.params)
  }

  if (validate.query) {
    addSchemaToParameters(parameters, 'query', validate.query)
  }

  if (validate.formData) {
    addSchemaToParameters(parameters, 'formData', validate.formData)
  }

  if (validate.body) {
    let { swagger, definitions: bodyDefinitions } = j2s(validate.body)

    parameters.push({
      name: 'body',
      in: 'body',
      schema: swagger
    })

    extendsDefinitions(definitions, bodyDefinitions)
  }

  return parameters
}

function extendsDefinitions (definitions, source) {
  for (let key in source) {
    if (definitions[key] && !isEqual(definitions[key], source[key])) {
      warn(`Model Definition: ${key} was existed and was be overrided`)
    }

    definitions[key] = source[key]
  }
}

function addSchemaToParameters (parameters, location, schema) {
  const swaggerObject = j2s(schema).swagger

  if (swaggerObject.type === 'object' && swaggerObject.properties) {
    const { required = [], properties } = swaggerObject

    for (let name in properties) {
      const value = properties[name]

      value.name = name
      value.in = location
      value.required = required.indexOf(name) !== -1

      // 兼容file类型
      if (value.type === 'string' && value.format === 'binary') {
        value.type = 'file'
        delete value.format
      }

      parameters.push(value)
    }
  }
}

function swaggerizePath (pathname) {
  const pathTokens = pathToRegex.parse(pathname)

  const segments = pathTokens.map((token) => {
    let segment = token

    if (token.name) {
      segment = `{${token.name}}`
    } else {
      segment = token.replace('/', '')
    }

    return segment
  })

  return `/${segments.join('/')}`
}
