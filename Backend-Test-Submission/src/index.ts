import "reflect-metadata";
import express from "express";
import { DataSource } from "typeorm";
import { ShortUrl } from "./entities/ShortUrl";
import { Click } from "./entities/Click";
import { requestLogger, errorLogger } from "./middleware/logging";
import { generateShortcode, isValidShortcode } from "./utils/shortcode";
import { Log } from "../../Logging-Middleware/logger";
import * as geoip from "geoip-lite";

const app = express();
app.use(express.json());
app.use(requestLogger);

const AppDataSource = new DataSource({
  type: "sqlite",
  database: "shorturls.sqlite",
  synchronize: true,
  entities: [ShortUrl, Click],
});

const DEFAULT_VALIDITY_MINUTES = 30;

// Create Short URL
app.post("/shorturls", async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;
    if (!url || typeof url !== "string") {
      await Log(
        "POST /shorturls",
        "WARN",
        "url-shortener",
        "Malformed input: missing url"
      );
      return res.status(400).json({ error: "Missing or invalid 'url' field" });
    }
    let code = shortcode;
    if (code) {
      if (!isValidShortcode(code)) {
        await Log(
          "POST /shorturls",
          "WARN",
          "url-shortener",
          "Invalid custom shortcode"
        );
        return res.status(400).json({ error: "Invalid shortcode" });
      }
      const exists = await AppDataSource.getRepository(ShortUrl).findOneBy({
        shortcode: code,
      });
      if (exists) {
        await Log(
          "POST /shorturls",
          "WARN",
          "url-shortener",
          "Shortcode collision"
        );
        return res.status(409).json({ error: "Shortcode already exists" });
      }
    } else {
      // Generate unique shortcode
      let tries = 0;
      do {
        code = generateShortcode();
        tries++;
      } while (
        (await AppDataSource.getRepository(ShortUrl).findOneBy({
          shortcode: code,
        })) &&
        tries < 10
      );
      if (!code) {
        await Log(
          "POST /shorturls",
          "ERROR",
          "url-shortener",
          "Failed to generate unique shortcode"
        );
        return res
          .status(500)
          .json({ error: "Failed to generate unique shortcode" });
      }
    }
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() +
        60000 * (validity ? parseInt(validity) : DEFAULT_VALIDITY_MINUTES)
    );
    const shortUrl = AppDataSource.getRepository(ShortUrl).create({
      shortcode: code,
      originalUrl: url,
      createdAt: now,
      expiresAt,
    });
    await AppDataSource.getRepository(ShortUrl).save(shortUrl);
    await Log(
      "POST /shorturls",
      "INFO",
      "url-shortener",
      `Short URL created: ${code}`
    );
    res.status(201).json({
      shortcode: code,
      url,
      createdAt: now,
      expiresAt,
    });
  } catch (err: any) {
    await Log("POST /shorturls", "ERROR", "url-shortener", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Redirect
app.get("/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;
    const repo = AppDataSource.getRepository(ShortUrl);
    const shortUrl = await repo.findOneBy({ shortcode });
    if (!shortUrl) {
      await Log(
        "GET /:shortcode",
        "WARN",
        "url-shortener",
        "Shortcode not found"
      );
      return res.status(404).json({ error: "Shortcode not found" });
    }
    if (shortUrl.expiresAt < new Date()) {
      await Log(
        "GET /:shortcode",
        "WARN",
        "url-shortener",
        "Shortcode expired"
      );
      return res.status(410).json({ error: "Shortcode expired" });
    }
    // Track click
    const geo = geoip.lookup(req.ip) || {};
    const click = AppDataSource.getRepository(Click).create({
      shortUrl,
      timestamp: new Date(),
      referrer: req.get("referer") || "",
      geo: geo.country || "",
    });
    await AppDataSource.getRepository(Click).save(click);
    await Log(
      "GET /:shortcode",
      "INFO",
      "url-shortener",
      `Redirected: ${shortcode}`
    );
    res.redirect(shortUrl.originalUrl);
  } catch (err: any) {
    await Log("GET /:shortcode", "ERROR", "url-shortener", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Statistics
app.get("/shorturls/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;
    const repo = AppDataSource.getRepository(ShortUrl);
    const shortUrl = await repo.findOne({
      where: { shortcode },
      relations: ["clicks"],
    });
    if (!shortUrl) {
      await Log(
        "GET /shorturls/:shortcode",
        "WARN",
        "url-shortener",
        "Shortcode not found"
      );
      return res.status(404).json({ error: "Shortcode not found" });
    }
    const totalClicks = shortUrl.clicks.length;
    const clickDetails = shortUrl.clicks.map((c) => ({
      timestamp: c.timestamp,
      referrer: c.referrer,
      geo: c.geo,
    }));
    await Log(
      "GET /shorturls/:shortcode",
      "INFO",
      "url-shortener",
      `Stats retrieved: ${shortcode}`
    );
    res.json({
      shortcode,
      originalUrl: shortUrl.originalUrl,
      createdAt: shortUrl.createdAt,
      expiresAt: shortUrl.expiresAt,
      totalClicks,
      clicks: clickDetails,
    });
  } catch (err: any) {
    await Log(
      "GET /shorturls/:shortcode",
      "ERROR",
      "url-shortener",
      err.message || err
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use(errorLogger);

AppDataSource.initialize().then(() => {
  app.listen(3000, async () => {
    await Log(
      "startup",
      "INFO",
      "url-shortener",
      "Server started on port 3000"
    );
  });
});
