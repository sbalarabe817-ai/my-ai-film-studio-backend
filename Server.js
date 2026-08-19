const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURATION
// ============================================================

const API_KEY = process.env.DASHSCOPE_API_KEY || "";
const BASE_URL =
  process.env.DASHSCOPE_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/api/v1";

const VIDEO_MODEL =
  process.env.WAN_MODEL || "wan2.7-t2v-2026-06-12";

app.use(express.json({ limit: "2mb" }));

// ============================================================
// FRONTEND
// ============================================================

const HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>My AI Film Studio</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #09090b;
  color: #ffffff;
}

header {
  padding: 18px 20px;
  border-bottom: 1px solid #27272a;
  background: #111113;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-size: 22px;
  font-weight: 800;
}

.logo span {
  color: #a855f7;
}

.container {
  width: min(1000px, 94%);
  margin: 30px auto 80px;
}

.hero {
  text-align: center;
  margin-bottom: 28px;
}

.hero h1 {
  font-size: clamp(30px, 7vw, 56px);
  margin: 10px 0;
}

.hero p {
  color: #a1a1aa;
  line-height: 1.6;
}

.card {
  background: #111113;
  border: 1px solid #27272a;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

textarea,
select {
  width: 100%;
  background: #18181b;
  color: #ffffff;
  border: 1px solid #3f3f46;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  outline: none;
}

textarea {
  min-height: 150px;
  resize: vertical;
}

textarea:focus,
select:focus {
  border-color: #a855f7;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 16px;
}

button {
  width: 100%;
  margin-top: 18px;
  border: 0;
  border-radius: 12px;
  padding: 15px;
  font-size: 16px;
  font-weight: 800;
  background: #9333ea;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #7e22ce;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.status {
  display: none;
  padding: 15px;
  margin-top: 18px;
  border-radius: 12px;
  background: #18181b;
  color: #d4d4d8;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid #3f3f46;
  border-top-color: #a855f7;
  border-radius: 50%;
  display: inline-block;
  animation: spin 1s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  background: #3f1515;
  color: #fecaca;
}

.success {
  background: #12351f;
  color: #bbf7d0;
}

video {
  width: 100%;
  border-radius: 14px;
  margin-top: 15px;
  background: #000;
}

.download {
  display: block;
  text-align: center;
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  background: #27272a;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.small {
  color: #71717a;
  font-size: 13px;
  margin-top: 10px;
  line-height: 1.5;
}

.footer {
  text-align: center;
  color: #52525b;
  margin-top: 40px;
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .container {
    margin-top: 20px;
  }
}
</style>
</head>

<body>

<header>
  <div class="logo">🎬 My <span>AI Film Studio</span></div>
</header>

<div class="container">

  <section class="hero">
    <h1>Create AI Videos</h1>
    <p>
      Turn your imagination into cinematic videos using Wan AI.
    </p>
  </section>

  <section class="card">

    <label for="prompt">Describe your video</label>

    <textarea
      id="prompt"
      placeholder="Example: A cinematic Nigerian luxury drama. A young man walks through a beautiful mansion at night while rain falls outside. Camera slowly moves toward him, dramatic lighting, realistic characters, cinematic atmosphere."
    ></textarea>

    <div class="grid">

      <div>
        <label for="duration">Duration</label>
        <select id="duration">
          <option value="5">5 seconds</option>
          <option value="10" selected>10 seconds</option>
          <option value="15">15 seconds</option>
        </select>
      </div>

      <div>
        <label for="ratio">Aspect Ratio</label>
        <select id="ratio">
          <option value="16:9" selected>16:9 Landscape</option>
          <option value="9:16">9:16 Portrait</option>
          <option value="1:1">1:1 Square</option>
        </select>
      </div>

      <div>
        <label for="resolution">Resolution</label>
        <select id="resolution">
          <option value="720P" selected>720P</option>
        </select>
      </div>

    </div>

    <button id="generateBtn" onclick="generateVideo()">
      ✨ Generate Video
    </button>

    <div id="status" class="status"></div>

  </section>

  <section id="resultCard" class="card" style="display:none">

    <h2>🎬 Your Video</h2>

    <video id="videoPlayer" controls playsinline></video>

    <a
      id="downloadBtn"
      class="download"
      href="#"
      target="_blank"
      download
    >
      ⬇️ Download Video
    </a>

    <p class="small">
      Video links supplied by the AI provider may expire after a limited
      period. Download your finished video promptly.
    </p>

  </section>

  <div class="footer">
    My AI Film Studio
  </div>

</div>

<script>

let currentTask = null;
let pollingTimer = null;

function showStatus(message, type = "") {

  const box = document.getElementById("status");

  box.style.display = "block";

  box.className = "status " + type;

  box.innerHTML = message;
}

async function generateVideo() {

  const prompt =
    document.getElementById("prompt").value.trim();

  const duration =
    Number(document.getElementById("duration").value);

  const ratio =
    document.getElementById("ratio").value;

  const resolution =
    document.getElementById("resolution").value;

  const button =
    document.getElementById("generateBtn");

  if (!prompt) {

    showStatus(
      "Please describe the video you want to create.",
      "error"
    );

    return;
  }

  button.disabled = true;

  document.getElementById("resultCard").style.display = "none";

  showStatus(
    '<span class="spinner"></span> Sending your video request to Wan AI...',
    ""
  );

  try {

    const response = await fetch("/api/generate", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        prompt,
        duration,
        ratio,
        resolution
      })

    });

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to start video generation."
      );

    }

    currentTask = data.task_id;

    showStatus(
      '<span class="spinner"></span> Video generation started. This can take several minutes...',
      ""
    );

    startPolling();

  } catch (error) {

    button.disabled = false;

    showStatus(
      "❌ " + escapeHtml(error.message),
      "error"
    );

  }
}

