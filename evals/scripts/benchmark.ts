import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../frontend/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../frontend/.env") });

async function parseSseResult(res: Response) {
  const text = await res.text();
  const events = text.split("\n\n");
  const parsedEvents = [];

  for (const event of events) {
    if (event.startsWith("data: ")) {
      try {
        const data = JSON.parse(event.slice(6));
        parsedEvents.push(data);
        if (data.type === "result") {
          return data;
        } else if (data.type === "error") {
          throw new Error(`Server returned error: ${data.error}`);
        }
      } catch (e) {
        // ignore parse errors for partial chunks
      }
    }
  }

  console.error("Received events:", JSON.stringify(parsedEvents, null, 2));
  throw new Error("No result event found in SSE stream");
}

async function runBenchmark() {
  const datasetDir = path.resolve(__dirname, "../dataset");
  const files = fs.readdirSync(datasetDir).filter((f) => f.endsWith(".json"));

  let successfulCorrections = 0;
  let analyzeTotal = 0;
  let customizeTotal = 0;
  let customizePassed = 0;

  for (const file of files) {
    try {
      const test = JSON.parse(
        fs.readFileSync(path.join(datasetDir, file), "utf8")
      );
      const secret = (
        process.env.BENCHMARK_SECRET ||
        ""
      ).trim();
      const mode = test.mode || "analyze";

      let resumeText = test.resume;
      if (test.resumeFile) {
        resumeText = fs.readFileSync(
          path.resolve(__dirname, "../", test.resumeFile),
          "utf8"
        );
      }

      const payload = {
        messages: [{ role: "user", content: test.job.description }],
        companyName: test.job.company,
        position: test.job.position,
        resumeText,
        mode,
        testSecret: secret,
      };

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-secret": secret,
        },
      };

      if (mode === "analyze") {
        analyzeTotal++;

        const rawRes = await fetch("http://localhost:3000/api/chat", {
          ...options,
          body: JSON.stringify({ ...payload, bypassJudge: true }),
        });

        if (!rawRes.ok) {
          const text = await rawRes.text();
          console.error(
            `[${test.testName}] Raw failed (${rawRes.status}):`,
            text.substring(0, 100)
          );
          continue;
        }

        const raw = await parseSseResult(rawRes);

        const reliableRes = await fetch("http://localhost:3000/api/chat", {
          ...options,
          body: JSON.stringify({ ...payload, bypassJudge: false }),
        });

        if (!reliableRes.ok) {
          const text = await reliableRes.text();
          console.error(
            `[${test.testName}] Reliable failed (${reliableRes.status}):`,
            text.substring(0, 100)
          );
          continue;
        }

        const reliable = await parseSseResult(reliableRes);

        const rawVerdict = raw.metadata?.verdict;
        const reliableVerdict = reliable.metadata?.verdict;
        const wasCorrected = rawVerdict !== reliableVerdict;
        const isNowAccurate = reliableVerdict === test.expectedVerdict;

        if (wasCorrected && isNowAccurate) successfulCorrections++;

        const judgeTag = reliable.metadata?.judge_override
          ? ` [JUDGE OVERRIDE → ${reliableVerdict} (Reason: ${reliable.metadata?.judge_critique || "None"})]`
          : "";

        console.log(
          `[ANALYZE | ${test.testName}] Raw: ${rawVerdict} | Reliable: ${reliableVerdict}${judgeTag} | Expected: ${test.expectedVerdict}`
        );
      } else if (mode === "customize") {
        customizeTotal++;

        const res = await fetch("http://localhost:3000/api/chat", {
          ...options,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(
            `[${test.testName}] Customize failed (${res.status}):`,
            text.substring(0, 100)
          );
          continue;
        }

        const data = await parseSseResult(res);
        const markdown = data.analysis || data.markdown || "";

        let passed = true;
        const failedAsserts: string[] = [];

        if (test.assertions) {
          for (const assertion of test.assertions) {
            if (assertion.type === "contains") {
              if (!markdown.toLowerCase().includes(assertion.value.toLowerCase())) {
                passed = false;
                failedAsserts.push(`Missing: "${assertion.value}"`);
              }
            } else if (assertion.type === "not_contains") {
              if (markdown.toLowerCase().includes(assertion.value.toLowerCase())) {
                passed = false;
                failedAsserts.push(`Unwanted: "${assertion.value}"`);
              }
            }
          }
        }

        if (!markdown.includes("\\begin{document}")) {
          passed = false;
          failedAsserts.push("Missing \\begin{document}");
        }
        if (!markdown.includes("\\section{")) {
          passed = false;
          failedAsserts.push("Missing \\section{");
        }

        if (passed) customizePassed++;

        console.log(
          `[CUSTOMIZE | ${test.testName}] Passed: ${passed}${!passed ? " | Errors: " + failedAsserts.join(", ") : ""}`
        );
      }
    } catch (e: unknown) {
      console.error(`Error processing ${file}:`, (e as Error).message);
    }
  }

  if (analyzeTotal > 0) {
    console.log(
      `\nAnalyze Reliability Layer Impact: ${((successfulCorrections / analyzeTotal) * 100).toFixed(1)}% improvement in decision accuracy.`
    );
  }
  if (customizeTotal > 0) {
    console.log(
      `Customize Accuracy: ${((customizePassed / customizeTotal) * 100).toFixed(1)}% (${customizePassed}/${customizeTotal}) passed assertions.`
    );
  }
}

runBenchmark();
