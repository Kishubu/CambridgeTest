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
      <div class="part-instruction">Associez chaque personne à l'offre qui lui convient.</div>
      <div class="matching-cols">
        <div class="matching-col">
          <h4>Offres (A–E)</h4>
          ${part.offers.map(o => {
            const personId = linked.get(o.id);
            const person = personId ? part.people.find(p => p.id === personId) : null;
            return `
              <div class="matching-item offer-item ${isOfferLinked(o.id) ? 'linked' : ''}" data-type="offer" data-id="${o.id}">
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

    // Mise à jour directe des classes sans re-render complet
    const updateOfferLink = (offerId, personId) => {
      const offerEl = container.querySelector(`.offer-item[data-id="${offerId}"]`);
      if (offerEl) {
        if (personId) {
          offerEl.classList.add('linked');
          const personEl = container.querySelector(`.person-item[data-id="${personId}"]`);
          if (personEl) personEl.classList.add('selected');
        } else {
          offerEl.classList.remove('linked');
        }
      }
    };

    container.querySelectorAll('.matching-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const type = item.dataset.type;
        const id = item.dataset.id;
        const currentSelected = selectionState.get(container) || null;

        if (type === 'person') {
          const newSelected = (currentSelected === id) ? null : id;
          // Mise à jour visuelle immédiate
          container.querySelectorAll('.person-item').forEach(p => p.classList.remove('selected'));
          if (newSelected) {
            selectionState.set(container, newSelected);
            item.classList.add('selected');
          } else {
            selectionState.delete(container);
          }
          return;
        }

        if (type === 'offer') {
          const newAnswers = { ...answers };
          const isLinked = linked.has(id);
          const linkedPerson = isLinked ? [...linked.entries()].find(([oid]) => oid === id)?.[1] : null;

          // Reclic sur une offre liee sans personne selectionnee : delier directement
          if (isLinked && !currentSelected) {
            delete newAnswers[linkedPerson];
            updateOfferLink(id, null);
            const personEl = container.querySelector(`.person-item[data-id="${linkedPerson}"]`);
            if (personEl) personEl.classList.remove('selected');
            onChange(newAnswers);
            return;
          }

          if (!currentSelected) return;

          const current = newAnswers[currentSelected];

          if (current === id) {
            // Délier
            delete newAnswers[currentSelected];
            updateOfferLink(id, null);
            selectionState.delete(container);
          } else {
            // Lier : retirer l'ancienne association de cette offre si elle existe
            const alreadyUsed = part.people.find(p => answers[p.id] === id && p.id !== currentSelected);
            if (alreadyUsed) {
              delete newAnswers[alreadyUsed.id];
              updateOfferLink(id, null);
              const personEl = container.querySelector(`.person-item[data-id="${alreadyUsed.id}"]`);
              if (personEl) personEl.classList.remove('selected');
            }
            newAnswers[currentSelected] = id;
            updateOfferLink(id, currentSelected);
            selectionState.delete(container);
          }

          onChange(newAnswers);
          return;
        }
      });
    });
  }
};

function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
