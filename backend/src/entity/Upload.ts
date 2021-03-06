import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm/index'
import {Site} from './Site'
import {Instrument} from './Instrument'
import {Model} from './Model'
import {BeforeInsert, BeforeUpdate} from 'typeorm'
import {v4 as generateUuidV4} from 'uuid'

export enum Status {
  CREATED = 'created',
  UPLOADED = 'uploaded',
  PROCESSED = 'processed'
}

@Entity()
export class Upload {

  @PrimaryColumn('uuid')
  uuid!: string

  @Column({type: 'varchar', length: 32, unique: true})
  checksum!: string

  @Column()
  filename!: string

  @Column({type: 'date'})
  measurementDate!: Date

  @Column({default: 0})
  size!: number

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.CREATED
  })
  status!: Status

  @Column({default: false})
  allowUpdate!: boolean

  @Column()
  createdAt!: Date

  @Column()
  updatedAt!: Date

  @ManyToOne(_ => Site, site => site.uploads)
  site!: Site

  @ManyToOne(_ => Instrument, instrument => instrument.uploads)
  instrument!: Instrument

  @ManyToOne(_ => Model, model => model.uploads)
  model!: Model

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date()
  }

  constructor(
    checksum: string,
    filename: string,
    date: string,
    site: Site,
    allowUpdate: boolean,
    status: Status,
    instrument?: Instrument,
    model?: Model,
  ) {
    this.uuid = generateUuidV4()
    this.checksum = checksum
    this.filename = filename
    this.measurementDate = new Date(date)
    this.site = site
    this.allowUpdate = allowUpdate
    this.status = status
    if (instrument) this.instrument = instrument
    if (model) this.model = model
  }
}
