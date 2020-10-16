import {ModelFile} from '../entity/ModelFile'
import {ModelSite} from '../entity/ModelSite'
import {ModelType} from '../entity/ModelType'
import {Connection, Repository} from 'typeorm'
import {Request, Response, RequestHandler} from 'express'
import {fetchAll, dateToJSDate, isValidDateString} from '.'
import config from '../config'


export class ModelRoutes {

  constructor(conn: Connection) {
    this.conn = conn
    this.fileServerUrl = config.fileServerUrl
    this.modelFileRepo = this.conn.getRepository(ModelFile)
    this.modelTypeRepo = this.conn.getRepository(ModelType)
    this.modelSiteRepo = this.conn.getRepository(ModelSite)
  }

  private conn: Connection
  readonly fileServerUrl: string
  private modelFileRepo: Repository<ModelFile>
  private modelTypeRepo: Repository<ModelType>
  private modelSiteRepo: Repository<ModelSite>

  private augmentFiles = (files: ModelFile[]) => {
    return files.map(entry =>
      ({ ...entry, url: `${this.fileServerUrl}${entry.filename}` }))
  }

  private filesQueryBuilder(query: any) {
    const qb = this.modelFileRepo
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.site', 'site')
      .leftJoinAndSelect('file.modelType', 'modelType')
      .where('site.id IN (:...location)', query)
      .andWhere('modelType.id IN (:...modelType)', query)
      .andWhere('file.volatile IN (:...volatile)', query)
    if (query.date != undefined) {
      qb.andWhere('file.measurementDate = :date',)
    }
    return qb
  }

  files: RequestHandler = async (req: Request, res: Response, next) => {
    this.filesQueryBuilder(req.query)
      .getMany()
      .then(result => {
        res.send(this.augmentFiles(result))
      })
      .catch(err => {
        next({ status: 500, errors: err })
      })
  }

  sites: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<ModelSite>(this.conn, ModelSite)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  modelTypes: RequestHandler = async (_: Request, res: Response, next) => {
    fetchAll<ModelType>(this.conn, ModelType)
      .then(result => res.send(result))
      .catch(err => next({ status: 500, errors: err }))
  }

  allfiles: RequestHandler = async (_: Request, res: Response, next) =>
    this.modelFileRepo.find({ relations: ['site', 'modelType'] })
      .then(result => res.send(this.augmentFiles(result)))
      .catch(err => next({ status: 500, errors: err }))


  putModelFiles: RequestHandler = async (req: Request, res: Response, next) => {
    const body = req.body
    await this.validateBody(body, next)

    const measurementDate = dateToJSDate(body.year, body.month, body.day)

    const modelFile = new ModelFile(
      body.file_uuid,
      measurementDate,
      body.filename,
      body.hashSum,
      body.format,
      body.size,
      body.location,
      body.modelType)

    const error = (msg: string) => {next({status: 403, errors: `${msg}: ${body.filename}`})}

    // Assuming file_uuid may change but there will be only one file / date / site / modelType:
    const existingFile = await this.modelFileRepo.findOne({
      measurementDate: measurementDate,
      site: body.location,
      modelType: body.modelType
    })
    if (existingFile == undefined) {
      await this.modelFileRepo.insert(modelFile)
      res.send({status: 201})
    } else if (!existingFile.volatile) {
      error('Can not update non-volatile file')
    }
    else if (existingFile.checksum == body.hashSum) {
      error('File already exists')
    }
    else {
      await this.modelFileRepo.update({uuid: existingFile.uuid}, modelFile)
      res.send({status: 200})
    }
  }


  private validateBody = async (body: any, next: any) => {

    const error = (msg: string) => {next({status: 400, errors: `${msg} in ${body.filename}`})}

    ['year', 'month', 'day', 'hashSum', 'filename', 'modelType', 'location', 'file_uuid', 'format', 'size']
      .forEach(key => {
        if (!(key in body)) {error(`Missing: ${key}`)}
      })

    const datestr = `${body.year}${body.month}${body.day}`
    if (!isValidDateString(datestr)) {error(`Invalid date "${datestr}"`)}

    if (await this.modelTypeRepo.findOne(body.modelType) == undefined) {error(`Invalid model type "${body.modelType}"`)}
    if (await this.modelSiteRepo.findOne(body.location) == undefined) {error(`Invalid model site "${body.location}"`)}
    if (body.hashSum.length !== 64) {error('Invalid hash length')}

  }

}
