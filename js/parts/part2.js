const selectionState = new WeakMap();

export const Part2 = {
  render(container, part, answers, onChange) {
    const linked = new Map();
    for (const p of part.people) {
      const v = answers[p.id];
      if (v) linked.set(v, p.id);
    }

    const selectedPersonId = selectionState.get(container) || null;

    const isOfferLinked = (id) => linked.has(id);
    const isPersonSelected = (id) => selectedPersonId === id;

    container.innerHTML = `
      <div class="matching-cols">
        <div class="matching-col">
          <h4>Offres (A–E)</h4>
          ${part.offers?.map(o => {
            const personId = linked.get(o.id);
            const person = personId ? part.people.find(p => o.id === personId) : null;
            return `<div class="matching-item offer-item ${isOfferLinked(o.id) ? 'linked' : ''}" data-type="offer" data-id="${o.id}">
              <span class="matching-badge">${escapeHtml(o.label)}</span>
              <span class="matching-prompt">${escapeHtml(o.text)}</span>
              ${person ? `<span class="match-indicator">→ ${escapeHtml(person.number)}</span>` : ''}
            </div>`;
          }).join('') || '<p>Aucune offre</p>'}
        </div>
        <div class="matching-col">
          <h4>Personnes</h4>
          ${part.people?.map(p => {
            const v = answers[p.id];
            const offer = v ? part.offers.find(o => o.id === v) : null;
            const isSelected = v !== null && v !== '';
            return `<div class="matching-item person-item ${isSelected ? 'selected' : ''}" data-type="person" data-id="${p.id}">
              <span class="matching-badge">${p.number}</span>
              <span class="matching-prompt">${escapeHtml(p.prompt)}</span>
              ${isSelected ? `<span class="match-indicator">→ ${escapeHtml(offer.label)}</span>` : ''}
            </div>`;
          }).join('') || '<p>Aucune personne</p>'}
        </div>
      </div>
      <p class="matching-hint">1) Cliquez sur une personne. 2) Cliquez sur une offre pour lier. Recliquez sur une offre déjà liée pour la délier.</p>
    `;

    container.querySelectorAll('.matching-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const type = item.dataset.type;
        const id = item.dataset.id;
        const currentSelected = selectionState.get(container) || null;

        if (type === 'person') {
          const newSelected = (currentSelected === id) ? null : id;
          container.querySelectorAll('.matching-item').forEach(el => {
            if (el.dataset.type === 'person') el.classList.toggle('selected', el.dataset.id === newSelected);
          });
          selectionState.set(container, newSelected);
          return;
        }

        if (type === 'offer') {
          const isLinked = linked.has(id);
          const linkedPerson = isLinked ? [...linked.entries()].find(([oid]) => oid === id)?.[1] : null;

          if (isLinked) {
            // Dés-lien direct de l'offre si elle est déjà liée
            const newAnswers = { ...answers };
            delete newAnswers[linkedPerson];
            updateOfferLink(item, null);
            selectionState.delete(container);
            onChange(newAnswers);
            this.render(container, part, newAnswers, onChange);
            return;
          }

          if (!currentSelected) return; // Pas de personne sélectionnée, rien à faire

          const newAnswers = { ...answers };
          if (currentSelected === id) {
            // Lier la personne sélectionnée à l'offre : délier
            delete newAnswers[currentSelected];
            updateOfferLink(item, null);
            selectionState.delete(container);
          } else {
            // Lier la personne sélectionnée à l'offre
            newAnswers[currentSelected] = id;
            updateOfferLink(item, currentSelected);
            selectionState.delete(container);
          }
          onChange(newAnswers);
          this.render(container, part, newAnswers, onChange);
          return;
        }
      });
    });
  }
};

function updateOfferLink(offerEl, personId) {
  if (offerEl) {
    if (personId) {
      offerEl.classList.add('linked');
    } else {
      offerEl.classList.remove('linked');
    }
  }
}

function escapeHtml(t) { if (t == null) return ''; const d = document.createElement('div'); d.textContent = String(t); return d.innerHTML; }
