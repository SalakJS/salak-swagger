const assert = require('assert')
const Joi = require('joi')
const generator = require('../../lib/generator')
const { routeSchemaToSwaggerSpec } = generator

describe('generator', () => {
  it('test routeSchema translate to swagger spec', () => {
    const paths = {}
    const definitions = {}
    routeSchemaToSwaggerSpec(paths, definitions, '/blog/:id', {
      method: ['GET'],
      meta: {
        summary: '获取文章详情',
        description: '根据文章ID，获取文章内容',
        tags: ['article']
      },
      validate: {
        params: {
          id: Joi.string().required().description('文章id')
        },
        responses: {
          200: {
            body: Joi.object().keys({
              code: Joi.number(),
              msg: Joi.string(),
              data: Joi.object().keys({
                id: Joi.string(),
                content: Joi.string()
              }).meta({ className: 'Post' })
            }).description('文章详情')
          }
        }
      }
    })

    assert(paths['/blog/{id}'])
    assert.deepEqual(paths['/blog/{id}'], {
      get: {
        summary: '获取文章详情',
        description: '根据文章ID，获取文章内容',
        tags: ['article'],
        responses: { '200': {
          description: '文章详情',
          schema: {
            type: 'object',
            description: '文章详情',
            properties: {
              code: {
                type: 'number',
                format: 'float'
              },
              msg: {
                type: 'string'
              },
              data: {
                '$ref': '#/definitions/Post'
              }
            }
          }
        }},
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: '文章id',
            type: 'string'
          }
        ]
      }
    })

    assert.deepEqual(definitions['Post'], {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        },
        content: {
          type: 'string'
        }
      }
    })
  })
})
