import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('listing_photos')
export class ListingPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  publicId: string;

  @Column({ type: 'varchar', length: 500 })
  secureUrl: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'uuid', name: 'listing_id' })
  listingId: string;

  @ManyToOne(() => Listing, (listing) => listing.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @CreateDateColumn()
  createdAt: Date;
}
