import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Wand2,
  Download,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Eye,
  Zap,
  RefreshCw,
  Check,
  AlertTriangle,
  Copy,
  RotateCcw,
  Clock,
} from "lucide-react";
import JSZip from "jszip";
import {
  initDB,
  saveSession,
  updateSession,
  getSessions,
  getStats,
} from "./db";

const STEPS = ["Setup", "Detect", "Theme", "Generate", "Download"];

const THEME_PRESETS = [
  {
    id: "minimal-bw",
    name: "Minimal B&W",
    desc: "Clean line icons on black",
    prompt:
      "minimalist single app icon, thin white line art symbol on pure black background, single stroke weight, perfectly centered, no text, no label, clean edges, square format, iOS style",
  },
  {
    id: "dark-glyph",
    name: "Dark Glyph",
    desc: "Solid white symbols on black",
    prompt:
      "solid white glyph symbol on pure black background, filled icon, minimal geometric, no gradients, perfectly centered, no text, square format, iOS app icon style",
  },
  {
    id: "outline-mono",
    name: "Outline Mono",
    desc: "White outlines, black fill",
    prompt:
      "monochrome white outlined icon on black background, consistent 2px stroke, geometric, centered, no text, clean minimal iOS app icon, square",
  },
  {
    id: "neo-brutal",
    name: "Neo Brutal",
    desc: "Bold chunky B&W shapes",
    prompt:
      "neo-brutalist style iOS app icon, thick bold white shapes on black background, stark contrast, geometric chunky design, no text, centered, square format",
  },
  {
    id: "soft-ink",
    name: "Soft Ink",
    desc: "Hand-drawn ink on dark",
    prompt:
      "hand-drawn white ink illustration on dark black background, organic lines, sketch-like artistic icon, centered, no text, iOS app icon style, square",
  },
  {
    id: "inverted",
    name: "Light Mode",
    desc: "Black symbols on white",
    prompt:
      "minimalist black symbol on pure white background, clean line art, single icon centered, no text, iOS app icon style, square format",
  },
  { id: "custom", name: "Custom", desc: "Your own prompt", prompt: "" },
];

const THEME_VISUALS = {
  "minimal-bw": {
    bg: "#050505",
    cardBg: "#0a0a0a",
    cardBorder: "#161616",
    accent: "#ffffff",
    accentGlow: "rgba(255,255,255,0.06)",
    textPrimary: "#e0e0e0",
    textSecondary: "#888",
    textMuted: "#444",
    dotActive: "#fff",
    dotDone: "#4ade80",
    inputBg: "#0e0e0e",
    inputBorder: "#1e1e1e",
    tagSelectedBg: "#fff",
    tagSelectedColor: "#000",
    borderRadius: 14,
    gradientStart: "#fff",
    gradientEnd: "#666",
  },
  "dark-glyph": {
    bg: "#030308",
    cardBg: "#08081a",
    cardBorder: "#1a1a3a",
    accent: "#a78bfa",
    accentGlow: "rgba(167,139,250,0.08)",
    textPrimary: "#d4d0f0",
    textSecondary: "#7c78a0",
    textMuted: "#3a3860",
    dotActive: "#a78bfa",
    dotDone: "#6ee7b7",
    inputBg: "#0c0c20",
    inputBorder: "#1e1e40",
    tagSelectedBg: "#a78bfa",
    tagSelectedColor: "#000",
    borderRadius: 14,
    gradientStart: "#a78bfa",
    gradientEnd: "#4c1d95",
  },
  "outline-mono": {
    bg: "#060606",
    cardBg: "#0b0b0b",
    cardBorder: "#1a1a1a",
    accent: "#d4d4d4",
    accentGlow: "rgba(212,212,212,0.06)",
    textPrimary: "#d4d4d4",
    textSecondary: "#777",
    textMuted: "#3a3a3a",
    dotActive: "#d4d4d4",
    dotDone: "#86efac",
    inputBg: "#0e0e0e",
    inputBorder: "#222",
    tagSelectedBg: "#d4d4d4",
    tagSelectedColor: "#000",
    borderRadius: 12,
    gradientStart: "#d4d4d4",
    gradientEnd: "#555",
  },
  "neo-brutal": {
    bg: "#0a0a00",
    cardBg: "#111100",
    cardBorder: "#333300",
    accent: "#facc15",
    accentGlow: "rgba(250,204,21,0.08)",
    textPrimary: "#fef9c3",
    textSecondary: "#a3a033",
    textMuted: "#555520",
    dotActive: "#facc15",
    dotDone: "#4ade80",
    inputBg: "#0f0f05",
    inputBorder: "#2a2a10",
    tagSelectedBg: "#facc15",
    tagSelectedColor: "#000",
    borderRadius: 4,
    gradientStart: "#facc15",
    gradientEnd: "#854d0e",
  },
  "soft-ink": {
    bg: "#080808",
    cardBg: "#0d0d0d",
    cardBorder: "#1a1a1a",
    accent: "#e2b07a",
    accentGlow: "rgba(226,176,122,0.08)",
    textPrimary: "#e8d5c0",
    textSecondary: "#907050",
    textMuted: "#483828",
    dotActive: "#e2b07a",
    dotDone: "#86efac",
    inputBg: "#0f0d0a",
    inputBorder: "#2a2418",
    tagSelectedBg: "#e2b07a",
    tagSelectedColor: "#000",
    borderRadius: 18,
    gradientStart: "#e2b07a",
    gradientEnd: "#6b3a1a",
  },
  inverted: {
    bg: "#f5f5f5",
    cardBg: "#ffffff",
    cardBorder: "#e0e0e0",
    accent: "#000000",
    accentGlow: "rgba(0,0,0,0.04)",
    textPrimary: "#1a1a1a",
    textSecondary: "#666",
    textMuted: "#aaa",
    dotActive: "#000",
    dotDone: "#16a34a",
    inputBg: "#f0f0f0",
    inputBorder: "#d0d0d0",
    tagSelectedBg: "#000",
    tagSelectedColor: "#fff",
    borderRadius: 14,
    gradientStart: "#000",
    gradientEnd: "#555",
  },
  custom: {
    bg: "#050505",
    cardBg: "#0a0a0a",
    cardBorder: "#161616",
    accent: "#38bdf8",
    accentGlow: "rgba(56,189,248,0.08)",
    textPrimary: "#e0e0e0",
    textSecondary: "#888",
    textMuted: "#444",
    dotActive: "#38bdf8",
    dotDone: "#4ade80",
    inputBg: "#0e0e0e",
    inputBorder: "#1e1e1e",
    tagSelectedBg: "#38bdf8",
    tagSelectedColor: "#000",
    borderRadius: 14,
    gradientStart: "#38bdf8",
    gradientEnd: "#0369a1",
  },
};

const URL_SCHEMES = {
  Phone: "tel://",
  Messages: "sms://",
  Mail: "mailto://",
  Safari: "x-web-search://",
  Camera: "camera://",
  Photos: "photos-redirect://",
  Maps: "maps://",
  Clock: "clock-alarm://",
  Weather: "weather://",
  Notes: "mobilenotes://",
  Reminders: "x-apple-reminderkit://",
  Calendar: "calshow://",
  Settings: "App-prefs://",
  "App Store": "itms-apps://",
  Music: "music://",
  Podcasts: "podcasts://",
  FaceTime: "facetime://",
  Contacts: "contacts://",
  Files: "shareddocuments://",
  Health: "x-apple-health://",
  Wallet: "shoebox://",
  Calculator: "calc://",
  Shortcuts: "shortcuts://",
  Instagram: "instagram://",
  WhatsApp: "whatsapp://",
  Telegram: "tg://",
  Twitter: "twitter://",
  YouTube: "youtube://",
  Spotify: "spotify://",
  Netflix: "netflix://",
  TikTok: "snssdk1233://",
  Snapchat: "snapchat://",
  LinkedIn: "linkedin://",
  Chrome: "googlechrome://",
  Gmail: "googlegmail://",
  Slack: "slack://",
  Notion: "notion://",
  Discord: "discord://",
  Uber: "uber://",
  Amazon: "com.amazon.mobile.shopping://",
  Reddit: "reddit://",
  Pinterest: "pinterest://",
  "Google Maps": "comgooglemaps://",
  "Google Drive": "googledrive://",
  "Google Photos": "googlephotos://",
  Swiggy: "swiggy://",
  Zomato: "zomato://",
  PayTM: "paytm://",
  PhonePe: "phonepe://",
  GPay: "gpay://",
  Flipkart: "flipkart://",
  Myntra: "myntra://",
  Zerodha: "kite://",
  Groww: "groww://",
  CRED: "cred://",
  Ola: "olacabs://",
  Rapido: "rapido://",
  Dunzo: "dunzo://",
  Books: "ibooks://",
  Home: "com.apple.home://",
  Stocks: "stocks://",
  "Voice Memos": "voicememos://",
  Fitness: "fitnessapp://",
  Translate: "translate://",
  Compass: "compass://",
  Tips: "com.apple.tips://",
  Watch: "itms-watchs://",
  "Find My": "findmy://",
  Measure: "measure://",
  Magnifier: "magnifier://",
  X: "twitter://",
  Threads: "barcelona://",
  Signal: "sgnl://",
  Zoom: "zoomus://",
  "Microsoft Teams": "msteams://",
  Outlook: "ms-outlook://",
  OneNote: "onenote://",
  Excel: "ms-excel://",
  Word: "ms-word://",
  PowerPoint: "ms-powerpoint://",
};

