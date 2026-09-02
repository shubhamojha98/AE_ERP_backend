import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Controller to securely proxy external images (e.g. from AWS S3 buckets)
 * to bypass client-side browser CORS restrictions.
 */
export const proxyImageHandler = async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send("URL is required");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch (err) {
    return res.status(400).send("Invalid URL format");
  }

  try {
    const host = parsedUrl.hostname;

    // SSRF Mitigation: Restrict proxying to only known S3/municipal hosts + env configuration override
    const configuredDomains = process.env.ALLOWED_PROXY_DOMAINS
      ? process.env.ALLOWED_PROXY_DOMAINS.split(",")
      : [];

    const allowedDomains = [
      "heliwarestorage.s3.us-west-2.amazonaws.com",
      "uatbiraservices.com",
      ...configuredDomains
    ];

    const isAllowed = allowedDomains.some(
      (domain) => host === domain || host.endsWith("." + domain)
    );

    if (!isAllowed) {
      return res.status(403).send("Forbidden: Domain not in whitelist");
    }

    // Use streaming to pipe data directly (very fast, uses no server buffer memory)
    const response = await axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
      timeout: 5000 // 5 seconds timeout
    });

    // Handle client disconnects to destroy the stream socket and prevent memory leaks
    req.on("close", () => {
      if (response && response.data && !response.data.destroyed) {
        response.data.destroy();
      }
    });

    const contentLength = response.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      if (response.data && !response.data.destroyed) {
        response.data.destroy();
      }
      return res.status(400).send("File size limit exceeded (max 10MB)");
    }

    // Set Cache-Control to cache external assets for 24 hours in the browser/client-side
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Pipe the S3 read stream straight into the Express response stream
    response.data.pipe(res);
  } catch (error: any) {
    console.error("[Image Proxy Controller] Error:", error.message || error);
    res.status(500).send("Failed to proxy image");
  }
};
