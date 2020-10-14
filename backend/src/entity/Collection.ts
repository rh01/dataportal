import {BeforeInsert, BeforeUpdate, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from 'typeorm'
import {File} from './File'

@Entity()
export class Collection {

  @PrimaryGeneratedColumn('uuid')
  uuid!: string

  @ManyToMany(type => File)
  @JoinTable()
  files!: File[]

  @Column({default: ''})
  title!: string

  @Column({default: ''})
  pid!: string

  @Column({default: 0})
  downloadCount!: number

  @Column()
  createdAt!: Date

  @Column()
  updatedAt!: Date

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date()
    this.updatedAt = this.createdAt
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date()
  }

  constructor(files: File[]) {
    this.files = files
  }
}
