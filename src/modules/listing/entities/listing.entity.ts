import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ListingPhoto } from './listing-photo.entity';
import { Discount } from './discount.entity';
import {
  PropertyCategory,
  PlaceType,
  BathroomUsage,
  FavoriteAmenity,
  Amenity,
  SafetyItem,
  Highlight,
  BookingSetting,
  ListingStatus,
} from '../enums';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =====================
  // STEP 1: Property Details
  // =====================

  @Column({
    type: 'enum',
    enum: PropertyCategory,
    nullable: true,
  })
  category: PropertyCategory;

  @Column({
    type: 'enum',
    enum: PlaceType,
    nullable: true,
  })
  placeType: PlaceType;

  // Address fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  streetAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  // Capacity
  @Column({ type: 'int', nullable: true })
  guests: number;

  @Column({ type: 'int', nullable: true })
  bedrooms: number;

  @Column({ type: 'int', nullable: true })
  beds: number;

  // Property flags
  @Column({ type: 'boolean', default: false })
  homePrecise: boolean;

  @Column({ type: 'boolean', default: false })
  bedroomLock: boolean;

  // Bathroom distribution (only 0, 0.5, 1 allowed)
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  privateBathroom: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  dedicatedBathroom: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  sharedBathroom: number;

  @Column({
    type: 'enum',
    enum: BathroomUsage,
    nullable: true,
  })
  bathroomUsage: BathroomUsage;

  // =====================
  // STEP 2: Amenities, Safety & Media
  // =====================

  @Column({ type: 'simple-array', nullable: true })
  favorites: FavoriteAmenity[];

  @Column({ type: 'simple-array', nullable: true })
  amenities: Amenity[];

  @Column({ type: 'simple-array', nullable: true })
  safetyItems: SafetyItem[];

  @OneToMany(() => ListingPhoto, (photo) => photo.listing, {
  })
  photos: ListingPhoto[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @Column({ type: 'simple-array', nullable: true })
  highlights: Highlight[];

  @Column({ type: 'text', nullable: true })
  description: string;

  // =====================
  // STEP 3: Booking & Pricing
  // =====================

  @Column({
    type: 'enum',
    enum: BookingSetting,
    nullable: true,
  })
  bookingSetting: BookingSetting;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weekdayPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'weekday_after_tax_price',
  })
  weekdayAfterTaxPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weekendPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'weekend_after_tax_price',
  })
  weekendAfterTaxPrice: number;

  // NOTE: weekend_charge_percentage is calculated dynamically, NOT stored

  // =====================
  // STEP 4: Discounts
  // =====================

  @Column({ type: 'simple-array', nullable: true, name: 'safety_details' })
  safetyDetails: string[];

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'host_country' })
  hostCountry: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'host_street_address' })
  hostStreetAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'host_apt_floor' })
  hostAptFloor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'host_city' })
  hostCity: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'host_state' })
  hostState: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'host_postal_code' })
  hostPostalCode: string | null;

  @Column({ type: 'boolean', default: false, name: 'hosting_as_business' })
  hostingAsBusiness: boolean;

  @OneToMany(() => Discount, (discount) => discount.listing, {
  })
  discounts: Discount[];

  // =====================
  // Status & Metadata
  // =====================

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  // Track which steps have been completed
  @Column({ type: 'boolean', default: false })
  step1Completed: boolean;

  @Column({ type: 'boolean', default: false })
  step2Completed: boolean;

  @Column({ type: 'boolean', default: false })
  step3Completed: boolean;

  @Column({ type: 'boolean', default: false })
  step4Completed: boolean;

  // Owner relationship
  @Column({ type: 'uuid' })
  hostId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hostId' })
  host: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property for weekend charge percentage
  get weekendChargePercentage(): number | null {
    if (
      this.weekdayPrice == null ||
      this.weekendPrice == null ||
      this.weekdayPrice === 0
    ) {
      return null;
    }
    return ((this.weekendPrice - this.weekdayPrice) / this.weekdayPrice) * 100;
  }
}
