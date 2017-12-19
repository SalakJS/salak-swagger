# salak-swagger

For generating Swagger 2.0 JSON from router

## API

### generateSwaggerSpec (router, baseSpec, options)

router config:  
- prefix: the api path  
- modules

baseSpec: Swagger base info  
- info: like title, version, description, contact...  
- tags: array

options:  
- defaultResponses

## Install

```bash
npm install --save salak-swagger
```

## Usage


```javascript
const { generateSwaggerSpec } = require('salak-swagger')
const Joi = require('joi')

const swagger = generateSwaggerSpec({
  prefix: '/api',
  modules: [
    {
      name: 'blog',
      routes: [
        {
          path: '/:id',
          method: ['GET'],
          meta: {
            summary: '',
            description: '',
            tags: ['文章']
          },
          validate: {
            header: Joi.object().keys({
              Authorization: Joi.string().required()
            }),
            params: {
              id: Joi.string().required().description('Article id')
            },
            query: {
              id: Joi.string().required()
            },
            responses: {
              200: {
                body: Joi.object().keys({
                  code: Joi.number(),
                  msg: Joi.string()
                }),
                headers: Joi.object().keys({
                  authorization: Joi.string().required()
                }).options({
                  allowUnknown: true
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
    description: 'Blog api',
    version: '1.0.0',
    title: 'Blog Swagger',
    contact: {
      name: 'wengeek',
      email: 'xxx.xxx@xxx.com'
    }
  }
})

console.log(swagger)
```

## LICENSE

MIT