function startPolling() {

  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  checkStatus();

  pollingTimer = setInterval(
    checkStatus,
    10000
  );
}

async function checkStatus() {

  if (!currentTask) {
    return;
  }

  try {

    const response = await fetch(
      "/api/status/" +
      encodeURIComponent(currentTask)
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to check task status."
      );

    }

    const status =
      data.status || "UNKNOWN";

    if (
      status === "PENDING" ||
      status === "RUNNING"
    ) {

      showStatus(
        '<span class="spinner"></span> Wan AI is generating your video... Status: ' +
        escapeHtml(status),
        ""
      );

      return;
    }

    if (status === "SUCCEEDED") {

      clearInterval(pollingTimer);

      document.getElementById(
        "generateBtn"
      ).disabled = false;

      const videoUrl =
        data.video_url;

      if (!videoUrl) {

        showStatus(
          "The task finished but no video URL was returned.",
          "error"
        );

        return;
      }

      const player =
        document.getElementById("videoPlayer");

      player.src = videoUrl;

      const download =
        document.getElementById("downloadBtn");

      download.href = videoUrl;

      document.getElementById(
        "resultCard"
      ).style.display = "block";

      showStatus(
        "✅ Your video is ready!",
        "success"
      );

      return;
    }

    if (status === "FAILED") {

      clearInterval(pollingTimer);

      document.getElementById(
        "generateBtn"
      ).disabled = false;

      showStatus(
        "❌ Video generation failed: " +
        escapeHtml(
          data.message ||
          "Unknown error"
        ),
        "error"
      );

      return;
    }

    showStatus(
      '<span class="spinner"></span> Current status: ' +
      escapeHtml(status),
      ""
    );

  } catch (error) {

    showStatus(
      "❌ " + escapeHtml(error.message),
      "error"
    );

  }
}

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}

</script>

