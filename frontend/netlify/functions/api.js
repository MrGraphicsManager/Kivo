const https = require("https");
const http = require("http");

/**
 * Kivo Netlify API proxy.
 *
 * The legacy stateful Netlify backend has been retired. All production
 * application state and business logic now lives in the FastAPI/MongoDB
 * backend. Set KIVO_BACKEND_URL to the FastAPI /api base URL, e.g.
 * https://api.example.com/api
 */
exports.handler = async (event) => {
  const target = String(process.env.KIVO_BACKEND_URL || "").replace(/\/$/, "");
  if (!target) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detail: "KIVO_BACKEND_URL is not configured." }),
    };
  }

  let targetUrl;
  try {
    targetUrl = new URL(target + (event.path || "").replace(/^\/\.netlify\/functions\/api/, "") + (event.rawQuery ? `?${event.rawQuery}` : ""));
  } catch {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detail: "Invalid KIVO_BACKEND_URL." }),
    };
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64")
    : Buffer.from(event.body || "");

  const headers = { ...(event.headers || {}), host: targetUrl.host };
  delete headers.host;
  delete headers["content-length"];
  delete headers["Content-Length"];

  return await new Promise((resolve) => {
    const client = targetUrl.protocol === "http:" ? http : https;
    const req = client.request(
      {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === "http:" ? 80 : 443),
        path: targetUrl.pathname + targetUrl.search,
        method: event.httpMethod || "GET",
        headers,
      },
      (upstream) => {
        const chunks = [];
        upstream.on("data", (chunk) => chunks.push(chunk));
        upstream.on("end", () => {
          const responseBody = Buffer.concat(chunks);
          const responseHeaders = {};
          for (const [key, value] of Object.entries(upstream.headers || {})) {
            if (value !== undefined) responseHeaders[key] = value;
          }
          resolve({
            statusCode: upstream.statusCode || 502,
            headers: responseHeaders,
            isBase64Encoded: true,
            body: responseBody.toString("base64"),
          });
        });
      }
    );

    req.on("error", () => {
      resolve({
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detail: "Backend unavailable." }),
      });
    });

    if (body.length > 0 && event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
      req.write(body);
    }
    req.end();
  });
};
