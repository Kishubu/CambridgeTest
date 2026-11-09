export const Part5 = {
  render(container, part, answers, onChange) {
    let html = '';
    for (const seg of part.segments) {
      if (seg.type === 'text') {
        html += escapeHtml(seg.text);
      } else if (seg.type === 'blank') {
        const filled = answers[seg.id];
        const opt = filled ? part.questions.find(q => q.blank_id === seg.id)?.options.find(o => o.id === filled) : null;
        html += `<span class="blank-spot ${filled ? 'filled' : 'empty'}" data-blank="${seg.id}">${filled ? escapeHtml(opt.text) : '[' + (part.questions.find(q => q.blank_id === seg.id)?.number) + ']'}</span>`;
      }
    }
    container.innerHTML = `
      <div class="part-instruction">Complétez le texte avec le meilleur mot parmi les propositions.</div>
      <div class="cloze-text">${html}</div>
    `;
    container.querySelectorAll('.blank-spot').forEach(el => {
      el.addEventListener('click', () => {
        const blankId = el.dataset.blank;
        const q = part.questions.find(q => q.blank_id === blankId);
        if (!q) return;
        const current = answers[blankId];
        let htmlOpts = `<div class="part-instruction" style="margin-top:16px;">Choisissez pour le blanc ${q.number} :</div><div class="cloze-options">`;
        htmlOpts += q.options.map(opt => `
          <button type="button" class="cloze-option ${current === opt.id ? 'selected' : ''}" data-optid="${opt.id}">
            <span class="opt-label">${escapeHtml(opt.label)}</span> ${escapeHtml(opt.text)}
          </button>
        `).join('');
        htmlOpts += `</div><button type="button" class="btn btn-outline btn-small" style="margin-top:8px;width:auto;padding:6px 12px;" id="btn-cloze-close">Fermer</button>`;
        el.innerHTML = htmlOpts;
        el.querySelectorAll('.cloze-option').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const newAnswers = { ...answers, [blankId]: btn.dataset.optid };
            onChange(newAnswers);
            this.render(container, part, newAnswers, onChange);
          });
        });
        el.querySelector('#btn-cloze-close').addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.render(container, part, answers, onChange);
        });
      });
    });
  }
};
function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
