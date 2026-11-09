export const Part4 = {
  render(container, part, answers, onChange) {
    // Construire le texte avec les blancs
    let html = '';
    for (const seg of part.segments) {
      if (seg.type === 'text') {
        html += escapeHtml(seg.text);
      } else if (seg.type === 'blank') {
        const filled = answers[seg.id];
        const opt = filled ? part.sharedOptions.find(o => o.id === filled) : null;
        html += `<span class="blank-spot ${filled ? 'filled' : 'empty'}" data-blank="${seg.id}">${filled ? escapeHtml(opt.text) : '[' + seg.number + ']'}</span>`;
      }
    }
    const usedIds = Object.values(answers).filter(Boolean);
    container.innerHTML = `
      <div class="part-instruction">Replacer les phrases manquantes dans le texte.</div>
      <div class="cloze-text">${html}</div>
      <div class="part-instruction" style="margin-top:10px;">Phrases disponibles :</div>
      <div class="cloze-options">
        ${part.sharedOptions.map(o => `
          <button type="button" class="cloze-option ${usedIds.includes(o.id) ? 'used' : ''} ${answers[Object.keys(answers).find(k => answers[k]===o.id)] ? 'selected' : ''}" data-optid="${o.id}">
            <span class="opt-label">${escapeHtml(o.label)}</span> ${escapeHtml(o.text)}
          </button>
        `).join('')}
      </div>
    `;

    let selectedBlankId = null;
    container.querySelectorAll('.blank-spot').forEach(el => {
      el.addEventListener('click', () => {
        selectedBlankId = el.dataset.blank;
        container.querySelectorAll('.blank-spot').forEach(e => e.classList.toggle('active-blank', e.dataset.blank === selectedBlankId));
      });
    });
    container.querySelectorAll('.cloze-option').forEach(btn => {
      if (btn.classList.contains('used')) return;
      btn.addEventListener('click', () => {
        if (!selectedBlankId) return;
        const newAnswers = { ...answers, [selectedBlankId]: btn.dataset.optid };
        onChange(newAnswers);
        this.render(container, part, newAnswers, onChange);
      });
    });
  }
};
function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