const QUICK_APPS = [
  "Phone",
  "Messages",
  "Mail",
  "Safari",
  "Camera",
  "Photos",
  "Maps",
  "Clock",
  "Weather",
  "Notes",
  "Reminders",
  "Calendar",
  "Settings",
  "App Store",
  "Music",
  "Podcasts",
  "Instagram",
  "WhatsApp",
  "Telegram",
  "Twitter",
  "YouTube",
  "Spotify",
  "Netflix",
  "TikTok",
  "Snapchat",
  "LinkedIn",
  "Chrome",
  "Gmail",
  "Slack",
  "Notion",
  "Discord",
  "Reddit",
  "Uber",
  "Amazon",
  "Swiggy",
  "Zomato",
  "GPay",
  "PhonePe",
  "CRED",
  "Zerodha",
  "Groww",
  "Flipkart",
  "Myntra",
  "Google Maps",
  "Zoom",
  "Threads",
  "X",
  "FaceTime",
  "Contacts",
  "Files",
  "Health",
  "Wallet",
  "Calculator",
  "Shortcuts",
  "Signal",
  "Microsoft Teams",
  "Outlook",
  "Find My",
  "Fitness",
  "Books",
  "Home",
];

// App icon visual identity descriptions for better prompt engineering
const APP_ICONS = {
  Phone: "telephone handset receiver",
  Messages: "speech bubble / chat bubble",
  Mail: "envelope / letter",
  Safari: "compass with directional needle",
  Camera: "camera lens / camera body",
  Photos: "multicolored flower / sunflower with rainbow petals",
  Maps: "map pin / location marker on a map",
  Clock: "analog clock face showing time",
  Weather: "sun partially behind a cloud",
  Notes: "notepad with lines of text",
  Reminders: "checklist with checkmarks",
  Calendar: "calendar page showing date number",
  Settings: "mechanical gear / cog wheel",
  "App Store": "three stacked horizontal lines forming letter A with sticks",
  Music: "musical note / eighth note",
  Podcasts: "radio signal waves / broadcast antenna",
  FaceTime: "video camera",
  Contacts: "person silhouette / head outline on contact card",
  Files: "file folder",
  Health: "heart shape",
  Wallet: "credit cards / wallet pass",
  Calculator: "calculator with buttons grid",
  Shortcuts: "overlapping diamond shapes",
  Instagram: "vintage camera outline / viewfinder lens",
  WhatsApp: "phone handset inside a speech bubble",
  Telegram: "paper airplane",
  Twitter: "bird silhouette in flight",
  X: "letter X",
  YouTube: "play button triangle inside rounded rectangle",
  Spotify: "three curved sound wave arcs",
  Netflix: "letter N",
  TikTok: "musical note with wavy effect",
  Snapchat: "ghost outline",
  LinkedIn: "letters in tied together",
  Chrome: "circular segmented sphere / 4-part circle",
  Gmail: "envelope with M shape",
  Slack: "hashtag # made of rounded bars",
  Notion: "letter N in bold serif style",
  Discord: "game controller / smiling face with antenna",
  Reddit: "alien face with antenna / robot face",
  Uber: "letter U in clean font",
  Amazon: "arrow from A to Z / shopping smile",
  Pinterest: "letter P as a pin",
  "Google Maps": "map pin / location drop",
  "Google Drive": "triangle shape",
  "Google Photos": "pinwheel with 4 colored segments",
  Swiggy: "letter S with motion lines",
  Zomato: "spoon shape",
  PayTM: "wallet symbol",
  PhonePe: "stylized phone symbol",
  GPay: "letter G in Google style",
  Flipkart: "shopping bag with letter F",
  Myntra: "letter M with fashion style",
  Zerodha: "letter Z / kite shape",
  Groww: "upward growth arrow / plant sprout",
  CRED: "diamond / gem shape",
  Ola: "car silhouette",
  Rapido: "bike / scooter silhouette",
  Dunzo: "running person",
  Books: "open book",
  Home: "house silhouette",
  Stocks: "line chart going upward",
  "Voice Memos": "waveform / sound wave",
  Fitness: "fitness ring circles",
  Translate: "speech bubbles with different scripts",
  Compass: "compass rose / directional compass",
  "Find My": "radar / location pulse",
  Measure: "ruler",
  Magnifier: "magnifying glass",
  Signal: "speech bubble with dot",
  Zoom: "video camera with waves",
  "Microsoft Teams": "letter T with people silhouettes",
  Outlook: "envelope with letter O",
  OneNote: "letter N on notebook",
  Excel: "letter X on spreadsheet grid",
  Word: "letter W on document",
  PowerPoint: "letter P on presentation slide",
  Threads: "at @ symbol / thread loop",
  ChatGPT: "hexagonal / sparkle brain shape",
  Claude: "sparkle / star burst symbol",
  GitHub: "octocat / cat silhouette in circle",
  "Notion Calendar": "calendar with letter N",
  "WA Business": "phone inside speech bubble with B badge",
  TV: "TV screen / Apple TV logo",
  Utilities: "wrench and screwdriver tools",
  Apollo: "rocket ship / planet with ring",
  Superlayer: "layered shapes / stacked rectangles",
};

// iOS continuous superellipse corner radius
const IOS_RADIUS_RATIO = 0.2237;

function applyiOSCorners(canvas, size) {
  const r = size * IOS_RADIUS_RATIO;
  const ctx = canvas.getContext("2d");
  const mask = document.createElement("canvas");
  mask.width = size;
  mask.height = size;
  const mCtx = mask.getContext("2d");
  // iOS uses a continuous curve (superellipse). Approximate with bezier
  const k = 0.552; // magic number for circle approximation
  const kr = r * 1.28; // adjust for superellipse feel
  mCtx.beginPath();
  mCtx.moveTo(r, 0);
  mCtx.lineTo(size - r, 0);
  mCtx.bezierCurveTo(size - r + kr * 0.4, 0, size, r - kr * 0.4, size, r);
  mCtx.lineTo(size, size - r);
  mCtx.bezierCurveTo(
    size,
    size - r + kr * 0.4,
    size - r + kr * 0.4,
    size,
    size - r,
    size,
  );
  mCtx.lineTo(r, size);
  mCtx.bezierCurveTo(r - kr * 0.4, size, 0, size - r + kr * 0.4, 0, size - r);
  mCtx.lineTo(0, r);
  mCtx.bezierCurveTo(0, r - kr * 0.4, r - kr * 0.4, 0, r, 0);
  mCtx.closePath();
  mCtx.fillStyle = "#000";
  mCtx.fill();
  // Apply mask
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

function postProcessIcon(imgSrc, targetSize = 512) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      // Step 1: Draw resized & centered (crop to square)
      const srcSize = Math.min(img.width, img.height);
      const sx = (img.width - srcSize) / 2;
      const sy = (img.height - srcSize) / 2;
      ctx.drawImage(
        img,
        sx,
        sy,
        srcSize,
        srcSize,
        0,
        0,
        targetSize,
        targetSize,
      );
      // Step 2: Apply iOS superellipse corners
      applyiOSCorners(canvas, targetSize);
      // Step 3: Sharpen pass via unsharp mask
      const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
      const d = imageData.data;
      const w = targetSize;
      const sharpenAmount = 0.3;
      const copy = new Uint8ClampedArray(d);
      for (let y = 1; y < targetSize - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const center = copy[idx + c];
            const blur =
              (copy[((y - 1) * w + x) * 4 + c] +
                copy[((y + 1) * w + x) * 4 + c] +
                copy[(y * w + x - 1) * 4 + c] +
                copy[(y * w + x + 1) * 4 + c]) /
              4;
            d[idx + c] = Math.min(
              255,
              Math.max(0, center + (center - blur) * sharpenAmount),
            );
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imgSrc);
    img.src = imgSrc;
  });
}

