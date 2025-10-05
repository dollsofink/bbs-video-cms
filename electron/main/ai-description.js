
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { ipcMain } = require("electron");
const { loadSettings } = require("./settings");
const { takeSnapshot } = require("./ffmpeg-utils");
const { writeXmpForVideo } = require("./metadata-xmp");
const OpenAI = require("openai");

const DEFAULT_PROMPT = `You are a creative romance novel copywriter. Analyze the attached image and write a SHORT STORY (~500–520 words) ... SEO keywords: <comma-separated>`;

function parseAiTextIntoFields(text) {
  // Extract Title:, Story:, SEO keywords: lines loosely
  const title = (text.match(/^\s*Title:\s*(.+)\s*$/mi) || [,""])[1].trim();
  const story = (text.match(/^\s*Story:\s*([\s\S]*?)^\s*Visual beats:/mi) || [,""])[1].trim() ||
                (text.match(/^\s*Story:\s*([\s\S]*?)^\s*SEO keywords:/mi) || [,""])[1].trim();
  const seoLine = (text.match(/^\s*SEO keywords:\s*(.+)$/mi) || [,""])[1].trim();
  const keywords = seoLine ? seoLine.split(",").map(s => s.trim()).filter(Boolean) : [];
  const description = [story].filter(Boolean).join("\n\n");
  return { title, description, keywords };
}

async function dataUrlForFile(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const mime = ext === ".png" ? "image/png"
            : ext === ".webp" ? "image/webp"
            : ext === ".gif" ? "image/gif"
            : "image/jpeg";
  const b64 = (await fsp.readFile(absPath)).toString("base64");
  return `data:${mime};base64,${b64}`;
}

function registerAIDescriptionIPC() {
  ipcMain.handle("ai:describeVideo", async (_evt, { videoPath, seconds }) => {
    const s = loadSettings();
    if (!s.openaiApiKey) throw new Error("OpenAI API key is not set. Open Settings and add it.");

    // Snapshot
    const snap = await takeSnapshot(videoPath, seconds || 0);
    const imageDataUrl = await dataUrlForFile(snap);

    const prompt = (s.basePrompt && s.basePrompt.trim()) ? s.basePrompt : DEFAULT_PROMPT;
    const model = s.model || "gpt-4o-mini";

    const client = new OpenAI({ apiKey: s.openaiApiKey });
    const payload = {
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl },
          ],
        },
      ],
    };

    const resp = await client.responses.create(payload);
    let text = resp.output_text;
    if (!text && Array.isArray(resp.output)) {
      const chunks = [];
      for (const item of resp.output) {
        if (!item?.content) continue;
        for (const c of item.content) if (c.type === "output_text" && c.text) chunks.push(c.text);
      }
      text = chunks.join("\n").trim();
    }
    if (!text) throw new Error("No text returned from model.");

    // Parse + write XMP
    const fields = parseAiTextIntoFields(text);
    const xmpPath = writeXmpForVideo(videoPath, fields);

    return { ok: true, xmpPath, fields, snapshot: snap, raw: text };
  });
}

module.exports = { registerAIDescriptionIPC };
