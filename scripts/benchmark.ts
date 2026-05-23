import fs from "fs";
import path from "path";
import "dotenv/config";

async function runBenchmark() {
  const dir = "./evals/eval-dataset";
  const files = fs.readdirSync(dir);
  
  let successfulCorrections = 0;

  for (const file of files) {
    try {
      const test = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      
      const secret = (process.env.NEXT_PUBLIC_BENCHMARK_SECRET || "").trim();
      
      const payload = {
        messages: [{ role: "user", content: test.job.description }],
        companyName: test.job.company,
        position: test.job.position,
        resumeText: test.resume,
        mode: "analyze",
        testSecret: secret
      };

      const options = {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-test-secret": secret
        }
      };

      const rawRes = await fetch("http://localhost:3000/api/chat", {
        ...options,
        body: JSON.stringify({ ...payload, bypassJudge: true })
      });
      
      if (!rawRes.ok) {
        const text = await rawRes.text();
        console.error(`[${test.testName}] Raw failed (${rawRes.status}):`, text.substring(0, 100));
        continue;
      }
      
      const raw = await rawRes.json();

      const reliableRes = await fetch("http://localhost:3000/api/chat", {
        ...options,
        body: JSON.stringify({ ...payload, bypassJudge: false })
      });

      if (!reliableRes.ok) {
        const text = await reliableRes.text();
        console.error(`[${test.testName}] Reliable failed (${reliableRes.status}):`, text.substring(0, 100));
        continue;
      }

      const reliable = await reliableRes.json();

      const wasCorrected = raw.metadata.verdict !== reliable.metadata.verdict;
      const isNowAccurate = reliable.metadata.verdict === test.expectedVerdict;

      if (wasCorrected && isNowAccurate) successfulCorrections++;

      console.log(
        `[${test.testName}] Raw: ${raw.metadata.verdict} | Reliable: ${reliable.metadata.verdict} | Tokens: ${reliable.metadata.total_tokens} | Cost: $${reliable.metadata.estimated_cost.toFixed(5)}`
      );
    } catch (e: unknown) {
      console.error(`Error processing ${file}:`, (e as Error).message);
    }
  }

  console.log(
    `\nReliability Layer Impact: ${((successfulCorrections / files.length) * 100).toFixed(1)}% improvement in decision accuracy.`
  );
}

runBenchmark();
