
const { ipc } = window.electron;

async function load() {
  const s = await ipc.invoke("settings:get");
  document.getElementById("apiKey").value = s.openaiApiKey || "";
  document.getElementById("model").value = s.model || "gpt-4o-mini";
  document.getElementById("basePrompt").value = s.basePrompt || "";
  document.getElementById("uploadProvider").value = (s.upload && s.upload.provider) || "none";
  document.getElementById("uploadUrl").value = (s.upload && s.upload.url) || "";
  document.getElementById("uploadAuthType").value = (s.upload && (s.upload.authType||"none")) || "none";
  document.getElementById("uploadToken").value = (s.upload && (s.upload.token||s.upload.apiKey||"")) || "";
  document.getElementById("autoUpdateChk").checked = s.autoUpdate !== false;
}
document.getElementById("saveBtn").addEventListener("click", async () => {
  const s = {
    openaiApiKey: document.getElementById("apiKey").value.trim(),
    model: document.getElementById("model").value,
    basePrompt: document.getElementById("basePrompt").value
  };
  s.upload = { provider: document.getElementById("uploadProvider").value };
  if (s.upload.provider === "http-multipart") {
    s.upload.url = document.getElementById("uploadUrl").value.trim();
    const authType = document.getElementById("uploadAuthType").value;
    s.upload.authType = authType;
    if (authType === 'bearer') s.upload.token = document.getElementById("uploadToken").value.trim();
    if (authType === 'apikey') s.upload.apiKey = document.getElementById("uploadToken").value.trim();
  }
  s.autoUpdate = document.getElementById("autoUpdateChk").checked;
  await ipc.invoke("settings:set", s);
  alert("Saved.");
});
load();
