'use strict'

/**
 * 根据salak routes生成swagger文档
 *
 * 创 建 者：wengeek <wenwei897684475@gmail.com>
 * 创建时间：2017-12-08
 */

const assert = require('assert')
const cloneDeep = require('lodash/cloneDeep')
const generator = require('./lib/generator')

exports.generateSwaggerSpec = generateSwaggerSpec

/**
 * 生成swagger文档
 *
 * @param {Object} router - 路由设置
 * @param {Array} router.modules - 路由模块
 * @param {string} router.prefix - 路由路径前缀
 * @param {Object} baseSpec - swagger基础设置
 * @param {Object} baseSpec.info - 基础信息设置，如title，version，description
 * @param {Object} options - 通用配置
 * @param {Object} options.defaultResponses - 默认responses
 */
function generateSwaggerSpec (router = {}, baseSpec = {}, options = {}) {
  assert(router.modules, 'router.modules parameter missing')
  assert(baseSpec.info, 'baseSpec.info parameter missing')
  assert(baseSpec.info.title, 'baseSpec.info.title parameter missing')
  assert(baseSpec.info.version, 'baseSpec.info.version parameter missing')

  const spec = cloneDeep(Object.assign({}, {
    swagger: '2.0',
    schemes: ['http'],
    tags: [],
    paths: {},
    definitions: {}
  }, baseSpec))

  options = Object.assign({
    defaultResponses: {
      200: {
        description: 'Success'
      }
    }
  }, options)

  if (router.prefix) {
    spec.basePath = router.prefix
  }

  router.modules.forEach(({ name, routes }) => {
    routes.forEach((route) => {
      generator.routeSchemaToSwaggerSpec(spec.paths, spec.definitions, concatPath(name, route.path), route, options)
    })
  })

  return spec
}

function concatPath (prefix = '', pathname = '') {
  let realPath = ''

  prefix = prefix === '/' ? '' : prefix
  if (prefix.endsWith('/') || pathname.startsWith('/')) {
    realPath = `${prefix}${pathname}`
  } else {
    realPath = `${prefix}/${pathname}`
  }

  if (!realPath.startsWith('/')) {
    realPath = `/${realPath}`
  }

  if (realPath.length > 1 && realPath.endsWith('/')) {
    realPath = realPath.slice(0, realPath.length - 1)
  }

  return realPath
}
