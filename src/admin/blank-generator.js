export function generateBlanks(quiz) {
  if (!quiz.rounds.length) { alert('Нет раундов для печати'); return; }
  const teamCount = quiz.settings?.teamCount || 8;
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Бланки ответов</title>
<style>
  @page { margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; }
  .blank { page-break-after: always; border: 2px solid #333; padding: 12mm; }
  .blank:last-child { page-break-after: auto; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 4mm; }
  .team-line { border-bottom: 1px solid #999; padding: 3mm 0; margin-bottom: 4mm; font-weight: bold; }
  .round { margin-bottom: 6mm; }
  .round h2 { font-size: 13pt; margin-bottom: 3mm; border-bottom: 1px solid #ccc; padding-bottom: 2mm; }
  .answer-row { display: flex; align-items: center; min-height: 9mm; border-bottom: 1px dotted #ccc; padding: 1mm 0; }
  .q-num { width: 8mm; font-weight: bold; flex-shrink: 0; }
  .q-line { flex: 1; border-bottom: 1px solid #bbb; min-height: 7mm; }
  .points { width: 12mm; text-align: center; color: #666; font-size: 10pt; flex-shrink: 0; }
</style></head><body>`;
  for (let t = 0; t < teamCount; t++) {
    html += `<div class="blank"><h1>${quiz.title || 'Квиз'}</h1>`;
    html += `<div class="team-line">Команда: ________________________________</div>`;
    quiz.rounds.forEach((round, ri) => {
      html += `<div class="round"><h2>${round.name || 'Раунд ' + (ri+1)}</h2>`;
      round.questions.forEach((q, qi) => {
        html += `<div class="answer-row"><span class="q-num">${qi+1}.</span><span class="q-line"></span><span class="points">${q.points||1} б.</span></div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
  }
  html += `</body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
