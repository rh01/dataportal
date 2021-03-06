import {backendPrivateUrl, storageServiceUrl} from '../../lib'
import axios from 'axios'
import {Connection, createConnection, Repository} from 'typeorm'
import {Visualization} from '../../../src/entity/Visualization'
import {promises as fsp} from 'fs'

const validJson = {
  sourceFileId: '9e04d8ef-0f2b-4823-835d-33e458403c67',
  variableId: 'test1'
}

const badUuid = {...validJson, ...{sourceFileId: 'a0fc26e4-d448-4b93-91a3-62051c9d311b'}}

const validId = 'test.png'
const badId = 'notfound'


let conn: Connection
let repo: Repository<Visualization>

const privUrl = `${backendPrivateUrl}visualizations/`
describe('PUT /visualizations', () => {

  beforeAll(async () => {
    conn = await createConnection('test')
    repo = conn.getRepository('visualization')
    // File fixtures are needed here
    await conn.getRepository('file').save(JSON.parse((await fsp.readFile('fixtures/2-file.json')).toString()))
    return axios.put(`${storageServiceUrl}cloudnet-img/${validId}`, 'content')
  })

  afterEach(async () =>
    Promise.all([
      repo.delete(badId),
      repo.delete(validId),
    ]).catch()
  )

  afterAll(async () =>
    conn.close()
  )

  it('on valid new visualization inserts a row to db and responds with 201', async () => {
    const res = await axios.put(`${privUrl}${validId}`, validJson)
    expect(res.status).toEqual(201)
    return expect(repo.findOneOrFail(validId)).resolves.toBeTruthy()
  })

  it('on invalid path responds with 400', async () =>
    expect(axios.put(`${privUrl}${badId}`, validJson)).rejects.toMatchObject({response: {status: 400}})
  )

  it('on invalid source file uuid responds with 400', async () =>
    expect(axios.put(`${privUrl}${validId}`, badUuid)).rejects.toMatchObject({response: { status: 400}})
  )

})
