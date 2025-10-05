
const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const FormData = require("form-data");
const { loadSettings } = require("./settings");

function httpMultipartUpload(filePath, urlString, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), path.basename(filePath));

    const opts = {
      method: "POST",
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + (url.search || ""),
      headers: { ...headers, ...form.getHeaders() }
    };

    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c.toString()));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, body });
        else reject(new Error(`Upload failed: ${res.statusCode} ${body}`));
      });
    });
    req.on("error", reject);
    form.pipe(req);
  });
}

function registerUploadIPC() {
  ipcMain.handle("upload:file", async (_evt, { filePath }) => {
    const s = loadSettings();
    if (!s.upload || s.upload.provider !== "http-multipart") {
      throw new Error("Upload provider not configured (Settings → Upload).");
    }
    const url = s.upload.url;
    const headers = {};
    if (s.upload.authType === "bearer" && s.upload.token) {
      headers["Authorization"] = "Bearer " + s.upload.token;
    } else if (s.upload.apiKey) {
      headers["x-api-key"] = s.upload.apiKey;
    }
    return await httpMultipartUpload(filePath, url, headers);
  });
}

module.exports = { registerUploadIPC };
