import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

const dir = dirname(fileURLToPath(import.meta.url));
const postPath = join(dir, "POST.json");
const imagePath = join(dir, "meme.webp");

if (!existsSync(postPath)) {
  fail("POST.json not found");
}

let post: unknown;
try {
  post = JSON.parse(readFileSync(postPath, "utf8"));
} catch {
  fail("POST.json is not valid JSON");
}

const url = (post as { url?: unknown }).url;
if (typeof url !== "string") {
  fail("POST.json url is not a string");
}

const match = /^https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)$/.exec(url);
if (match === null) {
  fail("post url does not match https://x.com/<handle>/status/<digits>");
}
const handle = match[1];
const statusId = match[2];

if (!existsSync(imagePath)) {
  fail("meme.webp not found");
}
const imageStat = statSync(imagePath);
if (imageStat.size === 0) {
  fail("meme.webp is empty");
}
const imageBytes = readFileSync(imagePath);
if (imageBytes.length < 12) {
  fail("meme.webp is too small to be a WebP image");
}
const riff = imageBytes.subarray(0, 4).toString("ascii");
const webp = imageBytes.subarray(8, 12).toString("ascii");
if (riff !== "RIFF" || webp !== "WEBP") {
  fail("meme.webp does not start with valid RIFF/WEBP magic bytes");
}

const report = {
  ok: true,
  post_url: url,
  handle: handle,
  status_id: statusId,
  image_bytes: imageStat.size,
  readme_has_makefun: false,
};

const readmePath = join(dir, "README.md");
if (!existsSync(readmePath)) {
  fail("README.md not found");
}
const readmeText = readFileSync(readmePath, "utf8");
if (!readmeText.includes("make.fun")) {
  fail("README.md does not contain the string 'make.fun'");
}
report.readme_has_makefun = true;

console.log(JSON.stringify(report));
