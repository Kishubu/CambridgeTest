import { ExamData } from './exam.js';

export function scoreSession(session) {
  const results = { parts: [], total: 0, maxTotal: 0, answered: 0, correct: 0, incorrect: 0, unanswered: 0 };

  for (const part of session.parts) {
    let partScore = 0;
    let partMax = 0;
    let partCorrect = 0;
    let partIncorrect = 0;
    let partUnanswered = 0;
    const detail = [];

    const getAns = (id) => session.answers[ExamData.key(part.id, id)];

    if (part.id === 1) {
      partMax = part.questions.length;
      for (const q of part.questions) {
        const userAns = getAns(q.id);
        const correctLabel = part.getCorrectAnswer(q);
        const correctOpt = q.options.find(o => o.label === correctLabel);
        const correctOptId = correctOpt ? correctOpt.id : null;
        const isCorrect = userAns === correctOptId;
        if (isCorrect) { partScore++; partCorrect++; } else if (userAns === null) { partUnanswered++; } else { partIncorrect++; }
        detail.push({ id: q.id, type: 'mc', prompt: q.prompt, userAns, correct: correctLabel, isCorrect,
          userText: userAns ? q.options.find(o => o.id === userAns)?.text : null,
          correctText: correctOpt ? correctOpt.text : null });
      }
    } else if (part.id === 2) {
      partMax = part.people.length;
      for (const person of part.people) {
        const userOffer = getAns(person.id);
        const correctOffer = part.getCorrectAnswer(person.id);
        const isCorrect = userOffer === correctOffer;
        if (isCorrect) { partScore++; partCorrect++; } else if (userOffer === null) { partUnanswered++; } else { partIncorrect++; }
        const offer = part.offers.find(o => o.id === userOffer);
        const correctOfferObj = part.offers.find(o => o.id === correctOffer);
        detail.push({ id: person.id, type: 'matching', prompt: person.prompt, userAns: userOffer, correct: correctOffer, isCorrect,
          userText: offer ? offer.text : null, correctText: correctOfferObj ? correctOfferObj.text : null });
      }
    } else if (part.id === 3) {
      partMax = part.questions.length;
      for (const q of part.questions) {
        const userAns = getAns(q.id);
        const correctLabel = part.getCorrectAnswer(q);
        const correctOpt = q.options.find(o => o.label === correctLabel);
        const correctOptId = correctOpt ? correctOpt.id : null;
        const isCorrect = userAns === correctOptId;
        if (isCorrect) { partScore++; partCorrect++; } else if (userAns === null) { partUnanswered++; } else { partIncorrect++; }
        detail.push({ id: q.id, type: 'mc', prompt: q.prompt, userAns, correct: correctLabel, isCorrect,
          userText: userAns ? q.options.find(o => o.id === userAns)?.text : null,
          correctText: correctOpt ? correctOpt.text : null });
      }
    } else if (part.id === 4) {
      partMax = part.questions.length;
      for (const q of part.questions) {
        const userOptId = getAns(q.blank_id);
        const correctLabel = part.getCorrectAnswer(q);
        const correctOpt = part.sharedOptions.find(o => o.label === correctLabel);
        const isCorrect = userOptId === (correctOpt ? correctOpt.id : null);
        if (isCorrect) { partScore++; partCorrect++; } else if (userOptId === null) { partUnanswered++; } else { partIncorrect++; }
        const userOpt = part.sharedOptions.find(o => o.id === userOptId);
        detail.push({ id: q.blank_id, type: 'insertion', prompt: `Blank ${q.number}`, userAns: userOptId, correct: correctLabel, isCorrect,
          userText: userOpt ? userOpt.text : null, correctText: correctOpt ? correctOpt.text : null });
      }
    } else if (part.id === 5) {
      partMax = part.questions.length;
      for (const q of part.questions) {
        const userOptId = getAns(q.blank_id);
        const correctLabel = part.getCorrectAnswer(q);
        const correctOpt = q.options.find(o => o.label === correctLabel);
        const isCorrect = userOptId === (correctOpt ? correctOpt.id : null);
        if (isCorrect) { partScore++; partCorrect++; } else if (userOptId === null) { partUnanswered++; } else { partIncorrect++; }
        const userOpt = q.options.find(o => o.id === userOptId);
        detail.push({ id: q.blank_id, type: 'cloze', prompt: `Blank ${q.number}`, userAns: userOptId, correct: correctLabel, isCorrect,
          userText: userOpt ? userOpt.text : null, correctText: correctOpt ? correctOpt.text : null });
      }
    } else if (part.id === 6) {
      partMax = part.questions.length;
      for (const q of part.questions) {
        const userAns = (getAns(q.blank_id) || '').toLowerCase().trim();
        const acceptedRaw = part.answerKey.accepted_answers[q.number - 1];
        const acceptedVariants = acceptedRaw.split(' ou ').map(v => v.toLowerCase().trim());
        const isCorrect = acceptedVariants.includes(userAns);
        if (isCorrect) { partScore++; partCorrect++; } else if (userAns === '') { partUnanswered++; } else { partIncorrect++; }
        detail.push({ id: q.blank_id, type: 'open', prompt: `Blank ${q.number}`, userAns: getAns(q.blank_id) || '', correct: acceptedRaw, isCorrect,
          userText: getAns(q.blank_id) || null, correctText: acceptedRaw });
      }
    }

    results.parts.push({ id: part.id, title: part.title, score: partScore, max: partMax, correct: partCorrect, incorrect: partIncorrect, unanswered: partUnanswered, detail });
    results.total += partScore;
    results.maxTotal += partMax;
    results.correct += partCorrect;
    results.incorrect += partIncorrect;
    results.unanswered += partUnanswered;
    results.answered += (partCorrect + partIncorrect);
  }

  results.pct = results.maxTotal > 0 ? Math.round((results.total / results.maxTotal) * 100) : 0;
  return results;
}
