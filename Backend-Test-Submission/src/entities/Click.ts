import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { ShortUrl } from "./ShortUrl";

@Entity()
export class Click {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShortUrl, (shortUrl) => shortUrl.clicks)
  shortUrl: ShortUrl;

  @Column()
  timestamp: Date;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  geo: string;
}