export default function ThemeForge() {
  const [step, setStep] = useState(0);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [detectedApps, setDetectedApps] = useState([]);
  const [customApps, setCustomApps] = useState("");
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [selectedPreset, setSelectedPreset] = useState("minimal-bw");
  const [customPrompt, setCustomPrompt] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [higgsKeyId, setHiggsKeyId] = useState("");
  const [higgsKeySecret, setHiggsKeySecret] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [detecting, setDetecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedIcons, setGeneratedIcons] = useState({});
  const [processedIcons, setProcessedIcons] = useState({});
  const [generatedWallpapers, setGeneratedWallpapers] = useState([]);
  const [genProgress, setGenProgress] = useState({
    current: 0,
    total: 0,
    app: "",
    phase: "",
  });
  const [error, setError] = useState("");
  const [mode, setMode] = useState("work");
  const [workApps, setWorkApps] = useState(new Set());
  const [homeApps, setHomeApps] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const [detectionSource, setDetectionSource] = useState("manual");
  const [postProcessEnabled, setPostProcessEnabled] = useState(true);
  const [iconSize, setIconSize] = useState(512);
  const [retryQueue, setRetryQueue] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [detectionProvider, setDetectionProvider] = useState("gemini");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [dbRef, setDbRef] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    initDB()
      .then((db) => {
        setDbRef(db);
        getSessions(db).then(setSessions);
      })
      .catch(() => {});
  }, []);

  const fileToBase64 = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const handleUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setScreenshot(f);
    setScreenshotPreview(URL.createObjectURL(f));
    setError("");
  };

  const callGemini = async (contents, config = {}) => {
    const key = geminiKey;
    if (!key) {
      setError("Enter your Gemini API key");
      return null;
    }
    const model = config.model || "gemini-2.5-flash";
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: config.generationConfig || {},
          }),
        },
      );
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.error?.message || `API ${resp.status}`);
      }
      return await resp.json();
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const callHiggsfield = async (prompt, aspectRatio = "1:1") => {
    if (!higgsKeyId || !higgsKeySecret) {
      setError("Enter both Higgsfield API Key ID and Secret");
      return null;
    }
    const authHeader = `Key ${higgsKeyId}:${higgsKeySecret}`;
    try {
      // Submit to queue
      const submitResp = await fetch(
        "https://platform.higgsfield.ai/higgsfield-ai/soul/standard",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            prompt,
            aspect_ratio: aspectRatio,
            resolution: "720p",
          }),
        },
      );
      if (!submitResp.ok) {
        const errBody = await submitResp.json().catch(() => ({}));
        const detail =
          errBody?.detail ||
          errBody?.message ||
          errBody?.error ||
          JSON.stringify(errBody);
        throw new Error(`Higgsfield ${submitResp.status}: ${detail}`);
      }
      const submitData = await submitResp.json();
      const requestId = submitData.request_id;
      if (!requestId) throw new Error("No request_id in Higgsfield response");
      // Poll for completion
      let attempts = 0;
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusResp = await fetch(
          `https://platform.higgsfield.ai/requests/${requestId}/status`,
          {
            headers: { Accept: "application/json", Authorization: authHeader },
          },
        );
        const statusData = await statusResp.json();
        if (statusData.status === "completed") {
          // images is array of objects with url property
          const imgUrl = statusData.images?.[0]?.url || statusData.images?.[0];
          return imgUrl || null;
        }
        if (statusData.status === "failed" || statusData.status === "nsfw") {
          throw new Error(`Generation ${statusData.status}`);
        }
        attempts++;
      }
      throw new Error("Higgsfield timeout after 3 minutes");
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const callOpenAI = async (base64, mimeType) => {
    if (!openaiKey) {
      setError("Enter your OpenAI API key");
      return null;
    }
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this iPhone home screen screenshot. Identify every visible app icon. Return ONLY a JSON array of exact app names. Include system apps. Example: ["Instagram","WhatsApp","Safari"]. No other text.`,
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.error?.message || `OpenAI API ${resp.status}`);
      }
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const callAnthropic = async (base64, mimeType) => {
    if (!anthropicKey) {
      setError("Enter your Anthropic API key");
      return null;
    }
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this iPhone home screen screenshot. Identify every visible app icon. Return ONLY a JSON array of exact app names. Include system apps. Example: ["Instagram","WhatsApp","Safari"]. No other text.`,
                },
              ],
            },
          ],
        }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.error?.message || `Anthropic API ${resp.status}`);
      }
      const data = await resp.json();
      return data.content?.[0]?.text || null;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const parseDetectionResponse = (text) => {
    try {
      const cleaned = text.replace(/```json\n?|```/g, "").trim();
      const apps = JSON.parse(cleaned);
      if (Array.isArray(apps) && apps.length) return apps;
    } catch {}
    return null;
  };

  const detectApps = async () => {
    if (detectionSource === "manual") {
      const apps = customApps
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      if (!apps.length) {
        setError("Enter at least one app name");
        return;
      }
      finishDetection(apps);
      return;
    }
    if (!screenshot) {
      setError("Upload a screenshot first");
      return;
    }
    setDetecting(true);
    setError("");
    const b64 = await fileToBase64(screenshot);

    let apps = null;

    if (detectionProvider === "gemini") {
      const data = await callGemini(
        [
          {
            parts: [
              { inlineData: { mimeType: screenshot.type, data: b64 } },
              {
                text: `Analyze this iPhone home screen screenshot. Identify every visible app icon. Return ONLY a JSON array of exact app names. Include system apps. Example: ["Instagram","WhatsApp","Safari"]. No other text.`,
              },
            ],
          },
        ],
        { generationConfig: { temperature: 0.1 } },
      );
      if (data) {
        const t = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        apps = parseDetectionResponse(t);
      }
    } else if (detectionProvider === "openai") {
      const text = await callOpenAI(b64, screenshot.type);
      if (text) apps = parseDetectionResponse(text);
    } else if (detectionProvider === "anthropic") {
      const text = await callAnthropic(b64, screenshot.type);
      if (text) apps = parseDetectionResponse(text);
    }

    setDetecting(false);
    if (apps) finishDetection(apps);
    else if (!error) setError("Could not detect apps. Try manual entry.");
  };

  const finishDetection = (apps) => {
    setDetectedApps(apps);
    setSelectedApps(new Set(apps));
    const workKeywords = [
      "Mail",
      "Calendar",
      "Slack",
      "Notion",
      "LinkedIn",
      "Chrome",
      "Gmail",
      "Google Drive",
      "Files",
      "Notes",
      "Reminders",
      "Shortcuts",
      "Figma",
      "Zerodha",
      "Groww",
      "CRED",
      "Microsoft Teams",
      "Outlook",
      "Excel",
      "Word",
      "Zoom",
      "OneNote",
    ];
    const w = new Set(apps.filter((a) => workKeywords.includes(a)));
    const h = new Set(apps.filter((a) => !w.has(a)));
    setWorkApps(w);
    setHomeApps(h);
    goToStep(2);
    // Save session to IndexedDB
    if (dbRef) {
      saveSession(dbRef, {
        timestamp: Date.now(),
        screenshotBlob: screenshot,
        detectionProvider:
          detectionSource === "manual" ? "manual" : detectionProvider,
        detectedApps: apps,
        selectedApps: apps,
        uncheckedApps: [],
      })
        .then((id) => {
          setSessionId(id);
          getSessions(dbRef).then(setSessions);
        })
        .catch(() => {});
    }
  };

  const toggleApp = (app) => {
    const s = new Set(selectedApps);
    s.has(app) ? s.delete(app) : s.add(app);
    setSelectedApps(s);
    // Update session in IndexedDB
    if (dbRef && sessionId) {
      const newSelected = [...s] as string[];
      updateSession(
        dbRef,
        sessionId,
        newSelected,
        detectedApps as string[],
      ).catch(() => {});
    }
  };
  const toggleModeApp = (app, m) => {
    const setter = m === "work" ? setWorkApps : setHomeApps;
    const src = m === "work" ? workApps : homeApps;
    const s = new Set(src);
    s.has(app) ? s.delete(app) : s.add(app);
    setter(s);
  };

  const addManualApps = () => {
    if (!customApps.trim()) return;
    const newApps = customApps
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a && !detectedApps.includes(a));
    setDetectedApps([...detectedApps, ...newApps]);
    const s = new Set(selectedApps);
    newApps.forEach((a) => s.add(a));
    setSelectedApps(s);
    setCustomApps("");
  };

  const getThemePrompt = () => {
    if (selectedPreset === "custom") return customPrompt;
    return THEME_PRESETS.find((p) => p.id === selectedPreset)?.prompt || "";
  };

  const generateSingleIcon = async (app, themePrompt) => {
    const iconDesc = APP_ICONS[app] || `recognizable symbol for ${app}`;
    const prompt = `Generate a single iOS app icon for the "${app}" app. The icon MUST depict: ${iconDesc}. ${themePrompt}. Requirements: exactly square image, the symbol (${iconDesc}) must be perfectly centered with equal padding on all sides, the icon must be immediately recognizable as the ${app} app, absolutely no text or letters or labels anywhere on the icon, no watermarks. Output one square image.`;
    if (provider === "gemini") {
      const data = await callGemini([{ parts: [{ text: prompt }] }], {
        model: geminiModel,
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          temperature: 0.7,
        },
      });
      if (data?.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData)
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } else {
      const url = await callHiggsfield(prompt, "1:1");
      return url || null;
    }
  };

  const generateIcons = async () => {
    const apps = [...selectedApps];
    if (!apps.length) {
      setError("Select at least one app");
      return;
    }
    setGenerating(true);
    setError("");
    const totalSteps = apps.length + 2 + (postProcessEnabled ? 1 : 0);
    setGenProgress({
      current: 0,
      total: totalSteps,
      app: "Starting...",
      phase: "icons",
    });

    const rawIcons = {};
    const failed = [];

    // Generate icons
    const themePrompt = getThemePrompt();
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      setGenProgress({
        current: i + 1,
        total: totalSteps,
        app,
        phase: "icons",
      });
      const result = await generateSingleIcon(app, themePrompt);
      if (result) {
        rawIcons[app as string] = result;
        setGeneratedIcons({ ...rawIcons });
      } else {
        failed.push(app);
      }
      await new Promise((r) =>
        setTimeout(r, provider === "gemini" ? 1500 : 500),
      );
    }
    setRetryQueue(failed);

    // Post-process
    if (postProcessEnabled && Object.keys(rawIcons).length > 0) {
      setGenProgress({
        current: apps.length + 1,
        total: totalSteps,
        app: "Post-processing icons...",
        phase: "processing",
      });
      const processed = {};
      for (const [app, src] of Object.entries(rawIcons)) {
        try {
          processed[app] = await postProcessIcon(src, iconSize);
        } catch {
          processed[app] = src;
        }
      }
      setProcessedIcons(processed);
    } else {
      setProcessedIcons(rawIcons);
    }

    // Wallpapers
    setGenProgress({
      current: apps.length + (postProcessEnabled ? 2 : 1),
      total: totalSteps,
      app: "Generating wallpapers...",
      phase: "wallpapers",
    });
    const wps = [];
    const wpStyles = [
      `minimalist iPhone wallpaper, portrait orientation 9:19.5 ratio. ${themePrompt.replace(/icon|app icon|iOS/gi, "")}. Clean background suitable behind app icons, no text, no logos, subtle and elegant.`,
      `textured minimal iPhone wallpaper, portrait 9:19.5 ratio. ${themePrompt.replace(/icon|app icon|iOS/gi, "")}. Slight visual texture, complementary to minimal icons, no text, abstract.`,
    ];
    for (const wpPrompt of wpStyles) {
      if (provider === "gemini") {
        const wpData = await callGemini([{ parts: [{ text: wpPrompt }] }], {
          model: geminiModel,
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            temperature: 0.9,
          },
        });
        if (wpData?.candidates?.[0]?.content?.parts) {
          for (const p of wpData.candidates[0].content.parts) {
            if (p.inlineData) {
              wps.push(
                `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
              );
              break;
            }
          }
        }
      } else {
        const url = await callHiggsfield(wpPrompt, "9:16");
        if (url) wps.push(url);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setGeneratedWallpapers(wps);
    setGenProgress({
      current: totalSteps,
      total: totalSteps,
      app: "Done!",
      phase: "done",
    });
    setGenerating(false);
    goToStep(4);
  };

  const retryFailed = async () => {
    if (!retryQueue.length) return;
    setGenerating(true);
    const themePrompt = getThemePrompt();
    const raw = { ...generatedIcons };
    const proc = { ...processedIcons };
    const stillFailed = [];
    for (const app of retryQueue) {
      setGenProgress({
        current: 0,
        total: retryQueue.length,
        app,
        phase: "retry",
      });
      const result = await generateSingleIcon(app, themePrompt);
      if (result) {
        raw[app] = result;
        proc[app] = postProcessEnabled
          ? await postProcessIcon(result, iconSize)
          : result;
      } else {
        stillFailed.push(app);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    setGeneratedIcons(raw);
    setProcessedIcons(proc);
    setRetryQueue(stillFailed);
    setGenerating(false);
  };

  const buildSetupGuide = () => {
    const preset = THEME_PRESETS.find((p) => p.id === selectedPreset);
    return `# ThemeForge Setup Guide
## Theme: ${preset?.name || selectedPreset}
Generated: ${new Date().toLocaleString()}
Provider: ${provider === "gemini" ? (geminiModel === "gemini-2.5-flash" ? "Gemini 2.5 Flash Image (Nano Banana)" : "Gemini 3 Pro Image (Nano Banana Pro)") : "Higgsfield"}
Icon Size: ${iconSize}×${iconSize}px | Post-processed: ${postProcessEnabled ? "Yes (iOS corners + sharpen)" : "No"}

---

## Step 1: Transfer to iPhone
- AirDrop this zip to your iPhone, or save to iCloud Drive
- Open in Files app → unzip

## Step 2: Save Icons to Photos
- Open icons/ folder → select all → Share → Save to Photos

## Step 3: Create Themed Icons (per app)
For EACH app:
1. Open Shortcuts app → tap +
2. Add Action → search "Open App" → select it
3. Tap "App" → pick the target app (e.g., Instagram)
4. Tap name at top → "Add to Home Screen"
5. Tap the icon → "Choose Photo" → select matching icon from Photos
6. Name it (or leave blank for clean look) → tap "Add"

⚡ Pro tip: Do all icons in one session. Takes ~1 min per icon.

## Step 4: Set Up Focus Modes

### 💼 WORK MODE
Settings → Focus → Work (or create new)
→ Home Screen → Custom Pages → select your work page
Apps: ${[...workApps].join(", ") || "None assigned"}

### 🏠 HOME MODE
Settings → Focus → Personal
→ Home Screen → Custom Pages → select your personal page
Apps: ${[...homeApps].join(", ") || "None assigned"}

## Step 5: Auto-Switch Schedule
Settings → Focus → [Mode] → Add Schedule
- Work: Mon-Fri, 9:00 AM - 6:00 PM (or by location)
- Personal: Toggle "Smart Activation" for auto-detect
- Or: Shortcuts → Automation → Time of Day → Set Focus

## Step 6: Clean Up Original Icons
- Long press original app → Remove from Home Screen (NOT delete)
- They remain in App Library for access

## URL Schemes (for advanced Shortcut users)
${[...selectedApps].map((a) => `- ${a}: ${URL_SCHEMES[a] || "search App Store for URL scheme"}`).join("\n")}

---
Built with ThemeForge | github.com/MrHalder
`;
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const iconsDir = zip.folder("icons");
    const wpDir = zip.folder("wallpapers");
    const icons = postProcessEnabled ? processedIcons : generatedIcons;

    // Save icons
    for (const [app, dataUrl] of Object.entries(icons)) {
      const b64 = dataUrl.split(",")[1];
      if (b64)
        iconsDir.file(`${app.replace(/[\s\/\\'"]+/g, "_")}.png`, b64, {
          base64: true,
        });
    }
    // Save wallpapers
    for (let i = 0; i < generatedWallpapers.length; i++) {
      const wp = generatedWallpapers[i];
      if (wp.startsWith("data:")) {
        wpDir.file(`wallpaper_${i + 1}.png`, wp.split(",")[1], {
          base64: true,
        });
      } else {
        try {
          const resp = await fetch(wp);
          const blob = await resp.blob();
          wpDir.file(`wallpaper_${i + 1}.png`, blob);
        } catch {
          /* skip wallpaper if fetch fails */
        }
      }
    }
    // Manifest
    const manifest = {
      version: "2.0",
      generated: new Date().toISOString(),
      theme: selectedPreset,
      provider,
      iconSize,
      postProcessed: postProcessEnabled,
      modes: {
        work: [...workApps].map((a) => ({
          app: a,
          icon: `icons/${a.replace(/[\s\/\\'"]+/g, "_")}.png`,
          urlScheme: URL_SCHEMES[a] || null,
        })),
        home: [...homeApps].map((a) => ({
          app: a,
          icon: `icons/${a.replace(/[\s\/\\'"]+/g, "_")}.png`,
          urlScheme: URL_SCHEMES[a] || null,
        })),
      },
      allApps: [...selectedApps].map((a) => ({
        app: a,
        icon: `icons/${a.replace(/[\s\/\\'"]+/g, "_")}.png`,
        urlScheme: URL_SCHEMES[a] || null,
      })),
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("SETUP_GUIDE.md", buildSetupGuide());

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `themeforge_${selectedPreset}_${iconSize}px_${Date.now()}.zip`;
    link.click();
  };

  const downloadSingle = (app) => {
    const src = (postProcessEnabled ? processedIcons : generatedIcons)[app];
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = `${app.replace(/[\s\/\\'"]+/g, "_")}_${iconSize}px.png`;
    link.click();
  };

  const downloadWallpaper = async (url, index) => {
    const link = document.createElement("a");
    if (url.startsWith("data:")) {
      link.href = url;
    } else {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        link.href = URL.createObjectURL(blob);
      } catch {
        return;
      }
    }
    link.download = `wallpaper_${index + 1}.png`;
    link.click();
  };

  const copyManifest = () => {
    const m = {
      theme: selectedPreset,
      modes: {
        work: [...workApps].map((a) => ({
          app: a,
          urlScheme: URL_SCHEMES[a] || null,
        })),
        home: [...homeApps].map((a) => ({
          app: a,
          urlScheme: URL_SCHEMES[a] || null,
        })),
      },
    };
    navigator.clipboard.writeText(JSON.stringify(m, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic styles based on selected theme
  const s = THEME_VISUALS[selectedPreset] || THEME_VISUALS["minimal-bw"];
  const c = {
    wrap: {
      minHeight: "100vh",
      background: s.bg,
      color: s.textPrimary,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif",
      padding: "20px 16px",
      transition: "background .5s, color .5s",
    },
    mx: { maxWidth: 740, margin: "0 auto" },
    h1: {
      fontSize: 30,
      fontWeight: 800,
      margin: 0,
      letterSpacing: "-1px",
      background: `linear-gradient(135deg,${s.gradientStart} 0%,${s.gradientEnd} 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      transition: "all .5s",
    },
    sub: {
      color: s.textMuted,
      fontSize: 12,
      marginTop: 6,
      transition: "color .5s",
    },
    stepper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      margin: "24px 0",
    },
    dot: (a, d) => ({
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      border: `2px solid ${d ? s.dotDone : a ? s.dotActive : "#282828"}`,
      background: d ? `${s.dotDone}18` : a ? s.dotActive : "transparent",
      color: d
        ? s.dotDone
        : a
          ? s.accent === "#000000"
            ? "#fff"
            : "#000"
          : s.textMuted,
      cursor: d ? "pointer" : "default",
      transition: "all .3s",
    }),
    line: {
      width: 20,
      height: 2,
      background: s.cardBorder,
      transition: "background .5s",
    },
    card: {
      background: s.cardBg,
      border: `1px solid ${s.cardBorder}`,
      borderRadius: s.borderRadius,
      padding: "20px 20px",
      marginBottom: 14,
      transition: "background .5s, border-color .5s, border-radius .3s",
    },
    lbl: {
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: 1.5,
      color: s.textSecondary,
      marginBottom: 8,
      display: "block",
      transition: "color .5s",
    },
    inp: {
      width: "100%",
      padding: "11px 14px",
      background: s.inputBg,
      border: `1px solid ${s.inputBorder}`,
      borderRadius: 8,
      color: s.textPrimary,
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box" as const,
      transition: "background .5s, border-color .5s, color .5s",
    },
    btn: (p, dis?) => ({
      width: "100%",
      padding: "13px 0",
      borderRadius: 10,
      border: "none",
      fontWeight: 700,
      fontSize: 14,
      cursor: dis ? "not-allowed" : "pointer",
      opacity: dis ? 0.35 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: p ? s.accent : s.cardBg,
      color: p ? (s.accent === "#000000" ? "#fff" : "#000") : s.textSecondary,
      transition: "all .25s",
    }),
    tag: (sel) => ({
      padding: "7px 12px",
      borderRadius: 16,
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      border: `1px solid ${sel ? s.accent : s.inputBorder}`,
      background: sel ? s.tagSelectedBg : s.inputBg,
      color: sel ? s.tagSelectedColor : s.textMuted,
      transition: "all .2s",
      whiteSpace: "nowrap" as const,
    }),
    preset: (sel) => ({
      padding: "12px 14px",
      borderRadius: 10,
      border: `1.5px solid ${sel ? s.accent : s.cardBorder}`,
      background: sel ? s.accentGlow : s.cardBg,
      cursor: "pointer",
      transition: "all .3s",
    }),
    err: {
      background: "#1f0a0a",
      border: "1px solid #4a1515",
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: "#f87171",
    },
    prog: {
      width: "100%",
      height: 3,
      background: s.cardBorder,
      borderRadius: 2,
      overflow: "hidden",
      marginTop: 10,
    },
    progFill: (pct) => ({
      width: `${pct}%`,
      height: "100%",
      background: `linear-gradient(90deg,${s.gradientStart},${s.gradientEnd})`,
      borderRadius: 2,
      transition: "width .3s",
    }),
    mTab: (a) => ({
      flex: 1,
      padding: "9px 0",
      textAlign: "center" as const,
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      borderBottom: `2px solid ${a ? s.accent : "transparent"}`,
      color: a ? s.textPrimary : s.textMuted,
      transition: "all .3s",
    }),
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
      gap: 10,
    },
    iCard: {
      background: s.inputBg,
      borderRadius: s.borderRadius,
      padding: 6,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: 4,
      cursor: "pointer",
      border: `1px solid ${s.cardBorder}`,
      transition: "all .25s",
    },
    iImg: {
      width: 68,
      height: 68,
      borderRadius: 15,
      objectFit: "cover" as const,
      background: s.cardBorder,
    },
  };

  const hasGenKey =
    provider === "gemini" ? !!geminiKey : !!higgsKeyId && !!higgsKeySecret;
  const hasDetectionKey =
    detectionSource === "manual"
      ? true
      : detectionProvider === "gemini"
        ? !!geminiKey
        : detectionProvider === "openai"
          ? !!openaiKey
          : !!anthropicKey;
  const canProceed0 =
    hasGenKey &&
    hasDetectionKey &&
    (detectionSource === "screenshot" ? !!screenshot : !!customApps.trim());

  // SVG Components
  const ScanRobot = ({ scanning }: { scanning: boolean }) => (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      style={{
        animation: scanning ? "robotScan 2s ease-in-out infinite" : "none",
      }}
    >
      {/* Antenna */}
      <line
        x1="50"
        y1="18"
        x2="50"
        y2="6"
        stroke={s.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="50"
        cy="4"
        r="3"
        fill={s.dotDone}
        style={{
          animation: scanning ? "pulse 1s ease-in-out infinite" : "none",
        }}
      />
      {/* Head */}
      <rect
        x="25"
        y="18"
        width="50"
        height="36"
        rx="10"
        fill="none"
        stroke={s.accent}
        strokeWidth="2.5"
      />
      {/* Eyes */}
      <circle
        cx="38"
        cy="34"
        r="5"
        fill={scanning ? s.dotDone : s.textMuted}
        style={{
          animation: scanning ? "pulse 1.5s ease-in-out infinite" : "none",
          transition: "fill .3s",
        }}
      />
      <circle
        cx="62"
        cy="34"
        r="5"
        fill={scanning ? s.dotDone : s.textMuted}
        style={{
          animation: scanning ? "pulse 1.5s ease-in-out infinite .2s" : "none",
          transition: "fill .3s",
        }}
      />
      {/* Mouth / display */}
      <rect
        x="35"
        y="44"
        width="30"
        height="4"
        rx="2"
        fill={s.accent}
        opacity={scanning ? 0.8 : 0.3}
        style={{ transition: "opacity .3s" }}
      />
      {/* Body */}
      <rect
        x="30"
        y="58"
        width="40"
        height="24"
        rx="6"
        fill="none"
        stroke={s.accent}
        strokeWidth="2"
      />
      {/* Chest panel */}
      <rect
        x="40"
        y="63"
        width="20"
        height="8"
        rx="2"
        fill={scanning ? s.accentGlow : "transparent"}
        stroke={s.accent}
        strokeWidth="1"
        opacity={0.6}
      />
      {/* Arms */}
      <line
        x1="30"
        y1="65"
        x2="18"
        y2="72"
        stroke={s.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="70"
        y1="65"
        x2="82"
        y2="72"
        stroke={s.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Magnifying glass on right arm */}
      <circle
        cx="86"
        cy="76"
        r="6"
        fill="none"
        stroke={s.dotDone}
        strokeWidth="2"
        style={{
          animation: scanning ? "pulse 1.5s ease-in-out infinite .4s" : "none",
        }}
      />
      <line
        x1="82"
        y1="80"
        x2="78"
        y2="84"
        stroke={s.dotDone}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Legs */}
      <line
        x1="40"
        y1="82"
        x2="38"
        y2="96"
        stroke={s.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="82"
        x2="62"
        y2="96"
        stroke={s.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const ForgeScene = () => (
    <svg
      width="140"
      height="90"
      viewBox="0 0 140 90"
      style={{ animation: "forgeGlow 2s ease-in-out infinite" }}
    >
      {/* Anvil base */}
      <path
        d="M35 75 L45 60 L95 60 L105 75 Z"
        fill={s.textSecondary}
        opacity={0.7}
      />
      <rect
        x="42"
        y="50"
        width="56"
        height="12"
        rx="3"
        fill={s.accent}
        opacity={0.8}
      />
      {/* Hammer */}
      <g
        style={{
          transformOrigin: "70px 15px",
          animation: "hammerStrike 1s ease-in-out infinite",
        }}
      >
        <rect x="67" y="15" width="6" height="30" rx="2" fill={s.textMuted} />
        <rect x="60" y="8" width="20" height="10" rx="3" fill={s.accent} />
      </g>
      {/* Sparks */}
      <circle
        cx="55"
        cy="48"
        r="2"
        fill={s.dotDone}
        style={{ animation: "pulse .5s ease-in-out infinite" }}
      />
      <circle
        cx="85"
        cy="45"
        r="1.5"
        fill={s.dotDone}
        style={{ animation: "pulse .5s ease-in-out infinite .15s" }}
      />
      <circle
        cx="65"
        cy="42"
        r="1"
        fill={s.dotDone}
        style={{ animation: "pulse .5s ease-in-out infinite .3s" }}
      />
      <circle
        cx="78"
        cy="40"
        r="1.5"
        fill={s.dotDone}
        style={{ animation: "pulse .4s ease-in-out infinite .1s" }}
      />
      {/* Glow on anvil surface */}
      <ellipse
        cx="70"
        cy="52"
        rx="20"
        ry="4"
        fill={s.accent}
        opacity={0.15}
        style={{ animation: "pulse 2s ease-in-out infinite" }}
      />
    </svg>
  );

  const goToStep = (target) => {
    if (target === step || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep(target);
      setTransitioning(false);
    }, 200);
  };

  const stepTransition = {
    opacity: transitioning ? 0 : 1,
    transform: transitioning ? "translateY(8px)" : "translateY(0)",
    transition: "opacity .2s ease, transform .2s ease",
  };

  return (
    <div style={c.wrap}>
      <div style={c.mx}>
        <div style={{ textAlign: "center" }}>
          <h1 style={c.h1}>ThemeForge</h1>
          <p style={c.sub}>
            AI-Powered iOS Icon & Wallpaper Generator · Dual Provider ·
            Post-Processed
          </p>
        </div>

        <div style={c.stepper}>
          {STEPS.map((n, i) => (
            <div
              key={n}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <div
                style={c.dot(i === step, i < step)}
                onClick={() => i < step && goToStep(i)}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              {i < 4 && <div style={c.line} />}
            </div>
          ))}
        </div>

        {error && (
          <div style={c.err}>
            <AlertTriangle size={14} />
            <span style={{ flex: 1 }}>{error}</span>
            <X
              size={12}
              style={{ cursor: "pointer" }}
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* STEP 0: SETUP */}
        {step === 0 && (
          <div style={{ ...stepTransition, position: "relative" as const }}>
            {/* Grid overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.03,
                pointerEvents: "none",
                backgroundImage: `linear-gradient(${s.dotDone} 1px, transparent 1px), linear-gradient(90deg, ${s.dotDone} 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
                animation: "gridFlicker 4s ease-in-out infinite",
                borderRadius: s.borderRadius,
              }}
            />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 3,
                color: s.dotDone,
                marginBottom: 12,
                animation: "fadeInDown .4s ease",
                textTransform: "uppercase" as const,
              }}
            >
              // Mission Briefing
            </div>
            <div
              style={{
                ...c.card,
                borderLeft: `3px solid ${s.dotDone}40`,
                animation: "fadeInUp .4s ease",
                animationFillMode: "both" as const,
              }}
            >
              <label style={c.lbl}>Provider</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button
                  onClick={() => setProvider("gemini")}
                  style={c.tag(provider === "gemini")}
                >
                  🔮 Gemini
                </button>
                <button
                  onClick={() => setProvider("higgsfield")}
                  style={c.tag(provider === "higgsfield")}
                >
                  ⚡ Higgsfield (Queue)
                </button>
              </div>
              {provider === "gemini" && (
                <>
                  <label style={c.lbl}>Gemini Model</label>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    <button
                      onClick={() => setGeminiModel("gemini-2.5-flash")}
                      style={c.tag(geminiModel === "gemini-2.5-flash")}
                    >
                      Gemini 2.5 Flash Image
                    </button>
                    <button
                      onClick={() => setGeminiModel("gemini-3-pro-image")}
                      style={c.tag(geminiModel === "gemini-3-pro-image")}
                    >
                      Gemini 3 Pro Image
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#333",
                      marginTop: -10,
                      marginBottom: 12,
                    }}
                  >
                    {geminiModel === "gemini-2.5-flash"
                      ? '"Nano Banana" · Up to 32.8K input / 8.2K output tokens · Free tier available'
                      : '"Nano Banana Pro" · Higher quality generation · Free tier available'}
                  </p>
                </>
              )}
              {provider === "gemini" ? (
                <>
                  <label style={c.lbl}>Gemini API Key</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      style={{ ...c.inp, flex: 1 }}
                    />
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      style={{
                        ...c.btn(false),
                        width: 40,
                        padding: 0,
                        borderRadius: 8,
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: "#333", marginTop: 6 }}>
                    {`Uses gemini-2.5-flash for detection + ${geminiModel === "gemini-2.5-flash" ? "Gemini 2.5 Flash Image (Nano Banana)" : "Gemini 3 Pro Image (Nano Banana Pro)"} for icons. Direct Google API.`}
                  </p>
                </>
              ) : (
                <>
                  <label style={c.lbl}>Higgsfield API Key ID</label>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={higgsKeyId}
                      onChange={(e) => setHiggsKeyId(e.target.value)}
                      placeholder="Your API Key ID"
                      style={{ ...c.inp, flex: 1 }}
                    />
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      style={{
                        ...c.btn(false),
                        width: 40,
                        padding: 0,
                        borderRadius: 8,
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                  <label style={c.lbl}>Higgsfield API Key Secret</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={higgsKeySecret}
                      onChange={(e) => setHiggsKeySecret(e.target.value)}
                      placeholder="Your API Key Secret"
                      style={{ ...c.inp, flex: 1 }}
                    />
                  </div>
                  <p style={{ fontSize: 10, color: "#333", marginTop: 6 }}>
                    Queue-based async generation via platform.higgsfield.ai.
                    Model: higgsfield-ai/soul/standard.
                  </p>
                  {detectionSource === "screenshot" && !hasDetectionKey && (
                    <p style={{ fontSize: 10, color: "#f59e0b", marginTop: 4 }}>
                      ⚠ Screenshot detection requires a{" "}
                      {detectionProvider === "gemini"
                        ? "Gemini"
                        : detectionProvider === "openai"
                          ? "OpenAI"
                          : "Anthropic"}{" "}
                      key below, or use manual entry.
                    </p>
                  )}
                </>
              )}

              {/* Detection-specific API keys (shown when detection provider differs from generation provider) */}
              {detectionSource === "screenshot" &&
                detectionProvider === "openai" && (
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #161616",
                      paddingTop: 12,
                    }}
                  >
                    <label style={c.lbl}>
                      OpenAI API Key{" "}
                      <span style={{ fontWeight: 400, color: "#444" }}>
                        (for detection)
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        style={{ ...c.inp, flex: 1 } as any}
                      />
                    </div>
                    <p style={{ fontSize: 10, color: "#333", marginTop: 6 }}>
                      GPT-4o Vision for screenshot app detection only.
                    </p>
                  </div>
                )}
              {detectionSource === "screenshot" &&
                detectionProvider === "anthropic" && (
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #161616",
                      paddingTop: 12,
                    }}
                  >
                    <label style={c.lbl}>
                      Anthropic API Key{" "}
                      <span style={{ fontWeight: 400, color: "#444" }}>
                        (for detection)
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-..."
                        style={{ ...c.inp, flex: 1 } as any}
                      />
                    </div>
                    <p style={{ fontSize: 10, color: "#333", marginTop: 6 }}>
                      Claude Sonnet 4.5 Vision for screenshot app detection
                      only.
                    </p>
                  </div>
                )}
            </div>

            <div
              style={{
                ...c.card,
                borderLeft: `3px solid ${s.dotDone}40`,
                animation: "fadeInUp .4s ease .1s",
                animationFillMode: "both" as const,
              }}
            >
              <label style={c.lbl}>Icon Settings</label>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 12, color: "#666" }}>Size:</span>
                {[180, 512, 1024].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setIconSize(sz)}
                    style={c.tag(iconSize === sz)}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setPostProcessEnabled(!postProcessEnabled)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: postProcessEnabled ? "#4ade80" : "#222",
                    position: "relative",
                    transition: "background .2s",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: "#fff",
                      position: "absolute",
                      top: 3,
                      left: postProcessEnabled ? 23 : 3,
                      transition: "left .2s",
                    }}
                  />
                </button>
                <span style={{ fontSize: 12, color: "#888" }}>
                  Post-Processing (iOS corners + sharpen + square crop)
                </span>
              </div>
            </div>

            <div
              style={{
                ...c.card,
                borderLeft: `3px solid ${s.dotDone}40`,
                animation: "fadeInUp .4s ease .2s",
                animationFillMode: "both" as const,
              }}
            >
              <label style={c.lbl}>App Detection Method</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <button
                  onClick={() => setDetectionSource("manual")}
                  style={c.tag(detectionSource === "manual")}
                >
                  ✏️ Manual Entry
                </button>
                <button
                  onClick={() => setDetectionSource("screenshot")}
                  style={c.tag(detectionSource === "screenshot")}
                >
                  📸 Screenshot
                </button>
              </div>
              {detectionSource === "screenshot" ? (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: "2px dashed #1e1e1e",
                      borderRadius: 10,
                      padding: screenshotPreview ? 0 : 40,
                      textAlign: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      background: "#070707",
                    }}
                  >
                    {screenshotPreview ? (
                      <img
                        src={screenshotPreview}
                        alt=""
                        style={{
                          width: "100%",
                          maxHeight: 360,
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <>
                        <Upload size={28} color="#282828" />
                        <p
                          style={{ color: "#333", fontSize: 13, marginTop: 10 }}
                        >
                          Upload home screen screenshot
                        </p>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      style={{ display: "none" }}
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <span
                      style={{ fontSize: 11, color: "#555", marginRight: 8 }}
                    >
                      Detection AI:
                    </span>
                    {(["gemini", "openai", "anthropic"] as const).map((dp) => (
                      <button
                        key={dp}
                        onClick={() => setDetectionProvider(dp)}
                        style={{
                          ...c.tag(detectionProvider === dp),
                          marginRight: 4,
                        }}
                      >
                        {dp === "gemini"
                          ? "Gemini"
                          : dp === "openai"
                            ? "OpenAI"
                            : "Anthropic"}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <textarea
                    value={customApps}
                    onChange={(e) => setCustomApps(e.target.value)}
                    placeholder="Instagram, WhatsApp, Safari, Phone, Messages..."
                    rows={3}
                    style={{ ...c.inp, resize: "vertical" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 3,
                      marginTop: 8,
                    }}
                  >
                    {QUICK_APPS.map((app) => (
                      <button
                        key={app}
                        onClick={() => {
                          const cur = customApps
                            .split(",")
                            .map((a) => a.trim())
                            .filter(Boolean);
                          if (!cur.includes(app))
                            setCustomApps(
                              cur.length ? `${customApps}, ${app}` : app,
                            );
                        }}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 10,
                          border: "1px solid #141414",
                          background: "#080808",
                          color: "#444",
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {sessions.length > 0 && (
              <div
                style={{
                  ...c.card,
                  borderLeft: `3px solid ${s.dotDone}40`,
                  animation: "fadeInUp .4s ease .3s",
                  animationFillMode: "both" as const,
                }}
              >
                <div
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <label
                    style={{ ...c.lbl, marginBottom: 0, cursor: "pointer" }}
                  >
                    <Clock size={12} style={{ marginRight: 6 }} />
                    Detection History ({sessions.length})
                  </label>
                  <ChevronRight
                    size={14}
                    color="#444"
                    style={{
                      transform: showHistory ? "rotate(90deg)" : "none",
                      transition: "transform .2s",
                    }}
                  />
                </div>
                {showHistory && (
                  <>
                    <div style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
                      {sessions.slice(0, 10).map((s, i) => {
                        const ago = Date.now() - s.timestamp;
                        const mins = Math.floor(ago / 60000);
                        const timeStr =
                          mins < 1
                            ? "just now"
                            : mins < 60
                              ? `${mins}m ago`
                              : mins < 1440
                                ? `${Math.floor(mins / 60)}h ago`
                                : `${Math.floor(mins / 1440)}d ago`;
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "6px 0",
                              borderBottom: "1px solid #111",
                            }}
                          >
                            <span style={{ color: "#666" }}>{timeStr}</span>
                            <span
                              style={{
                                color: "#444",
                                textTransform: "capitalize",
                              }}
                            >
                              {s.detectionProvider}
                            </span>
                            <span style={{ color: "#4ade80" }}>
                              {s.detectedApps?.length || 0} detected
                            </span>
                            <span style={{ color: "#888" }}>
                              {s.selectedApps?.length || 0} kept
                            </span>
                            <span
                              style={{
                                color: s.uncheckedApps?.length
                                  ? "#f59e0b"
                                  : "#333",
                              }}
                            >
                              {s.uncheckedApps?.length || 0} unchecked
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: "#333",
                        textAlign: "center",
                      }}
                    >
                      {sessions.length} sessions ·{" "}
                      {sessions.reduce(
                        (s, r) => s + (r.detectedApps?.length || 0),
                        0,
                      )}{" "}
                      total detected ·{" "}
                      {sessions.reduce(
                        (s, r) => s + (r.uncheckedApps?.length || 0),
                        0,
                      )}{" "}
                      total unchecked
                    </div>
                  </>
                )}
              </div>
            )}

            {detectionSource === "manual" ? (
              <button
                onClick={() => detectApps()}
                disabled={!canProceed0}
                style={c.btn(true, !canProceed0)}
              >
                Next: Select Theme <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => {
                  goToStep(1);
                  setTimeout(() => detectApps(), 100);
                }}
                disabled={!canProceed0}
                style={c.btn(true, !canProceed0)}
              >
                Next: Detect Apps <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* STEP 1: DETECT */}
        {step === 1 && (
          <div style={stepTransition}>
            <div style={c.card}>
              <label style={c.lbl}>
                {detectionSource === "screenshot" ? "AI Detection" : "App List"}
              </label>
              {detecting && (
                <div style={{ textAlign: "center", padding: 20 }}>
                  {/* Screenshot scan overlay */}
                  {screenshotPreview && (
                    <div
                      style={{
                        position: "relative",
                        marginBottom: 16,
                        overflow: "hidden",
                        borderRadius: s.borderRadius,
                      }}
                    >
                      <img
                        src={screenshotPreview}
                        alt=""
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          objectFit: "contain",
                          opacity: 0.5,
                          filter: "grayscale(0.3)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg, transparent, ${s.dotDone}, transparent)`,
                          animation: "scanLine 1.5s linear infinite",
                          top: 0,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(180deg, transparent, ${s.dotDone}10)`,
                        }}
                      />
                    </div>
                  )}
                  <ScanRobot scanning={true} />
                  <p
                    style={{
                      color: s.accent,
                      fontSize: 13,
                      marginTop: 12,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  >
                    Scanning interface...
                  </p>
                  <p
                    style={{
                      color: s.textMuted,
                      fontSize: 11,
                      marginTop: 4,
                      animation: "fadeIn 1s ease .5s both",
                    }}
                  >
                    Identifying app signatures
                  </p>
                  <p
                    style={{
                      color: s.textMuted,
                      fontSize: 11,
                      marginTop: 2,
                      animation: "fadeIn 1s ease 1.2s both",
                    }}
                  >
                    Matching icon patterns
                  </p>
                </div>
              )}
              {detectedApps.length > 0 && (
                <>
                  <p
                    style={{ fontSize: 12, color: s.dotDone, marginBottom: 10 }}
                  >
                    ✓ {detectedApps.length} apps ready
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {detectedApps.map((app) => (
                      <button
                        key={app}
                        onClick={() => toggleApp(app)}
                        style={c.tag(selectedApps.has(app))}
                      >
                        {selectedApps.has(app) ? "✓ " : ""}
                        {app}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <label style={c.lbl}>Add more</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={customApps}
                        onChange={(e) => setCustomApps(e.target.value)}
                        placeholder="App1, App2, ..."
                        style={{ ...c.inp, flex: 1 }}
                      />
                      <button
                        onClick={addManualApps}
                        style={{
                          ...c.btn(false),
                          width: "auto",
                          padding: "0 14px",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => goToStep(0)}
                style={{ ...c.btn(false), flex: 1 }}
              >
                <ChevronLeft size={14} /> Back
              </button>
              {detectedApps.length === 0 ? (
                <button
                  onClick={detectApps}
                  disabled={detecting}
                  style={{ ...c.btn(true, detecting), flex: 2 }}
                >
                  {detecting ? (
                    <>
                      <Loader2
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />{" "}
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} /> Detect Apps
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => goToStep(2)}
                  disabled={!selectedApps.size}
                  style={{ ...c.btn(true, !selectedApps.size), flex: 2 }}
                >
                  Next: Theme <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: THEME */}
        {step === 2 && (
          <div style={stepTransition}>
            <div style={c.card}>
              <label style={c.lbl}>Theme</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {THEME_PRESETS.map((p) => {
                  const tv = THEME_VISUALS[p.id];
                  const isSel = selectedPreset === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id)}
                      style={{
                        ...c.preset(isSel),
                        position: "relative" as const,
                        overflow: "hidden",
                      }}
                    >
                      {isSel && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: s.accent,
                            transition: "all .3s",
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: isSel ? s.textPrimary : s.textSecondary,
                          transition: "color .3s",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: s.textMuted,
                          marginTop: 3,
                        }}
                      >
                        {p.desc}
                      </div>
                      {tv && (
                        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                          {[tv.bg, tv.cardBg, tv.accent, tv.dotDone].map(
                            (color, i) => (
                              <div
                                key={i}
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 4,
                                  background: color,
                                  border: `1px solid ${tv.cardBorder}`,
                                }}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedPreset === "custom" && (
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe your icon style..."
                  rows={3}
                  style={{ ...c.inp, marginTop: 10, resize: "vertical" }}
                />
              )}
            </div>

            <div
              style={{
                ...c.card,
                border: `1px solid ${s.accent}30`,
                background: s.accentGlow,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    ...c.lbl,
                    marginBottom: 0,
                    color: s.textSecondary,
                    fontSize: 11,
                  }}
                >
                  Apps to Generate
                </label>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      selectedApps.size === detectedApps.length
                        ? s.dotDone
                        : "#f59e0b",
                  }}
                >
                  {selectedApps.size} / {detectedApps.length}
                </span>
              </div>
              <p style={{ fontSize: 11, color: s.textMuted, marginBottom: 10 }}>
                Tap an app to exclude it from icon generation
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {detectedApps.map((app) => {
                  const sel = selectedApps.has(app);
                  return (
                    <button
                      key={app}
                      onClick={() => toggleApp(app)}
                      style={{
                        ...c.tag(sel),
                        background: sel ? s.tagSelectedBg : "transparent",
                        color: sel ? s.tagSelectedColor : s.textMuted,
                        border: sel
                          ? `1px solid ${s.accent}`
                          : `1px solid ${s.inputBorder}`,
                        textDecoration: sel ? "none" : "line-through",
                        opacity: sel ? 1 : 0.5,
                      }}
                    >
                      {sel ? "✓ " : "✕ "}
                      {app}
                    </button>
                  );
                })}
              </div>
              {selectedApps.size < detectedApps.length && (
                <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 8 }}>
                  {detectedApps.length - selectedApps.size} app
                  {detectedApps.length - selectedApps.size > 1 ? "s" : ""}{" "}
                  excluded from generation
                </p>
              )}
            </div>

            <div style={c.card}>
              <label style={c.lbl}>
                Focus Mode Assignment{" "}
                <span
                  style={{
                    fontWeight: 400,
                    color: "#333",
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  — organizes apps for setup guide only, does not affect
                  generation
                </span>
              </label>
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #161616",
                  marginBottom: 12,
                }}
              >
                <div
                  onClick={() => setMode("work")}
                  style={c.mTab(mode === "work")}
                >
                  💼 Work (
                  {[...workApps].filter((a) => selectedApps.has(a)).length})
                </div>
                <div
                  onClick={() => setMode("home")}
                  style={c.mTab(mode === "home")}
                >
                  🏠 Home (
                  {[...homeApps].filter((a) => selectedApps.has(a)).length})
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#444", marginBottom: 10 }}>
                Assign selected apps to {mode} mode
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {[...selectedApps].map((app) => {
                  const inMode =
                    mode === "work" ? workApps.has(app) : homeApps.has(app);
                  return (
                    <button
                      key={app}
                      onClick={() => toggleModeApp(app, mode)}
                      style={c.tag(inMode)}
                    >
                      {inMode ? "✓ " : ""}
                      {app}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => goToStep(detectionSource === "manual" ? 0 : 1)}
                style={{ ...c.btn(false, false), flex: 1 }}
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                onClick={() => {
                  goToStep(3);
                  generateIcons();
                }}
                disabled={!selectedApps.size}
                style={{ ...c.btn(true, !selectedApps.size), flex: 2 }}
              >
                <Zap size={14} /> Generate {selectedApps.size} icons +
                wallpapers
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GENERATING */}
        {step === 3 && (
          <div style={stepTransition}>
            <div style={c.card}>
              <div style={{ textAlign: "center", padding: 20 }}>
                <ForgeScene />
                <h3
                  style={{
                    color: s.textPrimary,
                    marginTop: 14,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {genProgress.phase === "icons"
                    ? "Forging Icons"
                    : genProgress.phase === "processing"
                      ? "Refining"
                      : genProgress.phase === "wallpapers"
                        ? "Painting Wallpapers"
                        : "Complete"}
                </h3>
                <p
                  style={{ color: s.textSecondary, fontSize: 13, marginTop: 4 }}
                >
                  {genProgress.app}
                </p>
                <p style={{ color: s.textMuted, fontSize: 12 }}>
                  {genProgress.current} / {genProgress.total}
                </p>
                <div style={c.prog}>
                  <div
                    style={c.progFill(
                      genProgress.total
                        ? (genProgress.current / genProgress.total) * 100
                        : 0,
                    )}
                  />
                </div>
                {/* Real-time icon reveal grid */}
                {Object.keys(generatedIcons).length > 0 && (
                  <div style={{ ...c.grid, marginTop: 16 }}>
                    {Object.entries(generatedIcons).map(([app, url], idx) => (
                      <div
                        key={app}
                        style={{
                          ...c.iCard,
                          animation: `iconForged .4s ease ${idx * 0.05}s both`,
                        }}
                      >
                        <img src={url as string} alt={app} style={c.iImg} />
                        <span
                          style={{
                            fontSize: 8,
                            color: s.textMuted,
                            textAlign: "center" as const,
                            maxWidth: 80,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {app}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ color: s.textMuted, fontSize: 10, marginTop: 14 }}>
                  {provider === "gemini"
                    ? `~3-5s per icon via ${geminiModel === "gemini-2.5-flash" ? "Gemini 2.5 Flash" : "Gemini 3 Pro"}`
                    : "Queue-based, may take 10-30s per icon"}
                  {postProcessEnabled
                    ? " · Post-processing: iOS corners + sharpen"
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOWNLOAD */}
        {step === 4 && (
          <div style={stepTransition}>
            {/* Celebration header */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 16,
                animation: "celebrate 1s ease",
              }}
            >
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: s.textPrimary,
                  margin: 0,
                  animation: "fadeInDown .5s ease",
                }}
              >
                Your Icons Are Ready
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: s.textSecondary,
                  marginTop: 4,
                  animation: "fadeIn .5s ease .2s both",
                }}
              >
                {Object.keys(processedIcons).length} icons forged in{" "}
                {selectedPreset.replace(/-/g, " ")} style
              </p>
            </div>

            <div style={c.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <label style={{ ...c.lbl, marginBottom: 0 }}>
                  Icons ({Object.keys(processedIcons).length})
                  {postProcessEnabled ? " · Post-processed" : ""}
                </label>
                {retryQueue.length > 0 && (
                  <button
                    onClick={retryFailed}
                    disabled={generating}
                    style={{
                      ...c.btn(false),
                      width: "auto",
                      padding: "6px 12px",
                      fontSize: 11,
                    }}
                  >
                    <RotateCcw size={12} /> Retry {retryQueue.length} failed
                  </button>
                )}
              </div>
              <div style={c.grid}>
                {Object.entries(processedIcons).map(([app, url], idx) => (
                  <div
                    key={app}
                    style={{
                      ...c.iCard,
                      animation: `staggerFadeIn .4s ease ${idx * 0.04}s both`,
                    }}
                    onClick={() => downloadSingle(app)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = s.accent;
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = s.cardBorder;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <img src={url} alt={app} style={c.iImg} />
                    <span
                      style={{
                        fontSize: 9,
                        color: s.textSecondary,
                        textAlign: "center" as const,
                        lineHeight: 1.1,
                        maxWidth: 80,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {app}
                    </span>
                  </div>
                ))}
              </div>
              {retryQueue.length > 0 && (
                <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 10 }}>
                  ⚠ {retryQueue.length} failed: {retryQueue.join(", ")}
                </p>
              )}
            </div>

            {generatedWallpapers.length > 0 && (
              <div style={c.card}>
                <label style={c.lbl}>Wallpapers</label>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                >
                  {generatedWallpapers.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`WP ${i + 1}`}
                      onClick={() => downloadWallpaper(url, i)}
                      style={{
                        height: 200,
                        borderRadius: s.borderRadius,
                        border: `1px solid ${s.cardBorder}`,
                        objectFit: "cover",
                        cursor: "pointer",
                        animation: `fadeInUp .4s ease ${i * 0.15}s both`,
                        transition: "transform .2s, border-color .2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.borderColor = s.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.borderColor = s.cardBorder;
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={c.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label style={{ ...c.lbl, marginBottom: 0 }}>Modes</label>
                <button
                  onClick={copyManifest}
                  style={{
                    ...c.btn(false),
                    width: "auto",
                    padding: "5px 10px",
                    fontSize: 10,
                    borderRadius: 6,
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={10} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={10} /> JSON
                    </>
                  )}
                </button>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      color: s.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    💼 Work ({workApps.size})
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: s.textMuted,
                      lineHeight: 1.6,
                    }}
                  >
                    {[...workApps].join(", ") || "—"}
                  </p>
                </div>
                <div style={{ width: 1, background: s.cardBorder }} />
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      color: s.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    🏠 Home ({homeApps.size})
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: s.textMuted,
                      lineHeight: 1.6,
                    }}
                  >
                    {[...homeApps].join(", ") || "—"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{ ...c.btn(false), marginBottom: 8 }}
            >
              📖 {showGuide ? "Hide" : "Show"} Setup Guide
            </button>
            {showGuide && (
              <div
                style={{
                  ...c.card,
                  whiteSpace: "pre-wrap",
                  fontSize: 11,
                  color: s.textSecondary,
                  lineHeight: 1.7,
                  fontFamily: "monospace",
                  maxHeight: 400,
                  overflowY: "auto",
                }}
              >
                {buildSetupGuide()}
              </div>
            )}

            {/* Shimmer download button */}
            <div
              style={{
                position: "relative" as const,
                overflow: "hidden",
                borderRadius: 10,
              }}
            >
              <button onClick={downloadAll} style={c.btn(true)}>
                <Download size={16} /> Download Everything (.zip)
              </button>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `linear-gradient(90deg, transparent 0%, ${s.accent}20 50%, transparent 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s linear infinite",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 10,
                color: "#333",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Contains: icons/ ({Object.keys(processedIcons).length} PNGs at{" "}
              {iconSize}px) · wallpapers/ · manifest.json · SETUP_GUIDE.md
            </p>

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                onClick={() => goToStep(2)}
                style={{ ...c.btn(false), flex: 1 }}
              >
                <RefreshCw size={12} /> Regenerate
              </button>
              <button
                onClick={() => {
                  goToStep(0);
                  setGeneratedIcons({});
                  setProcessedIcons({});
                  setGeneratedWallpapers([]);
                  setDetectedApps([]);
                  setSelectedApps(new Set());
                  setRetryQueue([]);
                }}
                style={{ ...c.btn(false), flex: 1 }}
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeInDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
          @keyframes scanLine{0%{top:0}50%{top:calc(100% - 2px)}100%{top:0}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
          @keyframes forgeGlow{0%,100%{filter:brightness(1) drop-shadow(0 0 4px rgba(255,255,255,0.2))}50%{filter:brightness(1.3) drop-shadow(0 0 12px rgba(255,255,255,0.5))}}
          @keyframes staggerFadeIn{from{opacity:0;transform:scale(.9) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
          @keyframes robotScan{0%,100%{transform:translateY(0)}25%{transform:translateY(-3px) rotate(-2deg)}75%{transform:translateY(3px) rotate(2deg)}}
          @keyframes celebrate{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
          @keyframes gridFlicker{0%,100%{opacity:.03}50%{opacity:.08}}
          @keyframes hammerStrike{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-30deg)}}
          @keyframes iconForged{0%{opacity:0;transform:scale(.5);filter:brightness(2)}60%{opacity:1;transform:scale(1.1);filter:brightness(1.5)}100%{opacity:1;transform:scale(1);filter:brightness(1)}}
        `}</style>
        <p
          style={{
            textAlign: "center",
            color: s.textMuted,
            fontSize: 10,
            marginTop: 28,
            opacity: 0.5,
          }}
        >
          ThemeForge v2 · Gemini / OpenAI / Anthropic Detection · Gemini +
          Higgsfield Generation · iOS Post-Processing
        </p>
      </div>
    </div>
  );
}
