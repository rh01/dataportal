import 'reflect-metadata'
import {backendPublicUrl} from '../../lib'
import axios from 'axios'


describe('GET /api/models', () => {

  const modelTypeUrl = `${backendPublicUrl}models/`

  it('responds with a list of all model types', async () => {
    const types = ['ecmwf', 'icon-iglo-12-23', 'icon-iglo-24-35', 'icon-iglo-36-47', 'gdas1']
    const res = await axios.get(modelTypeUrl)
    expect(res.data).toHaveLength(types.length)
    const siteList = res.data.map((d: any) => d.id)
    return types.forEach(mtype => expect(siteList).toContain(mtype))
  })
})
