import axios from 'axios'
import {Connection, createConnection} from 'typeorm/index'
import {backendPrivateUrl} from '../../lib'

let conn: Connection
let repo: any

const url = `${backendPrivateUrl}model-files/`
const validMetadata = {
  filename: 'valid-ecmwf-model-file.nc',
  year: '2020',
  month: '08',
  day: '11',
  hashSum: 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5',
  modelType: 'ecmwf',
  location: 'granada',
  size: 32434,
  format: 'NetCDF4'
}

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('model_file')
  return
})

afterAll(async () => {
  await repo.delete({})
  return conn.close()
})

describe('POST /model-files', () => {

  beforeEach(() => {
    return repo.delete({})
  })

  test('responds with 201 on new model file submission', async () => {
    const now = new Date()
    const res = await axios.post(url, validMetadata)
    expect(res.status).toBe(201)
    const md = await repo.findOne({filename: validMetadata.filename})
    expect(md).toBeTruthy()
    expect(new Date(md.releasedAt).getTime()).toBeGreaterThan(now.getTime())
    return
  })

  test('responds with 403 on duplicate file submission', async () => {
    await axios.post(url, validMetadata)
    return expect(axios.post(url, validMetadata)).rejects.toMatchObject({ response: { data: { status: 403 }}})
  })

  test('responds with 200 on model file update', async () => {
    const newHash = 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b6'
    const updatedMetadata = {...validMetadata, hashSum: newHash}
    await axios.post(url, validMetadata)
    const res = await axios.post(url, updatedMetadata)
    expect(res.status).toBe(200)
    const md = await repo.findOne({filename: validMetadata.filename})
    return expect(md.checksum).toBe(newHash)
  })

  test('responds with 200 on successful freeze', async () => {
    await axios.post(url, validMetadata)
    const md = await repo.findOne({filename: validMetadata.filename})
    const res = await axios.post(`${url}${md.uuid}`, {'volatile': 'false'})
    expect(res.status).toBe(200)
    const updatedMd = await repo.findOne(md.uuid)
    return expect(updatedMd.volatile).toBe(false)
  })

  test('responds with 403 on freezed model file update', async () => {
    const freezedMetadata = {...validMetadata, volatile: false}
    await axios.post(url, freezedMetadata)
    return expect(axios.post(url, freezedMetadata)).rejects.toMatchObject({ response: { data: { status: 403 }}})
  })

  test('responds with 400 on invalid hash length', async () => {
    const payload = {...validMetadata, hashSum: 'abc'}
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid date', async () => {
    const payload = {...validMetadata, day: '32'}
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid site', async () => {
    const payload = {...validMetadata, location: 'moskova'}
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on invalid model_type', async () => {
    const payload = {...validMetadata, modelType: 'kissa'}
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing year', async () => {
    const payload = {...validMetadata}
    delete payload.year
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing month', async () => {
    const payload = {...validMetadata}
    delete payload.month
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing day', async () => {
    const payload = {...validMetadata}
    delete payload.day
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing hashSum', async () => {
    const payload = {...validMetadata}
    delete payload.hashSum
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing modelType', async () => {
    const payload = {...validMetadata}
    delete payload.modelType
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing location', async () => {
    const payload = {...validMetadata}
    delete payload.location
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing format', async () => {
    const payload = {...validMetadata}
    delete payload.format
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

  test('responds with 400 on missing size', async () => {
    const payload = {...validMetadata}
    delete payload.size
    return expect(axios.post(url, payload)).rejects.toMatchObject({ response: { data: { status: 400}}})
  })

})
