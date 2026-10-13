import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { parseDocument } from "htmlparser2";
import { getElementsByTagName, textContent } from "domutils";
import { HubError } from "./server";
import { isPublicIPv4 } from "./public-address";
import { normalizeJobUrl } from "./domain";

async function readPage(
  input: string,
  redirects = 0,
): Promise<{ html: string; url: string }> {
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new HubError("Use a public HTTPS job page on the standard port.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new HubError("Job site lookup timed out.", 504)),
        5000,
      );
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  const ipv4 = addresses.filter((address) => address.family === 4);
  if (!ipv4.length || ipv4.some((address) => !isPublicIPv4(address.address)))
    throw new HubError(
      "This destination cannot be fetched. Use the extension or paste the job description.",
    );
  // Pin the validated address so DNS cannot rebind to a private address between validation and connection.
  const result = await new Promise<{
    status: number;
    location?: string;
    html: string;
  }>((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "GET",
        rejectUnauthorized: true,
        family: 4,
        signal: AbortSignal.timeout(12000),
        lookup: (_hostname, options, callback) => {
          if (options.all)
            callback(null, [{ address: ipv4[0].address, family: 4 }]);
          else callback(null, ipv4[0].address, 4);
        },
        headers: {
          Accept: "text/html",
          "Accept-Encoding": "identity",
          "User-Agent": "OfferFit-JobCapture/1.0",
        },
      },
      (response) => {
        const status = response.statusCode || 500;
        if ([301, 302, 303, 307, 308].includes(status)) {
          response.resume();
          resolve({ status, location: response.headers.location, html: "" });
          return;
        }
        if (
          status !== 200 ||
          !String(response.headers["content-type"]).includes("text/html")
        ) {
          response.resume();
          reject(
            new HubError(
              "This site cannot be parsed here. Use the extension or paste the job description.",
              422,
            ),
          );
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            req.destroy(
              new HubError("Job page exceeds the capture limit.", 413),
            );
            return;
          }
          chunks.push(Buffer.from(chunk));
        });
        response.on("error", reject);
        response.on("end", () =>
          resolve({ status, html: Buffer.concat(chunks).toString("utf8") }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
  if (result.location) {
    if (redirects >= 3) throw new HubError("Too many job-page redirects.", 422);
    return readPage(new URL(result.location, url).toString(), redirects + 1);
  }
  return { html: result.html, url: url.toString() };
}
export async function captureJob(input: string) {
  const page = await readPage(input);
  const document = parseDocument(page.html);
  const jobs: Record<string, unknown>[] = [];
  let traversed = 0;
  const inspect = (value: unknown, depth = 0) => {
    if (depth > 5 || ++traversed > 1000) return;
    if (Array.isArray(value)) {
      for (const child of value.slice(0, 100)) inspect(child, depth + 1);
      return;
    }
    if (!value || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    const type = Array.isArray(object["@type"])
      ? object["@type"]
      : [object["@type"]];
    if (type.some((t) => typeof t === "string" && /(^|\/)JobPosting$/.test(t)))
      jobs.push(object);
    if (object["@graph"]) inspect(object["@graph"], depth + 1);
  };
  for (const script of getElementsByTagName(
    "script",
    document.children,
    true,
  )) {
    if (script.attribs.type?.toLowerCase() !== "application/ld+json") continue;
    try {
      inspect(JSON.parse(textContent(script)));
    } catch {
      /* Malformed public metadata is ignored. */
    }
  }
  const matching = jobs.filter((job) => {
    try {
      return (
        typeof job.url === "string" &&
        normalizeJobUrl(new URL(job.url, page.url).toString()) ===
          normalizeJobUrl(page.url)
      );
    } catch {
      return false;
    }
  });
  const job =
    matching.length === 1 ? matching[0] : jobs.length === 1 ? jobs[0] : null;
  if (!job)
    throw new HubError(
      "No unambiguous job posting found. Use the extension or paste the role details.",
      422,
    );
  const plain = (value: unknown, max: number) =>
    typeof value === "string"
      ? textContent(parseDocument(value.slice(0, max * 4)))
          .trim()
          .slice(0, max)
      : "";
  const organization = job.hiringOrganization as { name?: unknown } | undefined;
  const location = job.jobLocation as
    | { address?: { addressLocality?: unknown; addressCountry?: unknown } }
    | undefined;
  const company = plain(organization?.name, 160);
  const role = plain(job.title, 200);
  const jd = plain(job.description, 30000);
  if (!role || !jd)
    throw new HubError(
      "The job metadata is incomplete. Use the extension or paste the job description.",
      422,
    );
  return {
    company,
    role,
    jd,
    job_url: page.url,
    location: [
      location?.address?.addressLocality,
      location?.address?.addressCountry,
    ]
      .filter((v) => typeof v === "string")
      .join(", ")
      .slice(0, 200),
  };
}
