import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHarness, extractHarnessOutput, buildCompeteHarness, extractCompeteOutput } from './problemHarnesses.js';

const PORT = Number(process.env.PORT ?? 8787);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLASSROOM_STORE_PATH = join(__dirname, 'data', 'classroom-store.json');
const JUDGE0_BASE_URL = (process.env.JUDGE0_BASE_URL ?? 'https://ce.judge0.com').replace(/\/$/, '');
const JUDGE0_AUTH_HEADER = process.env.JUDGE0_AUTH_HEADER;
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN;
const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
const JUDGE0_RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Duckling-User-Id, X-Duckling-Username, X-Duckling-Feathers',
};

const LANGUAGE_PATTERNS = {
  Java: [/^Java \(JDK 17/i, /^Java \(OpenJDK/i, /^Java\b/i],
  Python: [/^Python \(3\./i, /^Python\b/i],
  'C++': [/^C\+\+ \(GCC 14/i, /^C\+\+ \(GCC/i, /^C\+\+\b/i, /^GNU C\+\+\b/i],
};

let languageCache = null;

const emptyClassroomStore = () => ({
  classes: {},
  memberships: {},
  assignments: {},
  submissions: {},
});

let classroomStore = loadClassroomStore();
const competeStore = {
  lobbies: {},
  players: {},
  submissions: {},
};

function loadClassroomStore() {
  try {
    if (!existsSync(CLASSROOM_STORE_PATH)) {
      return emptyClassroomStore();
    }

    const parsed = JSON.parse(readFileSync(CLASSROOM_STORE_PATH, 'utf8'));
    return {
      classes: parsed.classes && typeof parsed.classes === 'object' ? parsed.classes : {},
      memberships: parsed.memberships && typeof parsed.memberships === 'object' ? parsed.memberships : {},
      assignments: parsed.assignments && typeof parsed.assignments === 'object' ? parsed.assignments : {},
      submissions: parsed.submissions && typeof parsed.submissions === 'object' ? parsed.submissions : {},
    };
  } catch {
    return emptyClassroomStore();
  }
}

function persistClassroomStore() {
  mkdirSync(dirname(CLASSROOM_STORE_PATH), { recursive: true });
  writeFileSync(CLASSROOM_STORE_PATH, JSON.stringify(classroomStore));
}

function slugId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeClassCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (Object.values(classroomStore.classes).some((classroom) => classroom.code === code));
  return code;
}

function membershipKey(classId, userId) {
  return `${classId}:${userId}`;
}

function normalizeUser(rawUserId, rawUsername) {
  const userId = String(rawUserId ?? '').trim();
  const username = String(rawUsername ?? '').trim() || 'student';

  if (!userId) {
    return null;
  }

  return { userId, username };
}

function buildClassroomPayload(userId) {
  const userMemberships = Object.values(classroomStore.memberships).filter((entry) => entry.userId === userId);
  const classes = userMemberships
    .map((membership) => {
      const classroom = classroomStore.classes[membership.classId];
      if (!classroom) return null;

      const assignments = Object.values(classroomStore.assignments)
        .filter((assignment) => assignment.classId === classroom.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((assignment) => {
          const submissions = Object.values(classroomStore.submissions).filter((submission) => submission.assignmentId === assignment.id);
          const ownSubmission = submissions
            .filter((submission) => submission.userId === userId)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
          const submitted = new Set(submissions.map((submission) => submission.userId)).size;
          const graded = submissions.filter((submission) => submission.grade !== null && submission.grade !== undefined && submission.grade !== '').length;

          return {
            ...assignment,
            stats: {
              submitted,
              graded,
              averageGrade: averageGrade(submissions),
              accepted: submissions.filter((submission) => submission.status === 'Accepted').length,
            },
            submission: ownSubmission,
          };
        });

      const classSubmissions = Object.values(classroomStore.submissions).filter((submission) => submission.classId === classroom.id);
      const students = Object.values(classroomStore.memberships)
        .filter((entry) => entry.classId === classroom.id && entry.role === 'student')
        .sort((a, b) => a.username.localeCompare(b.username))
        .map((entry) => ({
          userId: entry.userId,
          username: entry.username,
          joinedAt: entry.joinedAt,
        }));

      return {
        ...classroom,
        role: membership.role,
        assignments,
        teacherStats: {
          students: students.length,
          submissions: classSubmissions.length,
          graded: classSubmissions.filter((submission) => submission.grade !== null && submission.grade !== undefined && submission.grade !== '').length,
          averageGrade: averageGrade(classSubmissions),
        },
        students,
        submissions: membership.role === 'teacher'
          ? classSubmissions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          : [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { classes };
}

function averageGrade(submissions) {
  const grades = submissions
    .filter((submission) => submission.grade !== null && submission.grade !== undefined && submission.grade !== '')
    .map((submission) => Number(submission.grade))
    .filter((grade) => Number.isFinite(grade));
  if (!grades.length) return null;
  return Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 10) / 10;
}

function classMembership(classId, userId) {
  return classroomStore.memberships[membershipKey(classId, userId)] ?? null;
}

function isTeacher(classId, userId) {
  return classMembership(classId, userId)?.role === 'teacher';
}

function requestUser(headers) {
  const headerId = String(headers['x-duckling-user-id'] ?? '').trim();
  const headerName = String(headers['x-duckling-username'] ?? '').trim();
  const auth = String(headers.authorization ?? '');
  const tokenId = auth.toLowerCase().startsWith('bearer local-') ? auth.slice('bearer local-'.length).trim() : '';
  const userId = headerId || tokenId;

  if (!userId) return null;

  return {
    id: userId,
    username: headerName || `player-${userId.slice(-4)}`,
    feathers: Number(headers['x-duckling-feathers'] ?? 100) || 100,
  };
}

function makeCompeteCode() {
  let code = '';
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (Object.values(competeStore.lobbies).some((lobby) => lobby.code === code && lobby.status !== 'completed'));
  return code;
}

function playerList(lobbyId) {
  return competeStore.players[lobbyId] ?? [];
}

function submissionList(lobbyId) {
  return competeStore.submissions[lobbyId] ?? [];
}

function competeSnapshot(lobby) {
  return {
    lobby,
    players: playerList(lobby.id),
    submissions: submissionList(lobby.id),
  };
}

function pickCompeteProblem(players) {
  const average = players.length
    ? players.reduce((sum, player) => sum + Number(player.feathers ?? 100), 0) / players.length
    : 100;
  const easy = [1, 2, 3, 5, 6, 9, 11, 12, 14];
  const medium = [4, 7, 10, 13, 15, 16];
  const hard = [8, 17, 18, 19, 20];
  const pool = average < 300 ? easy : average < 650 ? [...easy, ...medium] : [...medium, ...hard];
  return pool[Math.floor(Math.random() * pool.length)];
}

function computeRankings(submissions, players) {
  const byUser = new Map(submissions.map((submission) => [submission.user_id, submission]));
  const ordered = [...players].sort((a, b) => {
    const subA = byUser.get(a.user_id);
    const subB = byUser.get(b.user_id);
    const winA = subA?.all_passed ? 1 : 0;
    const winB = subB?.all_passed ? 1 : 0;
    const totalA = (subA?.passed_visible ?? 0) + (subA?.passed_hidden ?? 0);
    const totalB = (subB?.passed_visible ?? 0) + (subB?.passed_hidden ?? 0);
    if (winA !== winB) return winB - winA;
    if (totalA !== totalB) return totalB - totalA;
    return String(subA?.submitted_at ?? '9999').localeCompare(String(subB?.submitted_at ?? '9999'));
  });

  return Object.fromEntries(ordered.map((player, index) => [player.user_id, index + 1]));
}

function featherChanges(lobby, players, rankings) {
  if (lobby.mode !== 'ranked' || players.length <= 1) return {};
  return Object.fromEntries(players.map((player) => {
    const place = rankings[player.user_id] ?? players.length;
    const change = place === 1 ? 24 : Math.max(-18, 8 - place * 10);
    return [player.user_id, change];
  }));
}

function finishLobby(lobby) {
  const players = playerList(lobby.id);
  const submissions = submissionList(lobby.id);
  const rankings = computeRankings(submissions, players);
  const changes = featherChanges(lobby, players, rankings);

  for (const player of players) {
    player.place = rankings[player.user_id] ?? null;
  }

  lobby.status = 'completed';
  lobby.ended_at = new Date().toISOString();
  return { rankings, feather_changes: changes };
}

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

  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/api/classroom') {
    const user = normalizeUser(url.searchParams.get('userId'), url.searchParams.get('username'));
    if (!user) {
      sendJson(response, 400, { error: 'userId is required.' });
      return;
    }

    sendJson(response, 200, { ok: true, ...buildClassroomPayload(user.userId) });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/classroom/classes') {
    try {
      const body = await readJsonBody(request);
      const user = normalizeUser(body.userId, body.username);
      const name = String(body.name ?? '').trim();
      if (!user || !name) {
        sendJson(response, 400, { error: 'userId and name are required.' });
        return;
      }

      const now = new Date().toISOString();
      const classId = slugId('class');
      classroomStore.classes[classId] = {
        id: classId,
        name,
        section: String(body.section ?? '').trim() || 'Duckling classroom',
        code: makeClassCode(),
        teacherId: user.userId,
        createdAt: now,
      };
      classroomStore.memberships[membershipKey(classId, user.userId)] = {
        classId,
        userId: user.userId,
        username: user.username,
        role: 'teacher',
        joinedAt: now,
      };
      persistClassroomStore();
      sendJson(response, 201, { ok: true, ...buildClassroomPayload(user.userId), selectedId: classId });
      return;
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : 'Could not create class.' });
      return;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/classroom/join') {
    try {
      const body = await readJsonBody(request);
      const user = normalizeUser(body.userId, body.username);
      const code = String(body.code ?? '').trim().toUpperCase();
      const classroom = Object.values(classroomStore.classes).find((entry) => entry.code === code);
      if (!user || !code) {
        sendJson(response, 400, { error: 'userId and code are required.' });
        return;
      }
      if (!classroom) {
        sendJson(response, 404, { error: 'No class found for that code.' });
        return;
      }

      const key = membershipKey(classroom.id, user.userId);
      classroomStore.memberships[key] = classroomStore.memberships[key] ?? {
        classId: classroom.id,
        userId: user.userId,
        username: user.username,
        role: classroom.teacherId === user.userId ? 'teacher' : 'student',
        joinedAt: new Date().toISOString(),
      };
      persistClassroomStore();
      sendJson(response, 200, { ok: true, ...buildClassroomPayload(user.userId), selectedId: classroom.id });
      return;
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : 'Could not join class.' });
      return;
    }
  }

  const assignmentMatch = url.pathname.match(/^\/api\/classroom\/classes\/([^/]+)\/assignments$/);
  if (request.method === 'POST' && assignmentMatch) {
    try {
      const classId = decodeURIComponent(assignmentMatch[1]);
      const body = await readJsonBody(request);
      const user = normalizeUser(body.userId, body.username);
      if (!classroomStore.classes[classId]) {
        sendJson(response, 404, { error: 'Class not found.' });
        return;
      }
      if (!user || !isTeacher(classId, user.userId)) {
        sendJson(response, 403, { error: 'Only the teacher can post assignments.' });
        return;
      }

      const problemId = Number(body.problemId);
      const title = String(body.title ?? '').trim();
      if (!Number.isInteger(problemId) || !title) {
        sendJson(response, 400, { error: 'problemId and title are required.' });
        return;
      }

      const assignmentId = slugId('assignment');
      classroomStore.assignments[assignmentId] = {
        id: assignmentId,
        classId,
        problemId,
        title,
        instructions: String(body.instructions ?? '').trim() || 'Solve the problem and run your tests before submitting.',
        createdAt: new Date().toISOString(),
      };
      persistClassroomStore();
      sendJson(response, 201, { ok: true, ...buildClassroomPayload(user.userId), selectedId: classId });
      return;
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : 'Could not post assignment.' });
      return;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/classroom/submissions') {
    try {
      const body = await readJsonBody(request);
      const user = normalizeUser(body.userId, body.username);
      const assignmentId = String(body.assignmentId ?? '').trim();
      const assignment = classroomStore.assignments[assignmentId];
      if (!user || !assignment) {
        sendJson(response, 400, { error: 'Valid userId and assignmentId are required.' });
        return;
      }
      if (classMembership(assignment.classId, user.userId)?.role !== 'student') {
        sendJson(response, 403, { error: 'Only enrolled students can submit this assignment.' });
        return;
      }

      const existing = Object.values(classroomStore.submissions)
        .find((submission) => submission.assignmentId === assignmentId && submission.userId === user.userId);
      const now = new Date().toISOString();
      const submissionId = existing?.id ?? slugId('submission');
      classroomStore.submissions[submissionId] = {
        id: submissionId,
        assignmentId,
        classId: assignment.classId,
        userId: user.userId,
        username: user.username,
        problemId: assignment.problemId,
        language: String(body.language ?? ''),
        sourceCode: String(body.sourceCode ?? ''),
        status: String(body.status ?? 'Submitted'),
        summary: String(body.summary ?? ''),
        grade: existing?.grade ?? null,
        feedback: existing?.feedback ?? '',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      persistClassroomStore();
      sendJson(response, 201, { ok: true, submission: classroomStore.submissions[submissionId] });
      return;
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : 'Could not save submission.' });
      return;
    }
  }

  const gradeMatch = url.pathname.match(/^\/api\/classroom\/submissions\/([^/]+)\/grade$/);
  if (request.method === 'PATCH' && gradeMatch) {
    try {
      const submissionId = decodeURIComponent(gradeMatch[1]);
      const submission = classroomStore.submissions[submissionId];
      const body = await readJsonBody(request);
      const user = normalizeUser(body.userId, body.username);
      if (!submission || !user || !isTeacher(submission.classId, user.userId)) {
        sendJson(response, 403, { error: 'Only the teacher can grade this submission.' });
        return;
      }

      const grade = body.grade === '' || body.grade === null || body.grade === undefined ? null : Number(body.grade);
      if (grade !== null && (!Number.isFinite(grade) || grade < 0 || grade > 100)) {
        sendJson(response, 400, { error: 'Grade must be between 0 and 100.' });
        return;
      }

      classroomStore.submissions[submissionId] = {
        ...submission,
        grade,
        feedback: String(body.feedback ?? ''),
        updatedAt: new Date().toISOString(),
      };
      persistClassroomStore();
      sendJson(response, 200, { ok: true, ...buildClassroomPayload(user.userId), selectedId: submission.classId });
      return;
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : 'Could not save grade.' });
      return;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/compete/lobby/create') {
    try {
      const user = requestUser(request.headers);
      const body = await readJsonBody(request);
      const mode = String(body.mode ?? 'casual');
      if (!user) {
        sendJson(response, 401, { detail: 'Sign in before creating a lobby.' });
        return;
      }
      if (!['casual', 'ranked'].includes(mode)) {
        sendJson(response, 400, { detail: 'Invalid mode.' });
        return;
      }

      const id = slugId('lobby');
      const lobby = {
        id,
        code: makeCompeteCode(),
        host_id: user.id,
        mode,
        status: 'waiting',
        max_players: 4,
        problem_id: null,
        started_at: null,
        ended_at: null,
        created_at: new Date().toISOString(),
      };
      competeStore.lobbies[id] = lobby;
      competeStore.players[id] = [{
        user_id: user.id,
        username: user.username,
        feathers: user.feathers,
        place: null,
        joined_at: new Date().toISOString(),
      }];
      competeStore.submissions[id] = [];
      sendJson(response, 201, { lobby_id: id, code: lobby.code });
      return;
    } catch (error) {
      sendJson(response, 500, { detail: error instanceof Error ? error.message : 'Could not create lobby.' });
      return;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/compete/lobby/join') {
    try {
      const user = requestUser(request.headers);
      const body = await readJsonBody(request);
      const code = String(body.code ?? '').trim();
      const lobby = Object.values(competeStore.lobbies).find((entry) => entry.code === code);
      if (!user) {
        sendJson(response, 401, { detail: 'Sign in before joining a lobby.' });
        return;
      }
      if (!lobby) {
        sendJson(response, 404, { detail: 'Lobby not found. Check the code and try again.' });
        return;
      }
      if (lobby.status !== 'waiting') {
        sendJson(response, 400, { detail: 'This game has already started.' });
        return;
      }

      const players = playerList(lobby.id);
      if (!players.some((player) => player.user_id === user.id)) {
        if (players.length >= lobby.max_players) {
          sendJson(response, 400, { detail: 'Lobby is full.' });
          return;
        }
        players.push({
          user_id: user.id,
          username: user.username,
          feathers: user.feathers,
          place: null,
          joined_at: new Date().toISOString(),
        });
      }

      sendJson(response, 200, { lobby_id: lobby.id, code: lobby.code });
      return;
    } catch (error) {
      sendJson(response, 500, { detail: error instanceof Error ? error.message : 'Could not join lobby.' });
      return;
    }
  }

  const competeLobbyMatch = url.pathname.match(/^\/api\/compete\/lobby\/([^/]+)$/);
  if (request.method === 'GET' && competeLobbyMatch) {
    const code = decodeURIComponent(competeLobbyMatch[1]);
    const lobby = Object.values(competeStore.lobbies).find((entry) => entry.code === code);
    if (!lobby) {
      sendJson(response, 404, { detail: 'Lobby not found.' });
      return;
    }
    sendJson(response, 200, competeSnapshot(lobby));
    return;
  }

  const competeActionMatch = url.pathname.match(/^\/api\/compete\/lobby\/([^/]+)\/(start|leave|submit|end)$/);
  if (request.method === 'POST' && competeActionMatch) {
    try {
      const code = decodeURIComponent(competeActionMatch[1]);
      const action = competeActionMatch[2];
      const user = requestUser(request.headers);
      const lobby = Object.values(competeStore.lobbies).find((entry) => entry.code === code);
      if (!lobby) {
        sendJson(response, 404, { detail: 'Lobby not found.' });
        return;
      }

      if (action === 'start') {
        if (!user || lobby.host_id !== user.id) {
          sendJson(response, 403, { detail: 'Only the host can start this game.' });
          return;
        }
        if (lobby.status !== 'waiting') {
          sendJson(response, 400, { detail: 'This game has already started.' });
          return;
        }
        lobby.problem_id = pickCompeteProblem(playerList(lobby.id));
        lobby.status = 'active';
        lobby.started_at = new Date().toISOString();
        sendJson(response, 200, competeSnapshot(lobby));
        return;
      }

      if (action === 'leave') {
        if (user) {
          competeStore.players[lobby.id] = playerList(lobby.id).filter((player) => player.user_id !== user.id);
        }
        sendJson(response, 200, { ok: true });
        return;
      }

      if (action === 'submit') {
        if (!user) {
          sendJson(response, 401, { detail: 'Sign in before submitting.' });
          return;
        }
        const body = await readJsonBody(request);
        const submissions = submissionList(lobby.id);
        const existing = submissions.find((entry) => entry.user_id === user.id);
        const submission = {
          user_id: user.id,
          code: String(body.code ?? ''),
          language: String(body.language ?? ''),
          passed_visible: Number(body.passed_visible ?? 0),
          total_visible: Number(body.total_visible ?? 0),
          passed_hidden: Number(body.passed_hidden ?? 0),
          total_hidden: Number(body.total_hidden ?? 0),
          all_passed: Boolean(body.all_passed),
          submitted_at: new Date().toISOString(),
        };
        if (existing) {
          Object.assign(existing, submission);
        } else {
          submissions.push(submission);
        }
        if (submission.all_passed) {
          const result = finishLobby(lobby);
          sendJson(response, 200, { status: 'winner', ...result });
          return;
        }
        sendJson(response, 200, { status: 'submitted' });
        return;
      }

      const result = finishLobby(lobby);
      sendJson(response, 200, result);
      return;
    } catch (error) {
      sendJson(response, 500, { detail: error instanceof Error ? error.message : 'Compete request failed.' });
      return;
    }
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

  if (request.method === 'POST' && request.url === '/api/code/compete') {
    try {
      const body = await readJsonBody(request);
      const language = normalizeLanguageName(String(body.language ?? ''));
      const sourceCode = String(body.sourceCode ?? '');
      const rawProblemId = Number(body.problemId);
      const problemId = Number.isInteger(rawProblemId) ? rawProblemId : null;

      if (!language || !sourceCode.trim()) {
        sendJson(response, 400, { error: 'language and sourceCode are required.' });
        return;
      }

      const competeCode = problemId ? buildCompeteHarness(problemId, language, sourceCode) : null;
      if (!competeCode) {
        sendJson(response, 400, { error: 'No compete harness for this problem/language.' });
        return;
      }

      const language_id = await resolveLanguageId(language);
      const judgeResponse = await fetch(
        `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
        {
          method: 'POST',
          headers: judge0Headers(),
          body: JSON.stringify({
            language_id,
            source_code: competeCode,
            stdin: '',
            cpu_time_limit: 5,
            wall_time_limit: 10,
            memory_limit: 256000,
            enable_network: false,
          }),
        },
      );

      const payload = await judgeResponse.json().catch(() => ({}));
      if (!judgeResponse.ok) {
        throw new Error(payload.error ?? payload.message ?? `Judge0 request failed (${judgeResponse.status}).`);
      }

      const compete = extractCompeteOutput(payload.stdout ?? '');
      if (!compete) {
        sendJson(response, 200, {
          ok: false,
          error: 'Execution error',
          stderr: payload.stderr ?? '',
          compileOutput: payload.compile_output ?? '',
        });
        return;
      }

      sendJson(response, 200, {
        ok: true,
        allPassed: compete.allPassed,
        passedVisible: compete.passedVisible,
        totalVisible: compete.totalVisible,
        passedHidden: compete.passedHidden,
        totalHidden: compete.totalHidden,
        visibleCases: compete.visibleCases,
        status: compete.status,
        message: compete.message,
        stderr: payload.stderr ?? '',
        compileOutput: payload.compile_output ?? '',
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
