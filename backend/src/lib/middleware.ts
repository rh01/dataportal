import { RequestHandler } from 'express'
import { RequestErrorArray } from '../entity/RequestError'
import validator from 'validator'
import { Site } from '../entity/Site'
import { Product } from '../entity/Product'
import { Connection } from 'typeorm'
import { fetchAll } from '.'

export class Middleware {

  constructor(conn: Connection) {
    this.conn = conn
  }

  private conn: Connection

  filesValidator: RequestHandler = (req, _res, next) => {
    const requestError: RequestErrorArray = { status: 400, errors: [] }
    const query = req.query

    const isArrayWithElements = (obj: any) => Array.isArray(obj) && obj.length > 0
    const pushAndReturn = (err: RequestErrorArray, el: string) => {
      err.errors.push(el)
      return err
    }
    const isValidDate = (obj: any) => !isNaN(new Date(obj).getDate())


    if (Object.keys(query).length == 0) {
      return next(pushAndReturn(requestError, 'No search parameters given'))
    }

    const validKeys = ['location', 'product', 'dateFrom', 'dateTo', 'developer']
    const unknownFields = Object.keys(query).filter(key => !validKeys.includes(key))
    if (unknownFields.length > 0) {
      requestError.errors.push(`Unknown query parameters: ${unknownFields}`)
    }

    // Validate location
    if ('location' in query && !((typeof query.location == 'string' && validator.isAlphanumeric(query.location))
      || isArrayWithElements(query.location))) {
      requestError.errors.push('Malformed location')
    }

    // Validate product
    if ('product' in query && !((typeof query.product == 'string' && validator.isAlphanumeric(query.product))
      || isArrayWithElements(query.product))) {
      requestError.errors.push('Malformed product')
    }

    // Validate dates
    if (query.dateFrom && !isValidDate(query.dateFrom)) {
      requestError.errors.push('Malformed date in property "dateFrom"')
    }
    if (query.dateTo && !isValidDate(query.dateTo)) {
      requestError.errors.push('Malformed date in property "dateTo"')
    }

    if (requestError.errors.length > 0) {
      return next(requestError)
    }
    return next()
  }

  filesQueryAugmenter: RequestHandler = async (req, _res, next) => {
    const query = req.query
    const toArray = (obj: string | Array<string>): Array<string> =>
      (typeof obj == 'string') ? [obj] : obj
    const tomorrow = () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }
    const defaultLocation = async () => (await fetchAll<Site>(this.conn, Site)).map(site => site.id)
    const defaultProduct = async () => (await fetchAll<Product>(this.conn, Product)).map(product => product.id)
    const defaultDateFrom = () => new Date('1970-01-01')
    const defaultDateTo = tomorrow

    // Set defaults
    if (!('location' in query)) query.location = await defaultLocation()
    if (!('product' in query)) query.product = await defaultProduct()
    if (!('dateFrom' in query)) query.dateFrom = defaultDateFrom()
    if (!('dateTo' in query)) query.dateTo = defaultDateTo()

    query.location = toArray(query.location)
    query.product = toArray(query.product)

    next()
  }
}