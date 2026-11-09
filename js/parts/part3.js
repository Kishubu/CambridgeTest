export const Part3 = {
  render(container, part, answers, onChange) {
    container.innerHTML = `
      <div class="part-instruction">Lisez le texte et répondez aux questions.</div>
      <div class="reading-passage">${escapeHtml(part.passage.text || part.passage.segments.map(s => s.type === 'text' ? s.text : '').join(''))}</div>
      ${part.questions.map(q => `
        <div class="question-card">
          <div class="question-prompt">${escapeHtml(q.prompt)}</div>
          ${q.options.map(opt => `
            <button type="button" class="option-btn ${answers[q.id] === opt.id ? 'selected' : ''}" data-qid="${q.id}" data-optid="${opt.id}">
              <span class="opt-label">${escapeHtml(opt.label)}</span> ${escapeHtml(opt.text)}
            </button>
          `).join('')}
        </div>
      `).join('')}
    `;

    // Délégation d'événement : un seul listener sur le conteneur, robuste aux re-renders.
    // stopPropagation / preventDefault évitent tout comportement parasite (ex: retour sur l'onglet 1).
    container.onclick = (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      const qid = btn.dataset.qid;
      const optid = btn.dataset.optid;
      const newAnswers = { ...answers, [qid]: optid };
      onChange(newAnswers);
      this.render(container, part, newAnswers, onChange);
    };
  }
};
function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
