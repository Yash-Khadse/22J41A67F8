import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Click } from "./Click";

@Entity()
export class ShortUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shortcode: string;

  @Column()
  originalUrl: string;

  @Column()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @OneToMany(() => Click, (click) => click.shortUrl)
  clicks: Click[];
}
