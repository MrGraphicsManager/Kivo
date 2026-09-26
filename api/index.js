const https = require("https");
const http = require("http");

function requestHandler(req, res) {
  const target = String(process.env.KIVO_BACKEND_URL || "").replace(/\/$/, "");
  if (!target) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ detail: "KIVO_BACKEND_URL is not configured." }));
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target + (req.url || "/"));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: "Invalid KIVO_BACKEND_URL." }));
    return;
  }

  const client = targetUrl.protocol === "http:" ? http : https;
  const headers = { ...req.headers, host: targetUrl.host };
  delete headers["content-length"];

  const proxy = client.request({
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === "http:" ? 80 : 443),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers,
  }, (upstream) => {
    res.statusCode = upstream.statusCode || 502;
    for (const [key, value] of Object.entries(upstream.headers)) {
      if (value !== undefined) res.setHeader(key, value);
    }
    upstream.pipe(res);
  });

  proxy.on("error", (err) => {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ detail: "Backend unavailable." }));
  });

  req.pipe(proxy);
}

module.exports = requestHandler;
