export const Part6 = {
  render(container, part, answers, onChange) {
    let html = '';
    for (const seg of part.segments) {
      if (seg.type === 'text') {
        html += escapeHtml(seg.text);
      } else if (seg.type === 'blank') {
        const val = answers[seg.id] || '';
        const q = part.questions.find(q => q.blank_id === seg.id);
        html += `<input type="text" class="open-input" data-blank="${seg.id}" value="${escapeHtml(val)}" placeholder="[${q?.number}]" />`;
      }
    }
    container.innerHTML = `
      <div class="part-instruction">Complétez chaque blanc avec un mot.</div>
      <div class="cloze-text">${html}</div>
    `;
    container.querySelectorAll('.open-input').forEach(input => {
      input.addEventListener('input', (ev) => {
        const newAnswers = { ...answers, [input.dataset.blank]: ev.target.value };
        onChange(newAnswers);
      });
    });
  }
};
function escapeHtml(t){if(t==null)return'';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
