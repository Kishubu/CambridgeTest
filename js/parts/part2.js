export const Part2 = {
  render(container, part, answers, onChange) {
    const linked = new Map();
    for (const p of part.people) {
      const v = answers[p.id];
      if (v) linked.set(v, p.id);
    }

    const selectedPersonId = container.dataset.selectedPersonId || null;

    const isOfferLinked = (id) => linked.has(id);
    const isPersonSelected = (id) => selectedPersonId === id;

    container.innerHTML = `
      <div class="part-instruction">Associez chaque personne à l'offre qui lui convient.</div>
      <div class="matching-cols">
        <div class="matching-col">
          <h4>Offres (A–E)</h4>
          ${part.offers.map(o => {
            const personId = linked.get(o.id);
            const person = personId ? part.people.find(p => p.id === personId) : null;
            return `
              <div class="matching-item offer-item ${isOfferLinked(o.id) ? 'linked' : ''} ${selectedPersonId ? 'dimmed' : ''}" data-type="offer" data-id="${o.id}">
                <span class="matching-badge">${escapeHtml(o.label)}</span>
                <span class="matching-prompt">${escapeHtml(o.text)}</span>
                ${person ? `<span style="font-size:0.7rem;color:#14532d;margin-left:auto;">→ ${person.number}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <div class="matching-col">
          <h4>Personnes</h4>
          ${part.people.map(p => {
            const v = answers[p.id];
            const offer = v ? part.offers.find(o => o.id === v) : null;
            return `
              <div class="matching-item person-item ${v ? 'selected' : ''} ${isPersonSelected(p.id) ? 'selected' : ''}" data-type="person" data-id="${p.id}">
                <span class="matching-badge">${p.number}</span>
                <span class="matching-prompt">${escapeHtml(p.prompt)}</span>
                ${v ? `<span style="font-size:0.7rem;color:#1d4ed8;margin-left:auto;">→ ${escapeHtml(o.label)}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <p class="matching-hint">1) Cliquez sur une personne. 2) Cliquez sur une offre pour lier. Recliquez sur l'offre liée pour délier.</p>
    `;

    container.onclick = (e) => {
      const item = e.target.closest('.matching-item');
      if (!item) return;
      e.stopPropagation();
      e.preventDefault();

      const type = item.dataset.type;
      const id = item.dataset.id;
      const currentSelected = container.dataset.selectedPersonId || null;

      if (type === 'person') {
        // Sélectionner / désélectionner la personne
        const newSelected = (currentSelected === id) ? null : id;
        if (newSelected) {
          container.dataset.selectedPersonId = newSelected;
        } else {
          delete container.dataset.selectedPersonId;
        }
        this.render(container, part, answers, onChange);
      } else if (type === 'offer') {
        if (!currentSelected) return;

        const newAnswers = { ...answers };
        const current = newAnswers[currentSelected];

        if (current === id) {
          delete newAnswers[currentSelected];
        } else {
          const alreadyUsed = part.people.find(p => answers[p.id] === id && p.id !== currentSelected);
          if (alreadyUsed) delete newAnswers[alreadyUsed.id];
          newAnswers[currentSelected] = id;
        }

        delete container.dataset.selectedPersonId;
        onChange(newAnswers);
        this.render(container, part, newAnswers, onChange);
      }
    };
  }
};

function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
