import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function readJsonFile(path: string): unknown {
  if (!existsSync(path)) {
    fail(`${path} not found`);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    fail(`${path} is not valid JSON`);
  }
}

function loadPostUrl(postPath: string): string {
  const post = readJsonFile(postPath) as { url?: unknown };
  const url = post.url;
  if (typeof url !== "string") {
    fail("POST.json url is not a string");
  }
  return url;
}

const dir = dirname(fileURLToPath(import.meta.url));
const postPath = join(dir, "POST.json");
const imagePath = join(dir, "meme.webp");
const readmePath = join(dir, "README.md");

const url = loadPostUrl(postPath);

function parsePostUrl(url: string): { handle: string; statusId: string } {
  const match = /^https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)$/.exec(url);
  if (match === null) {
    fail("post url does not match https://x.com/<handle>/status/<digits>");
  }
  return { handle: match[1], statusId: match[2] };
}

function checkWebpImage(imagePath: string): number {
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
  return imageStat.size;
}

const { handle, statusId } = parsePostUrl(url);
const imageSize = checkWebpImage(imagePath);

function checkReadme(readmePath: string): boolean {
  if (!existsSync(readmePath)) {
    fail("README.md not found");
  }
  const readmeText = readFileSync(readmePath, "utf8");
  if (!readmeText.includes("make.fun")) {
    fail("README.md does not contain the string 'make.fun'");
  }
  return true;
}

const report = {
  ok: true,
  post_url: url,
  handle: handle,
  status_id: statusId,
  image_bytes: imageSize,
  readme_has_makefun: checkReadme(readmePath),
};

console.log(JSON.stringify(report));
