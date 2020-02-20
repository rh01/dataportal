#!node

const createConnection = require('typeorm').createConnection
const axios = require('axios')
const actrisConverter = require('../build/actris-converter').default;

(async function () {
  const red = '\x1b[31m'
  const green = '\x1b[32m'
  const reset = '\x1b[0m'
  const conn = await createConnection()

  const targetUrl = 'https://dev-actris-md.nilu.no/metadata/add'
  const repo = conn.getRepository('file')
  const result = await repo.find({ relations: ['site'] })
  conn.close()
  const maxlen = result.reduce((prev, {filename}) => filename.length > prev ? filename.length : prev, 0)
  process.stdout.write(`POSTing ${result.length} files to ${targetUrl}...\n\n`)
  for (const file of result) {
    process.stdout.write(file.filename.padEnd(maxlen + 1, ' '))
    await axios
      .post(targetUrl, actrisConverter(file))
      .then(response => {
        process.stdout.write(`${green}${response.status}${reset}\t`)
        process.stdout.write(`${response.headers['location']}\n`)
      })
      .catch(({ response }) => {
        process.stdout.write(`${red}${response.status}${reset}\n`)
        process.stderr.write(`${file.filename}\n${JSON.stringify(response.data, null, 2)}${reset}\n\n`)
      })
  }
  process.stdout.write(`\nDone!\n`)
}())