import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const { default: worker } = await import("../dist/server/index.js");
const clientRoot = fileURLToPath(new URL("../dist/client/", import.meta.url));
const origin = "https://noria.test";
const contentTypes = {
  ".css": "text/css",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const env = {
  ASSETS: {
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname);
      const path = resolve(clientRoot, `.${pathname}`);
      if (!path.startsWith(`${resolve(clientRoot)}${sep}`)) {
        return new Response("Forbidden", { status: 403 });
      }
      try {
        return new Response(await readFile(path), {
          headers: { "content-type": contentTypes[extname(path)] ?? "application/octet-stream" },
        });
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "EISDIR") throw error;
        return new Response("Not found", { status: 404 });
      }
    },
  },
};
const ctx = { waitUntil() {}, passThroughOnException() {} };

async function renderHome() {
  const response = await worker.fetch(
    new Request(`${origin}/`, { headers: { accept: "text/html" } }),
    env,
    ctx,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  return response.text();
}

test("serves useful homepage content without JavaScript or a blocking intro", async () => {
  const html = await renderHome();
  assert.match(html, /<html\b[^>]*lang="bs"/);
  assert.match(html, /<title>Noria Technologies/);
  assert.match(html, /<h1\b[^>]*>Povezujemo gradove\./);
  assert.match(html, /ČETIRI PRAVCA NORIJE/);
  const directions = [...html.matchAll(/<article\b[^>]*class="direction-card"[^>]*>[\s\S]*?<\/article>/g)]
    .map((match) => match[0]);
  assert.equal(directions.length, 4);
  assert.match(directions[0], /BSL — Balkan Smart Life/);
  assert.match(directions[0], /Parkiraj\.ba \/ BSL Parking/);
  assert.match(directions[1], /Urban Intelligence/);
  assert.match(directions[2], /NRN Mesh/);
  assert.match(directions[3], /AI &amp; Smart Infrastructure/);
  assert.doesNotMatch(html, /class="product-card"/);
  assert.doesNotMatch(html, /<dialog\b/);
});

test("all fonts referenced by the built page are served from portable public assets", async () => {
  const html = await renderHome();
  const cssParts = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]);
  for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
    if (!/rel="stylesheet"/.test(tag)) continue;
    const href = tag.match(/href="([^"]+)"/)?.[1];
    assert.ok(href, "stylesheet has a URL");
    const response = await env.ASSETS.fetch(new Request(new URL(href, origin)));
    assert.equal(response.status, 200, `stylesheet ${href} exists in the build`);
    cssParts.push(await response.text());
  }
  const css = cssParts.join("\n");
  assert.doesNotMatch(css, /\/workspace\//, "font paths must not depend on the build machine");
  assert.match(css, /font-family:\s*["']?Geist\b/);
  assert.match(css, /font-family:\s*["']?Geist Mono\b/);

  const fontUrls = new Set(
    [...css.matchAll(/url\(\s*["']?([^\s"')]+\.woff2)["']?\s*\)/g)].map((match) => match[1]),
  );
  const publicFonts = (await readdir(new URL("../public/fonts/", import.meta.url), { recursive: true }))
    .filter((path) => path.endsWith(".woff2"));
  assert.ok(publicFonts.length > 0);
  assert.equal(fontUrls.size, publicFonts.length, "all bundled font subsets are referenced");
  for (const fontUrl of fontUrls) {
    assert.match(fontUrl, /^\/fonts\//);
    const response = await env.ASSETS.fetch(new Request(new URL(fontUrl, origin)));
    assert.equal(response.status, 200, `font ${fontUrl} exists in the build`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 4).toString(), "wOF2", `${fontUrl} is a WOFF2 font`);
  }
});

test("serves the original logo without an Images binding or transformation errors", async (t) => {
  const errors = t.mock.method(console, "error", () => {});
  const response = await worker.fetch(
    new Request(`${origin}/_vinext/image?url=%2Fnoria-logo-header.png&w=64&q=75`),
    env,
    ctx,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    await readFile(new URL("../public/noria-logo-header.png", import.meta.url)),
  );
  assert.equal(errors.mock.callCount(), 0);
});

test("image requests reject remote URLs and unsupported widths", async () => {
  for (const query of [
    "url=https%3A%2F%2Fexample.com%2Fimage.png&w=64&q=75",
    "url=%2Fnoria-logo-header.png&w=9999&q=75",
  ]) {
    const response = await worker.fetch(new Request(`${origin}/_vinext/image?${query}`), env, ctx);
    assert.equal(response.status, 400);
  }
});
