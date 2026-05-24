import { createServer } from 'node:http';
import { buildHarness, extractHarnessOutput } from './problemHarnesses.js';

const PORT = Number(process.env.PORT ?? 8787);
const JUDGE0_BASE_URL = (process.env.JUDGE0_BASE_URL ?? 'https://ce.judge0.com').replace(/\/$/, '');
const JUDGE0_AUTH_HEADER = process.env.JUDGE0_AUTH_HEADER;
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN;
const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

const LANGUAGE_PATTERNS = {
  Java: [/^Java \(JDK 17/i, /^Java \(OpenJDK/i, /^Java\b/i],
  Python: [/^Python \(3\./i, /^Python\b/i],
  'C++': [/^C\+\+ \(GCC 14/i, /^C\+\+ \(GCC/i, /^C\+\+\b/i, /^GNU C\+\+\b/i],
};

let languageCache = null;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, JSON_HEADERS);
  response.end(JSON.stringify(payload));
}

function judge0Headers() {
  const headers = { 'Content-Type': 'application/json' };

  if (JUDGE0_AUTH_HEADER && JUDGE0_AUTH_TOKEN) {
    headers[JUDGE0_AUTH_HEADER] = JUDGE0_AUTH_TOKEN;
  }

  if (JUDGE0_RAPIDAPI_KEY && JUDGE0_RAPIDAPI_HOST) {
    headers['X-RapidAPI-Key'] = JUDGE0_RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = JUDGE0_RAPIDAPI_HOST;
  }

  return headers;
}

function normalizeLanguageName(language) {
  return language === 'Cpp' ? 'C++' : language;
}

function prepareSourceCode(language, sourceCode, problemId) {
  const harnessed = Number.isInteger(problemId)
    ? buildHarness(problemId, language, sourceCode)
    : null;

  if (harnessed) {
    return harnessed;
  }

  if (language !== 'Java') {
    return sourceCode;
  }

  if (/public\s+class\s+Solution\b/.test(sourceCode)) {
    return sourceCode.replace(/public\s+class\s+Solution\b/, 'public class Main');
  }

  if (/class\s+Solution\b/.test(sourceCode)) {
    return sourceCode.replace(/class\s+Solution\b/, 'class Main');
  }

  return sourceCode;
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function fetchLanguages() {
  if (languageCache) {
    return languageCache;
  }

  const response = await fetch(`${JUDGE0_BASE_URL}/languages`, {
    headers: judge0Headers(),
  });

  if (!response.ok) {
    throw new Error(`Could not load Judge0 languages (${response.status}).`);
  }

  languageCache = await response.json();
  return languageCache;
}

async function resolveLanguageId(language) {
  const normalized = normalizeLanguageName(language);
  const patterns = LANGUAGE_PATTERNS[normalized];

  if (!patterns) {
    throw new Error(`Unsupported language "${language}".`);
  }

  const languages = await fetchLanguages();
  let match = null;

  for (const pattern of patterns) {
    match = languages.find((entry) => pattern.test(entry.name));
    if (match) {
      break;
    }
  }

  if (!match) {
    throw new Error(`Judge0 does not expose a runtime for "${normalized}".`);
  }

  return match.id;
}

function summarizeResult(result) {
  const sections = [];

  if (result.compile_output) {
    sections.push(`Compile output:\n${result.compile_output}`);
  }

  if (result.stderr) {
    sections.push(`stderr:\n${result.stderr}`);
  }

  if (result.stdout) {
    sections.push(`stdout:\n${result.stdout}`);
  }

  if (!sections.length && result.message) {
    sections.push(result.message);
  }

  return sections.join('\n\n').trim();
}

function summarizeCases(cases) {
  const passed = cases.filter((entry) => entry.passed).length;
  return `${passed}/${cases.length} test cases passed`;
}

async function runSubmission({ language, sourceCode, stdin, problemId }) {
  const language_id = await resolveLanguageId(language);
  const preparedSourceCode = prepareSourceCode(language, sourceCode, problemId);

  const response = await fetch(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: judge0Headers(),
      body: JSON.stringify({
        language_id,
        source_code: preparedSourceCode,
        stdin,
        cpu_time_limit: 2,
        wall_time_limit: 5,
        memory_limit: 256000,
        enable_network: false,
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `Judge0 request failed (${response.status}).`);
  }

  return payload;
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, JSON_HEADERS);
    response.end();
    return;
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true, judge0BaseUrl: JUDGE0_BASE_URL });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/code/run') {
    try {
      const body = await readJsonBody(request);
      const language = normalizeLanguageName(String(body.language ?? ''));
      const sourceCode = String(body.sourceCode ?? '');
      const stdin = String(body.stdin ?? '');
      const rawProblemId = Number(body.problemId);
      const problemId = Number.isInteger(rawProblemId) ? rawProblemId : null;

      if (!language || !sourceCode.trim()) {
        sendJson(response, 400, { error: 'language and sourceCode are required.' });
        return;
      }

      const result = await runSubmission({ language, sourceCode, stdin, problemId });
      const harnessOutput = extractHarnessOutput(result.stdout ?? '');
      const finalStatus =
        harnessOutput?.status ?? result.status?.description ?? 'Unknown';
      const finalMessage = harnessOutput?.message ?? result.message ?? '';
      const finalStdout = harnessOutput?.stdout ?? result.stdout ?? '';
      const finalCases = harnessOutput?.cases ?? [];

      sendJson(response, 200, {
        ok: true,
        status: finalStatus,
        stdout: finalStdout,
        stderr: result.stderr ?? '',
        compileOutput: result.compile_output ?? '',
        message: finalMessage,
        time: result.time ?? null,
        memory: result.memory ?? null,
        summary: finalCases.length ? summarizeCases(finalCases) : summarizeResult(result),
        cases: finalCases,
      });
      return;
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : 'Execution failed.',
      });
      return;
    }
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`Code runner listening on http://localhost:${PORT}`);
});
