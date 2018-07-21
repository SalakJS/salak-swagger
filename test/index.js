const assert = require('assert')
const { generateSwaggerSpec, Joi } = require('..')

describe('generateSwaggerSpec()', () => {
  it('should return valid swagger doc.', () => {
    const swagger = generateSwaggerSpec({
      prefix: '/api',
      modules: [
        {
          name: '',
          routes: [
            {
              path: '/',
              alias: '/post'
            }
          ]
        },
        {
          name: 'post',
          routes: [
            {
              path: '/',
              method: 'POST',
              meta: {
                summary: '创建文章',
                description: '新增文章',
                tags: ['Post']
              },
              validate: {
                header: {
                  Authorization: Joi.string().required()
                },
                body: {
                  title: Joi.string().required().description('文章标题'),
                  content: Joi.string().required().description('文章内容')
                },
                responses: {
                  201: {
                    headers: {
                      'X-Rate-Limit': Joi.number().integer()
                    },
                    body: Joi.object().keys({
                      id: Joi.string(),
                      title: Joi.string(),
                      content: Joi.string()
                    }).description('文章具体内容')
                  }
                }
              }
            }
          ]
        },
        {
          name: 'comment',
          routes: [
            {
              path: '/:id',
              method: ['GET'],
              meta: {
                summary: '获取文章评论',
                description: '获取文章评论详情',
                tags: ['Comment']
              },
              validate: {
                params: {
                  id: Joi.string().required().description('文章标示')
                },
                responses: {
                  200: {
                    body: Joi.array().items({
                      username: Joi.string(),
                      content: Joi.string()
                    })
                  }
                }
              }
            }
          ]
        }
      ]
    }, {
      info: {
        title: '博客API',
        description: '博客具体内容',
        version: '1.0.0'
      },
      tags: [
        {
          name: 'Post',
          description: '文章'
        },
        {
          name: 'Comment',
          description: '评论'
        }
      ]
    })

    assert.deepEqual(swagger, {
      swagger: '2.0',
      schemes: ['http'],
      basePath: '/api',
      definitions: {},
      info: {
        title: '博客API',
        description: '博客具体内容',
        version: '1.0.0'
      },
      tags: [
        {
          name: 'Post',
          description: '文章'
        },
        {
          name: 'Comment',
          description: '评论'
        }
      ],
      paths: {
        '/': {
           '$ref': '#/paths/~1post',
        },
        '/post': {
          post: {
            description: '新增文章',
            parameters: [
              {
                name: 'Authorization',
                in: 'header',
                type: 'string',
                required: true
              }, {
                name: 'body',
                in: 'body',
                schema: {
                  properties: {
                    content: {
                      description: '文章内容',
                      type: 'string'
                    },
                    title: {
                      description: '文章标题',
                      type: 'string'
                    }
                  },
                  required: ['title', 'content'],
                  type: 'object'
                }
              }
            ],
            responses: {
              201: {
                description: '文章具体内容',
                headers: {
                  'X-Rate-Limit': {
                    type: 'integer'
                  }
                },
                schema: {
                  description: '文章具体内容',
                  properties: {
                    content: {
                      type: 'string'
                    },
                    id: {
                      type: 'string'
                    },
                    title: {
                      type: 'string'
                    }
                  },
                  type: 'object'
                }
              }
            },
            summary: '创建文章',
            tags: ['Post']
          }
        },
        '/comment/{id}': {
          get: {
            description: '获取文章评论详情',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                type: 'string',
                description: '文章标示'
              }
            ],
            responses: {
              200: {
                description: 'OK',
                schema: {
                  items: {
                    properties: {
                      username: {
                        type: 'string'
                      },
                      content: {
                        type: 'string'
                      }
                    },
                    type: 'object'
                  },
                  type: 'array'
                }
              }
            },
            summary: '获取文章评论',
            tags: ['Comment']
          }
        }
      }
    })
  })
})
