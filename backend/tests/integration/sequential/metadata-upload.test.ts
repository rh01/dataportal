import axios from 'axios'
import {Connection, createConnection} from 'typeorm/index'
import {backendPrivateUrl} from '../../lib'
import {Status} from '../../../src/entity/UploadedMetadata'

let conn: Connection
let repo: any

const url = `${backendPrivateUrl}metadata/`
const validMetadata = {
  filename: 'file1.LV1',
  measurementDate: '2020-08-11',
  hashSum: 'dc460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b5',
  instrument: 'mira',
  site: 'granada'
}
const validUrl = `${url}${validMetadata.hashSum}`

beforeAll(async () => {
  conn = await createConnection('test')
  repo = conn.getRepository('uploaded_metadata')
  return
})

afterAll(async () => {
  await repo.delete({})
  return conn.close()
})

describe('PUT /metadata', () => {
  beforeEach(() => {
    return repo.delete({})
  })

  test('inserts new metadata', async () => {
    await expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({status: 201})
    return expect(repo.findOneOrFail(validMetadata.hashSum)).resolves.toBeTruthy()
  })

  test('responds with 201 on existing hashsum with created status', async () => {
    await axios.put(validUrl, validMetadata)
    return expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({ status: 201})
  })

  test('responds with 200 on existing hashsum with uploaded status', async () => {
    let uploadedMetadata = {...validMetadata, ...{hash: validMetadata.hashSum, status: Status.UPLOADED}}
    delete uploadedMetadata.hashSum
    await repo.save(uploadedMetadata)
    await axios.put(validUrl, validMetadata)
    return expect(axios.put(validUrl, validMetadata)).resolves.toMatchObject({ status: 200})
  })

  test('responds with 422 on missing filename', async () => {
    const payload = {...validMetadata}
    delete payload.filename
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing measurementDate', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid measurementDate', async () => {
    let payload = {...validMetadata}
    payload.measurementDate = 'July'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing hashSum', async () => {
    const payload = {...validMetadata}
    delete payload.measurementDate
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid hashSum', async () => {
    let payload = {...validMetadata}
    payload.hashSum = '293948'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing instrument', async () => {
    const payload = {...validMetadata}
    delete payload.instrument
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid instrument', async () => {
    let payload = {...validMetadata}
    payload.instrument = 'kukko'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on missing site', async () => {
    let payload = {...validMetadata}
    delete payload.site
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })

  test('responds with 422 on invalid site', async () => {
    let payload = {...validMetadata}
    payload.site = 'kukko'
    return expect(axios.put(validUrl, payload)).rejects.toMatchObject({ response: { data: { status: 422}}})
  })
})

describe('POST /metadata', () => {
  beforeAll(async () => repo.save({
    'filename': 'file2.LV1',
    'measurementDate': '2020-08-11',
    'hash': 'ac460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b1',
    'site': 'granada',
    'instrument': 'rpg-fmcw-94',
    'status': 'created'
  }))
  const postMetadata = {
    'hash': 'ac460da4ad72c482231e28e688e01f2778a88ce31a08826899d54ef7183998b1',
    'status': 'uploaded'
  }

  const postUrl = `${backendPrivateUrl}metadata/${postMetadata.hash}`

  it('changes corresponding fields in metadata', async () => {
    await expect(axios.post(postUrl, postMetadata)).resolves.toMatchObject({ status: 200 })
    await expect(axios.get(postUrl)).resolves.toMatchObject({ status: 200, data: postMetadata })
  })

  it('responds with 404 if metadata is not found', async () => {
    const hash = '123456789012345678'
    const invalidUrl = `${url}${hash}`
    return expect(axios.post(invalidUrl, postMetadata)).rejects.toMatchObject({ response: { data: { status: 404}}})
  })
})
