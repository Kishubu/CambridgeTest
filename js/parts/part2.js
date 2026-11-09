export const Part2 = {
  render(container, part, answers, onChange) {
    let selectedPersonId = null;
    const newAnswers = { ...answers };
    // pré-sélectionner si déjà lié
    const linked = new Map();
    for (const p of part.people) {
      const v = answers[p.id];
      if (v) linked.set(v, p.id);
    }

    container.innerHTML = `
      <div class="part-instruction">Associez chaque personne à l'offre qui lui convient.</div>
      <div class="matching-cols">
        <div class="matching-col">
          <h4>Offres (A–E)</h4>
          ${part.offers.map(o => `
            <div class="matching-item ${linked.has(o.id) ? 'linked' : ''}" data-type="offer" data-id="${o.id}">
              <span class="matching-badge">${escapeHtml(o.label)}</span>
              <span class="matching-prompt">${escapeHtml(o.text)}</span>
              ${linked.has(o.id) ? `<span style="font-size:0.7rem;color:#14532d;margin-left:auto;">→ ${part.people.find(p=>p.id===linked.get(o.id))?.number}</span>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="matching-col">
          <h4>Personnes</h4>
          ${part.people.map(p => {
            const v = answers[p.id];
            const offer = v ? part.offers.find(o => o.id === v) : null;
            return `
            <div class="matching-item ${v ? 'selected' : ''}" data-type="person" data-id="${p.id}">
              <span class="matching-badge">${p.number}</span>
              <span class="matching-prompt">${escapeHtml(p.prompt)}</span>
              ${v ? `<span style="font-size:0.7rem;color:#1d4ed8;margin-left:auto;">→ ${escapeHtml(o.label)}</span>` : ''}
            </div>
          `;
          }).join('')}
        </div>
      </div>
      <p class="matching-hint">Cliquez sur une personne, puis sur une offre pour lier. Recliquez sur une offre liée pour délier.</p>
    `;

    container.querySelectorAll('.matching-item').forEach(el => {
      el.addEventListener('click', () => {
        const type = el.dataset.type;
        const id = el.dataset.id;
        if (type === 'person') {
          selectedPersonId = id;
          this.render(container, part, answers, onChange); // re-render pour marquer la sélection
          // marquer visuellement la personne sélectionnée
          setTimeout(() => {
            const btns = container.querySelectorAll('.matching-item[data-type="person"]');
            btns.forEach(b => b.classList.toggle('selected-person', b.dataset.id === id));
          }, 0);
        } else if (type === 'offer') {
          if (selectedPersonId) {
            // délier si l'offre est déjà liée à cette personne ?
            const current = answers[selectedPersonId];
            if (current === id) {
              delete newAnswers[selectedPersonId];
            } else {
              // vérifier si l'offre est déjà utilisée par une autre personne
              const alreadyUsed = part.people.find(p => answers[p.id] === id && p.id !== selectedPersonId);
              if (alreadyUsed) {
                // remplacer : on enlève l'ancienne association
                delete newAnswers[alreadyUsed.id];
              }
              newAnswers[selectedPersonId] = id;
            }
            onChange(newAnswers);
            this.render(container, part, newAnswers, onChange);
          }
        }
      });
    });
  }
};
function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
