import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
} from 'typeorm';

// A handful of admin-editable text blocks (about/contact/faq) -- not a CMS,
// just a key/title/body row per block.
@Entity('site_contents')
export class SiteContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
