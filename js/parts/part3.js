export const Part3 = {
  render(container, part, answers, onChange) {
    // Initialisation du HTML une seule fois (évite le re-render complet qui détruit
    // le DOM pendant le traitement du clic et fait perdre l'onglet actif).
    if (!container.dataset.part3Init) {
      container.innerHTML = `
        <div class="part-instruction">Lisez le texte et répondez aux questions.</div>
        <div class="reading-passage">${escapeHtml(part.passage.text || part.passage.segments.map(s => s.type === 'text' ? s.text : '').join(''))}</div>
        ${part.questions.map(q => `
          <div class="question-card">
            <div class="question-prompt">${escapeHtml(q.prompt)}</div>
            ${q.options.map(opt => `
              <button type="button" class="option-btn" data-qid="${q.id}" data-optid="${opt.id}">
                <span class="opt-label">${escapeHtml(opt.label)}</span> ${escapeHtml(opt.text)}
              </button>
            `).join('')}
          </div>
        `).join('')}
      `;
      container.dataset.part3Init = 'true';
    }

    // Délégation d'événement (recréée à chaque render pour capturer le bon `answers`,
    // mais le HTML n'est pas recréé : pas de destruction du DOM pendant le clic).
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

    // Mettre à jour uniquement les classes 'selected' sans recréer le DOM
    container.querySelectorAll('.option-btn').forEach(btn => {
      const qid = btn.dataset.qid;
      const optid = btn.dataset.optid;
      btn.classList.toggle('selected', answers[qid] === optid);
    });
  }
};
function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
