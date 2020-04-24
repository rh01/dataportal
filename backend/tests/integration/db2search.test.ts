import { backendUrl } from '../lib'
import axios from 'axios'
import { RequestError } from '../../src/entity/RequestError'
import { createConnection, Connection } from 'typeorm'
import { File } from '../../src/entity/File'

const genResponse = (status: any, data: any) => ({response: {status, data}})

const volatileUuid = '38092c00-161d-4ca2-a29d-628cf8e960f6'
let conn: Connection
beforeAll(async () => {
  // Make one of the files volatile
  conn = await createConnection('test')
  const now = new Date()
  return conn.getRepository(File).update(volatileUuid, { releasedAt: new Date(new Date(now.setDate(now.getDate() - 2))) })
})

afterAll(() => conn.close())

describe('/files', () => {
  const url = `${backendUrl}files/`
  const expectedBody404: RequestError = {
    status: 404,
    errors: 'Not found'
  }

  it('should respond with 400 if no query parameters are given', () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'No search parameters given' ]
    }
    expect(axios.get(`${backendUrl}files/`)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('should respond with 400 if invalid query parameters are given', () => {
    const payload = {params: {location: 'macehead', x: '', y: 'kissa'}}
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'Unknown query parameters: x,y' ]
    }
    expect(axios.get(`${backendUrl}files/`, payload))
      .rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('should respond with an array of 3 objects when searching for macehead', async () => {
    const payload = {params: {location: 'macehead'}}
    const res = await axios.get(url, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(3)
    return expect(res.data.map((d: any) => d.site.id)).toEqual(['macehead', 'macehead', 'macehead'])
  })

  it('should respond with an array of 4 objects when searching for macehead and hyytiala', async () => {
    const payload = {params: {location: ['macehead', 'hyytiala']}}
    const res = await axios.get(url, payload)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(4)
    return expect(new Set(res.data.map((d: any) => d.site.id))).toEqual(new Set(['macehead', 'macehead', 'macehead', 'hyytiala']))
  })


  it('should respond with 404 if location was not found', () => {
    const payload = {params: {location: ['kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified locations were not found']
    expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('should respond 404 if one of many locations was not found', () => {
    const payload = {params: {location: ['macehead', 'kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified locations were not found']
    expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('should respond with an array of objects with dates between [ dateFrom, dateTo ], in descending order', async () => {
    const payload = {params: {dateFrom: new Date('2018-06-09'), dateTo: new Date('2019-09-01')}}
    const res = await axios.get(url, payload)
    return expect(res.data.map((d: any) => d.measurementDate)).toEqual(['2019-09-01', '2019-07-15', '2018-11-15', '2018-06-09'])
  })

  it('should respond with correct objects if product is specified', async () => {
    const payload = {params: {product: 'radar'}}
    const res = await axios.get(url, payload)
    return expect(res.data.map((d: any) => d.product.id)).toEqual(['radar', 'radar'])
  })

  it('should respond with correct objects if dateFrom, dateTo, location, and product are specified', async () => {
    const payload = {params: {dateFrom: new Date('2018-06-09'), dateTo: new Date('2019-09-02'), location: 'macehead', product: 'classification'}}
    const res = await axios.get(url, payload)
    expect(res.data.map((d: any) => d.site.id)).toEqual(['macehead'])
    expect(res.data.map((d: any) => d.product.id)).toEqual(['classification'])
    return expect(res.data.map((d: any) => d.measurementDate)).toEqual(['2018-06-09'])
  })

  it('should respond with 400 on malformed dateFrom', () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed date in property "dateFrom"' ]
    }
    const payload1 = {params: {dateFrom: 'turku'}}
    expect(axios.get(url, payload1)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('should respond with 400 on malformed dateTo', () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: [ 'Malformed date in property "dateTo"' ]
    }
    const payload = {params: {dateFrom: new Date('2020-02-20'), dateTo: 'turku'}}
    expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('should have exactly one stable file', async () => {
    const payload = {params: {location: 'macehead'}}
    const res = await axios.get(url, payload)
    return expect(res.data.filter((file: any) => !file.volatile)).toHaveLength(1)
  })

  it('should not show test files in normal mode', async () => {
    const payload = {params: {location: 'granada'}}
    expectedBody404.errors = ['The search yielded zero results']
    return expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody404.status, expectedBody404))
  })

  it('should show test files in developer mode', async () => {
    const payload = {params: {location: 'granada', developer: ''}}
    return expect(axios.get(url, payload)).resolves.toBeTruthy()
  })
})

describe('/sites', () => {
  const url = `${backendUrl}sites/`

  it('should respond with a list of all sites in dev mode', async () => {
    const sites = ['macehead', 'hyytiala', 'bucharest', 'granada']
    const res = await axios.get(url, { params: { developer: '' }})
    expect(res.data).toHaveLength(sites.length)
    const siteList = res.data.map((d: any) => d.id)
    return sites.forEach(site => expect(siteList).toContain(site))
  })

  it('should respond with a list of all sites except test in normal mode', async () => {
    const sites = ['macehead', 'hyytiala', 'bucharest']
    const res = await axios.get(url)
    expect(res.data).toHaveLength(sites.length)
    const siteList = res.data.map((d: any) => d.id)
    return sites.forEach(site => expect(siteList).toContain(site))
  })
})

describe('/download', () => {
  const url = `${backendUrl}download/`

  it('should respond with 400 if no results were found', async () => {
    let expectedBody: RequestError = {
      status: 400,
      errors: ['No files match the query']
    }
    const payload = { params: { dateTo: new Date('1970-02-20') } }
    expect(axios.get(url, payload)).rejects.toMatchObject(genResponse(expectedBody.status, expectedBody))
  })

  it('should respond with 500 if files that exist in db do not exist on disk', async () => {
    const payload = { params: { location: 'bucharest' } }
    expect(axios.get(url, payload)).rejects.toMatchObject({ response: { status: 500 }})
  })
})