</body>
</html>
`;

// ============================================================
// HOME PAGE
// ============================================================

app.get("/", (req, res) => {

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  res.send(HTML);

});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    service: "My AI Film Studio",
    model: VIDEO_MODEL,
    api_configured: Boolean(API_KEY)
  });

});

// ============================================================
// CREATE VIDEO
// ============================================================

app.post("/api/generate", async (req, res) => {

  try {

    if (!API_KEY) {

      return res.status(500).json({

        error:
          "DASHSCOPE_API_KEY is not configured. Add your Model Studio API key to the deployment environment."

      });

    }

    const {
      prompt,
      duration = 10,
      ratio = "16:9",
      resolution = "720P"
    } = req.body || {};

    if (
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {

      return res.status(400).json({

        error:
          "A video prompt is required."

      });

    }

    const allowedDurations =
      [5, 10, 15];

    const cleanDuration =
      Number(duration);

    if (
      !allowedDurations.includes(
        cleanDuration
      )
    ) {

      return res.status(400).json({

        error:
          "Duration must be 5, 10, or 15 seconds."

      });

    }

    const allowedRatios =
      [
        "16:9",
        "9:16",
        "1:1"
      ];

    const cleanRatio =
      allowedRatios.includes(ratio)
        ? ratio
        : "16:9";

    const cleanResolution =
      resolution === "720P"
        ? "720P"
        : "720P";

    const endpoint =
      BASE_URL.replace(/\/$/, "") +
      "/services/aigc/video-generation/video-synthesis";

    const payload = {

      model: VIDEO_MODEL,

      input: {

        prompt: prompt.trim()

      },

      parameters: {

        resolution:
          cleanResolution,

        ratio:
          cleanRatio,

        prompt_extend:
          true,

        watermark:
          false,

        duration:
          cleanDuration

      }

    };

    const response =
      await fetch(
        endpoint,
        {

          method: "POST",

          headers: {

            "Authorization":
              "Bearer " + API_KEY,

            "Content-Type":
              "application/json",

            "X-DashScope-Async":
              "enable"

          },

          body:
            JSON.stringify(payload)

        }
      );

    const text =
      await response.text();

    let data;

    try {

      data =
        JSON.parse(text);

    } catch {

      data = {
        raw: text
      };

    }

    if (!response.ok) {

      console.error(
        "Wan API error:",
        data
      );

      return res.status(
        response.status
      ).json({

        error:
          data?.message ||
          data?.code ||
          "Wan API request failed.",

        details:
          data

      });

    }

    const taskId =
      data?.output?.task_id;

    if (!taskId) {

      console.error(
        "No task ID returned:",
        data
      );

      return res.status(502).json({

        error:
          "Wan API did not return a task ID.",

        details:
          data

      });

    }

    return res.json({

      success: true,

      task_id:
        taskId,

      status:
        data?.output?.task_status ||
        "PENDING"

    });

  } catch (error) {

    console.error(
      "Generate error:",
      error
    );

    return res.status(500).json({

      error:
        error.message ||
        "Internal server error."

    });

  }

});

// ============================================================
// CHECK VIDEO TASK
// ============================================================

app.get(
  "/api/status/:taskId",
  async (req, res) => {

    try {

      if (!API_KEY) {

        return res.status(500).json({

          error:
            "DASHSCOPE_API_KEY is not configured."

        });

      }

      const taskId =
        req.params.taskId;

      if (!taskId) {

        return res.status(400).json({

          error:
            "Task ID is required."

        });

      }

      const endpoint =
        BASE_URL.replace(/\/$/, "") +
        "/tasks/" +
        encodeURIComponent(taskId);

      const response =
        await fetch(
          endpoint,
          {

            method: "GET",

            headers: {

              "Authorization":
                "Bearer " + API_KEY

            }

          }
        );

      const text =
        await response.text();

      let data;

      try {

        data =
          JSON.parse(text);

      } catch {

        data = {
          raw: text
        };

      }

      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          error:
            data?.message ||
            "Unable to check task.",

          details:
            data

        });

      }

      const output =
        data?.output || {};

      const status =
        output?.task_status ||
        "UNKNOWN";

      return res.json({

        success: true,

        task_id:
          output?.task_id ||
          taskId,

        status,

        video_url:
          output?.video_url ||
          null,

        message:
          output?.message ||
          data?.message ||
          null,

        raw:
          data

      });

    } catch (error) {

      console.error(
        "Status error:",
        error
      );

      return res.status(500).json({

        error:
          error.message ||
          "Internal server error."

      });

    }

  }
);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {

  if (
    req.path.startsWith("/api/")
  ) {

    return res.status(404).json({

      error:
        "API endpoint not found."

    });

  }

  res.status(404).send(
    "Page not found."
  );

});

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "My AI Film Studio is running"
    );

    console.log(
      "Port:",
      PORT
    );

    console.log(
      "Model:",
      VIDEO_MODEL
    );

    console.log(
      "API configured:",
      Boolean(API_KEY)
    );

    console.log(
      "======================================"
    );

  }
);
