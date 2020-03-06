import { backendUrl } from '../lib'
import axios, { AxiosRequestConfig } from 'axios'
import { RequestError } from '../../src/entity/RequestError'

describe('/files', () => {
  const url = `${backendUrl}files/`
  const expectedBody404: RequestError = {
    status: 404,
    errors: 'Not found'
  }

  it('should respond with 400 if no query parameters are given', async () => {
    const expectedBody: RequestError = {
      status: 400,
      errors: [ 'No search parameters given' ]
    }
    return expect(axios.get(`${backendUrl}files/`)).rejects.toMatchObject({response: {status: expectedBody.status, data: expectedBody}})
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
    return expect(res.data.map((d: any) => d.site.id)).toEqual(['macehead', 'macehead', 'macehead', 'hyytiala'])
  })


  it('should respond with 404 if location was not found', async () => {
    const payload = {params: {location: ['kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified locations were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject({response: {status: expectedBody404.status, data: expectedBody404}})
  })

  it('should respond 404 if one of many locations was not found', async () => {
    const payload = {params: {location: ['macehead', 'kilpikonna']}}
    expectedBody404.errors = ['One or more of the specified locations were not found']
    return expect(axios.get(url, payload)).rejects.toMatchObject({response: {status: expectedBody404.status, data: expectedBody404}})
  })
})

describe('/sites', () => {
  const url = `${backendUrl}sites/`
  it('should respond with a list of all sites', async () => {
    const sites = ['macehead', 'hyytiala', 'bucharest']
    const res = await axios.get(url)
    expect(res.data).toHaveLength(3)
    const siteList = res.data.map((d: any) => d.id)
    sites.forEach(site => expect(siteList).toContain(site))
  })
})
