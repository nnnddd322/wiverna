const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanLine(rawLine) {
  let s = String(rawLine ?? '');

  s = s.replace(/\uFFFD/g, '');
  s = s.replace(/^[\s\u00A0]*\?[\s\u00A0]*/u, '- ');

  if (/^[ \t]*патч[ \t]*$/iu.test(s)) return '';

  return s;
}

function tokenize(str) {
  const n = normalize(str);
  const parts = n.split(/[^a-zа-я0-9]+/iu).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (p.length < 4) continue;
    out.push(p);
  }
  return new Set(out);
}

function intersectionSize(a, b) {
  if (!a || !b) return 0;
  let small = a;
  let big = b;
  if (a.size > b.size) {
    small = b;
    big = a;
  }

  let count = 0;
  for (const x of small) {
    if (big.has(x)) count += 1;
  }
  return count;
}

function makeLectureId(baseId, usedIds) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let i = 2;
  while (usedIds.has(`${baseId}-${i}`)) i += 1;
  const id = `${baseId}-${i}`;
  usedIds.add(id);
  return id;
}

const dataJs = fs.readFileSync('data.js', 'utf8');
const dataContext = {};
vm.createContext(dataContext);
vm.runInContext(dataJs, dataContext);
const disciplines = dataContext.disciplines || [];

const disciplinesByNormName = new Map(
  (disciplines || []).map((d) => [normalize(d.name), d])
);

function stripLeadingNumbering(line) {
  return String(line || '')
    .replace(/^\s*(?:\d+\s*[\.)]\s*)+/u, '')
    .trim();
}

function detectDisciplineHeader(rawLine) {
  const original = String(rawLine || '').trim();
  if (!original) return null;

  const normOriginal = normalize(original);
  const hasSignal =
    /^\d/u.test(original) ||
    normOriginal.includes('экзамен') ||
    normOriginal.includes('зачет') ||
    normOriginal.includes('зачёт');

  let candidate = stripLeadingNumbering(original);
  candidate = candidate.replace(/[.\s]*(экзамен|зачет|зачёт)\s*$/iu, '').trim();
  candidate = candidate.replace(/\.$/u, '').trim();
  const normCandidate = normalize(candidate);

  if (!hasSignal && normCandidate.length > 60) return null;

  if (disciplinesByNormName.has(normCandidate)) return disciplinesByNormName.get(normCandidate);

  for (const [k, d] of disciplinesByNormName.entries()) {
    if (!k) continue;
    if (normCandidate === k) return d;
    if (normCandidate.includes(k) || k.includes(normCandidate)) {
      if (hasSignal) return d;
    }
  }

  return null;
}

function findDisciplineByHeaderName(headerName) {
  const n = normalize(headerName);
  if (disciplinesByNormName.has(n)) return disciplinesByNormName.get(n);

  for (const [k, d] of disciplinesByNormName.entries()) {
    if (n.includes(k) || k.includes(n)) return d;
  }

  return null;
}

const source = fs.readFileSync('etnopedagogika_clean_utf8.txt', 'utf8');
const lines = source.split(/\r?\n/);

const topicRe = /^(?:Старая\)\s*)?Тема\s+(\d+)(?:\s*[\.\):]\s*|\s+)(.+?)\s*$/i;

const lecturesData = {};

let currentDiscipline = null;
let currentDisciplineId = null;
let currentLecture = null;
let currentLectureLines = [];
const usedLectureIdsByDiscipline = new Map();

function ensureDiscipline(disciplineObj) {
  if (!disciplineObj) return;

  const disciplineId = disciplineObj.id;
  if (!lecturesData[disciplineId]) {
    lecturesData[disciplineId] = {
      id: disciplineObj.id,
      name: disciplineObj.name,
      description: disciplineObj.description,
      lectures: [],
    };
    usedLectureIdsByDiscipline.set(disciplineId, new Set());
  }
}

function flushLecture() {
  if (!currentDisciplineId || !currentLecture) return;

  const text = currentLectureLines.join('\n').trim();
  const html = `<pre style="white-space: pre-wrap;">${escapeHtml(text)}</pre>`;

  lecturesData[currentDisciplineId].lectures.push({
    id: currentLecture.id,
    title: currentLecture.title,
    content: html,
    __text: text,
  });

  currentLecture = null;
  currentLectureLines = [];
}

for (let i = 0; i < lines.length; i += 1) {
  const raw = lines[i];
  const line = (raw || '').trim();

  const disciplineObjFromHeader = detectDisciplineHeader(line);
  if (disciplineObjFromHeader) {
    flushLecture();

    currentDiscipline = disciplineObjFromHeader;
    currentDisciplineId = disciplineObjFromHeader.id;
    ensureDiscipline(disciplineObjFromHeader);

    continue;
  }

  const tm = line.match(topicRe);
  if (tm) {
    flushLecture();

    if (!currentDisciplineId) continue;

    const n = tm[1];
    const titleRest = tm[2];
    const baseId = `tema-${n}`;
    const used = usedLectureIdsByDiscipline.get(currentDisciplineId) || new Set();
    usedLectureIdsByDiscipline.set(currentDisciplineId, used);

    currentLecture = {
      id: makeLectureId(baseId, used),
      title: `Тема ${n}. ${titleRest}`,
    };
    currentLectureLines = [];
    continue;
  }

  if (!currentLecture) continue;

  const cleaned = cleanLine(raw);
  if (cleaned === '') continue;

  currentLectureLines.push(cleaned);
}

flushLecture();

function dedupeWithinDisciplines() {
  for (const d of Object.values(lecturesData)) {
    const seen = new Set();
    const out = [];
    for (const lec of d.lectures) {
      const hash = crypto
        .createHash('sha1')
        .update(normalize(`${lec.title}\n${lec.__text || ''}`), 'utf8')
        .digest('hex')
        .slice(0, 12);
      const key = `${normalize(lec.title)}|${hash}`;
      if (seen.has(key)) continue;
      seen.add(key);
      delete lec.__text;
      out.push(lec);
    }
    d.lectures = out;
  }
}

dedupeWithinDisciplines();

const out = `var lecturesData = ${JSON.stringify(lecturesData, null, 2)};\n`;
fs.writeFileSync('lectures.generated.js', out, 'utf8');

const summary = Object.keys(lecturesData)
  .sort()
  .map((id) => ({ id, count: lecturesData[id].lectures.length }));

console.log('Generated lectures.generated.js');
for (const s of summary) {
  console.log(`- ${s.id}: ${s.count}`);
}
