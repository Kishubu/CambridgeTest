export class ExamData {
  static async load() {
    const res = await fetch('cambridge_b1_pet_tests_by_series.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Impossible de charger la base de données.');
    return res.json();
  }

  static pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Préfixe une clé de réponse pour éviter les collisions entre parties
  static key(partId, id) {
    return `p${partId}_${id}`;
  }

  static buildSession(data) {
    const series = {};
    for (const s of data.series) {
      series[s.id] = s;
    }

    const answers = {};
    const parts = [];

    // ---------- Partie 1 : 5 questions aléatoires depuis series-1 ----------
    {
      const s1 = series['series-1'];
      const allQuestions = [];
      for (const test of s1.tests) {
        for (const q of test.content.questions) {
          allQuestions.push({ ...q, __sourceTestId: test.id, __sourceIndex: q.number - 1 });
        }
      }
      const picked = this.shuffle(allQuestions).slice(0, 5);
      picked.sort((a, b) => a.number - b.number);
      for (const q of picked) {
        answers[this.key(1, q.id)] = null;
      }
      parts.push({
        id: 1,
        title: 'Part 1 — Multiple Choice',
        taskType: 'short_messages',
        questions: picked,
        answerKey: s1.tests[0].answer_key,
        getCorrectAnswer: (q) => {
          const test = s1.tests.find(t => t.id === q.__sourceTestId);
          return test.answer_key.correct_options[q.__sourceIndex];
        }
      });
    }

    // ---------- Partie 2 : 1 test aléatoire de series-2 (matching) ----------
    {
      const s2 = series['series-2'];
      const test = this.pickRandom(s2.tests);
      const offers = test.content.sections.find(sec => sec.id === 'offers').items;
      const people = test.content.sections.find(sec => sec.id === 'people').items;
      const matches = test.answer_key.matches;
      for (const p of people) {
        answers[this.key(2, p.id)] = null;
      }
      parts.push({
        id: 2,
        title: 'Part 2 — Matching',
        taskType: 'matching',
        test,
        offers,
        people,
        matches,
        answerKey: test.answer_key,
        getCorrectAnswer: (personId) => {
          const m = matches.find(m => m.people_id === personId);
          return m ? m.offer_id : null;
        }
      });
    }

    // ---------- Partie 3 : 1 test aléatoire de series-3 (reading) ----------
    {
      const s3 = series['series-3'];
      const test = this.pickRandom(s3.tests);
      const questions = test.content.questions;
      for (const q of questions) {
        answers[this.key(3, q.id)] = null;
      }
      parts.push({
        id: 3,
        title: 'Part 3 — Reading',
        taskType: 'reading_comprehension',
        test,
        passage: test.content.passage,
        questions,
        answerKey: test.answer_key,
        getCorrectAnswer: (q) => test.answer_key.correct_options[q.number - 1]
      });
    }

    // ---------- Partie 4 : 1 test aléatoire de series-4 (sentence insertion) ----------
    {
      const s4 = series['series-4'];
      const test = this.pickRandom(s4.tests);
      const segments = test.content.passage.segments;
      const sharedOptions = test.content.shared_options;
      const questions = test.content.questions;
      for (const q of questions) {
        answers[this.key(4, q.blank_id)] = null;
      }
      parts.push({
        id: 4,
        title: 'Part 4 — Sentence Insertion',
        taskType: 'sentence_insertion',
        test,
        segments,
        sharedOptions,
        questions,
        answerKey: test.answer_key,
        getCorrectAnswer: (q) => test.answer_key.correct_options[q.number - 1]
      });
    }

    // ---------- Partie 5 : 1 test aléatoire de series-5 (multiple choice cloze) ----------
    {
      const s5 = series['series-5'];
      const test = this.pickRandom(s5.tests);
      const segments = test.content.passage.segments;
      const questions = test.content.questions;
      for (const q of questions) {
        answers[this.key(5, q.blank_id)] = null;
      }
      parts.push({
        id: 5,
        title: 'Part 5 — Multiple Choice Cloze',
        taskType: 'multiple_choice_cloze',
        test,
        segments,
        questions,
        answerKey: test.answer_key,
        getCorrectAnswer: (q) => test.answer_key.correct_options[q.number - 1]
      });
    }

    // ---------- Partie 6 : 1 test aléatoire de series-6 (open cloze) ----------
    {
      const s6 = series['series-6'];
      const test = this.pickRandom(s6.tests);
      const segments = test.content.passage.segments;
      const questions = test.content.questions;
      for (const q of questions) {
        answers[this.key(6, q.blank_id)] = null;
      }
      parts.push({
        id: 6,
        title: 'Part 6 — Open Cloze',
        taskType: 'open_cloze',
        test,
        segments,
        questions,
        answerKey: test.answer_key,
        getCorrectAnswer: (q) => test.answer_key.accepted_answers[q.number - 1]
      });
    }

    return { parts, answers, status: 'in_progress', startedAt: Date.now() };
  }
}
