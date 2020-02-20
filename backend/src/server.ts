import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ErrorRequestHandler } from 'express'
import { RequestError } from './entity/RequestError'
import { stringify } from './lib'
import { Request, Response } from 'express'
import actrisConverter from './actris-converter'
import { File } from './entity/File'
import * as express from 'express'
import config from './config'
import { Middleware } from './lib/middleware'
import { Routes } from './lib/routes'
import * as xmlparser from 'express-xml-bodyparser'

(async function() {
  const port = parseInt(process.argv[2])
  const app = express()

  app.use(xmlparser())

  const connName = config.connectionName
  const conn = await createConnection(connName)
  const middleware = new Middleware(conn)
  const routes = new Routes(conn)

  const errorHandler: ErrorRequestHandler = (err: RequestError, _req, res, next) => {
    console.log(`Error in path ${_req.path}:`, stringify(err))
    if (!res.headersSent) {
      delete err.params
      const status = err.status || 500
      res.status(status)
      res.send(err)
    }
    next()
  }

  // Dev only paths
  if (process.env.NODE_ENV != 'production') {
    app.use(function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*') // update to match the domain you will make the request from
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    app.get('/allfiles', routes.allfiles)
    app.get('/allsearch', routes.allsearch)
    app.get('/actris/:uuid', async (req: Request, res: Response) => {
      const repo = conn.getRepository(File)
      repo.findOneOrFail(req.params.uuid, { relations: ['site'] })
        .then(result => res.send(actrisConverter(result)))
        .catch(_ => res.sendStatus(404))
    })
  }

  // public (changes to these require changes to API docs)
  app.get('/api/search', middleware.filesValidator, middleware.filesQueryAugmenter, routes.search)
  app.get('/api/files',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    routes.files)
  app.get('/api/files/:uuid', routes.file)
  app.get('/api/sites', routes.sites)
  app.get('/api/products', routes.products)

  // public/internal
  app.get('/api/status', routes.status)
  app.get('/api/products/variables', routes.productVariables)
  app.get('/api/download', middleware.filesValidator, middleware.filesQueryAugmenter, routes.download)
  app.get('/api/visualizations',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    middleware.checkParamsExistInDb,
    routes.getVisualization)
  app.get('/api/visualizations/:uuid', routes.getVisualizationForSourceFile)
  app.get('/api/latest-visualization-date',
    middleware.filesValidator,
    middleware.filesQueryAugmenter,
    routes.getLatestVisualizationDate
  )

  // private
  app.put('/files/:uuid', routes.submit)
  app.put('/visualizations/:filename', express.json(), routes.putVisualization)

  app.use(errorHandler)

  app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
})()
