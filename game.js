(() => {
  const game = document.querySelector('#uno-game');
  if (!game) return;
  const colors = ['red', 'yellow', 'green', 'blue'];
  const labels = { red: 'Красный', yellow: 'Жёлтый', green: 'Зелёный', blue: 'Синий', skip: '⏭', reverse: '🔄', draw2: '+2', wild: '🌈', wild4: '+4' };
  let deck = [], discard = [], hands = [[], [], [], []], current = 0, direction = 1, activeColor = 'red', pendingWild = null, locked = false, finished = false;
  game.innerHTML = `<div class="uno-shell"><div class="uno-top"><div><h2>🎴 Игра UNO</h2><p>Ты играешь против трёх весёлых соперников</p></div><button class="uno-new" id="uno-new" type="button">🔄 Новая</button></div><div class="uno-cpus" id="uno-cpus"></div><div class="uno-table"><button class="uno-deck" id="uno-deck" type="button">🃏<br>ВЗЯТЬ<br>КАРТУ</button><div id="uno-discard"></div></div><div class="uno-status" id="uno-status"></div><div class="uno-color-picker" id="uno-colors" hidden><button class="red" data-color="red" aria-label="Красный"></button><button class="yellow" data-color="yellow" aria-label="Жёлтый"></button><button class="green" data-color="green" aria-label="Зелёный"></button><button class="blue" data-color="blue" aria-label="Синий"></button></div><div class="uno-user"><div class="uno-user-head"><span>🙂 <b>Ты</b> · карт: <b id="uno-count">0</b></span><span class="uno-user-actions"><button id="uno-say" type="button">📣 UNO!</button><button id="uno-pass" type="button">Готово</button><button class="uno-fullscreen" id="uno-fullscreen" type="button" aria-label="Развернуть игру" title="Развернуть игру">⛶</button></span></div><div class="uno-hand" id="uno-hand"></div></div></div>`;
  const $ = id => game.querySelector(id);
  const cardText = card => card.kind === 'number' ? String(card.value) : labels[card.kind];
  const cardClass = card => card.kind === 'wild' || card.kind === 'wild4' ? 'wild' : card.color;
  function buildDeck() { const out = []; colors.forEach(color => { out.push({ color, kind: 'number', value: 0 }); for (let n = 1; n <= 9; n++) out.push({ color, kind: 'number', value: n }, { color, kind: 'number', value: n }); ['skip', 'reverse', 'draw2'].forEach(kind => out.push({ color, kind }, { color, kind })); }); for (let i = 0; i < 4; i++) out.push({ kind: 'wild' }, { kind: 'wild4' }); return out.sort(() => Math.random() - .5); }
  function draw(player, count = 1) { while (count--) { if (!deck.length) { const top = discard.pop(); deck = discard.splice(0).sort(() => Math.random() - .5); discard = [top]; } hands[player].push(deck.pop()); } }
  function top() { return discard[discard.length - 1]; }
  function valid(card, player) { if (card.kind === 'wild') return true; if (card.kind === 'wild4') return !hands[player].some(item => item.color === activeColor); return card.color === activeColor || (card.kind === top().kind && card.value === top().value) || (card.kind !== 'number' && card.kind === top().kind); }
  function next(steps = 1) { current = (current + direction * steps + 4 * 10) % 4; }
  function status(text) { $('#uno-status').textContent = text; }
  function renderCard(card, disabled = false) { return `<button class="uno-card ${cardClass(card)}" ${disabled ? 'disabled' : ''} data-card="${card.id}"><span>${cardText(card)}</span></button>`; }
  function render() { const cpuPlayers = [['🐱','Миша'],['🐶','Боб'],['🦊','Лиса']]; $('#uno-cpus').innerHTML = cpuPlayers.map(([avatar,name], i) => `<div class="uno-player ${current === i + 1 ? 'active' : ''}"><span class="uno-avatar">${avatar}</span>${name}<b>${hands[i + 1].length} карт</b></div>`).join(''); $('#uno-discard').innerHTML = renderCard(top(), true); $('#uno-count').textContent = hands[0].length; const yours = current === 0 && !locked && !finished && !pendingWild; $('#uno-hand').innerHTML = hands[0].map(card => renderCard(card, !yours || !valid(card, 0))).join(''); $('#uno-hand').querySelectorAll('[data-card]').forEach(button => button.onclick = () => playUser(button.dataset.card)); $('#uno-deck').disabled = current !== 0 || locked || finished || pendingWild; $('#uno-pass').disabled = current !== 0 || locked || finished || pendingWild; $('#uno-say').disabled = hands[0].length !== 1 || finished; }
  function deal() { deck = buildDeck().map((card, id) => ({ ...card, id: String(id) })); discard = []; hands = [[], [], [], []]; current = 0; direction = 1; pendingWild = null; locked = false; finished = false; for (let p = 0; p < 4; p++) draw(p, 7); let first = deck.pop(); while (first.kind === 'wild4') { deck.unshift(first); first = deck.pop(); } discard.push(first); activeColor = first.color || colors[Math.floor(Math.random() * 4)]; if (first.kind === 'skip') next(); if (first.kind === 'reverse') direction = -1; if (first.kind === 'draw2') { draw(1, 2); next(2); } status(`Твой ход! Выбери карту цвета: ${labels[activeColor]}.`); render(); }
  function finish(player) { finished = true; status(player === 0 ? '🎉 Ты победил! Отличная игра!' : `Победил ${player === 1 ? '🐱 Миша' : player === 2 ? '🐶 Боб' : '🦊 Лиса'}. Попробуешь ещё раз?`); render(); }
  function afterPlay(player, card) { discard.push(card); if (card.color) activeColor = card.color; if (hands[player].length === 1) status(player === 0 ? 'UNO! У вас осталась одна карта.' : `UNO у ${player === 1 ? 'Компьютера 1' : player === 2 ? 'Компьютера 2' : 'Компьютера 3'}!`); if (!hands[player].length) return finish(player); if (card.kind === 'wild' || card.kind === 'wild4') { if (player === 0) { pendingWild = card; $('#uno-colors').hidden = false; render(); return; } activeColor = chooseColor(player); } applyEffect(card); }
  function applyEffect(card) {
    if (card.kind === 'reverse') { direction *= -1; next(); }
    else if (card.kind === 'skip') next(2);
    else if (card.kind === 'draw2' || card.kind === 'wild4') { next(); draw(current, card.kind === 'draw2' ? 2 : 4); next(); }
    else next();
    pendingWild = null;
    $('#uno-colors').hidden = true;
    render();
    if (current !== 0) setTimeout(cpuTurn, 650);
    else status(`Ваш ход. Текущий цвет: ${labels[activeColor]}.`);
  }
  function chooseColor(player) { const count = Object.fromEntries(colors.map(color => [color, 0])); hands[player].forEach(card => { if (card.color) count[card.color]++; }); return colors.sort((a, b) => count[b] - count[a])[0]; }
  function playUser(id) { if (current !== 0 || locked || finished || pendingWild) return; const index = hands[0].findIndex(card => card.id === id); const card = hands[0][index]; if (!valid(card, 0)) return status('Эту карту сейчас нельзя сыграть.'); hands[0].splice(index, 1); afterPlay(0, card); }
  function cpuTurn() { if (finished || current === 0) return; locked = true; const player = current; const name = player === 1 ? '🐱 Миша' : player === 2 ? '🐶 Боб' : '🦊 Лиса'; const card = hands[player].find(item => valid(item, player)); if (!card) { draw(player); status(`${name} берёт карту.`); locked = false; next(); render(); return setTimeout(cpuTurn, 650); } hands[player].splice(hands[player].indexOf(card), 1); status(`${name} сыграл карту ${cardText(card)}.`); locked = false; afterPlay(player, card); }
  $('#uno-deck').onclick = () => { if (current !== 0 || locked || finished) return; draw(0); status('Вы взяли карту. Можно сыграть её, если она подходит, или нажать «Пас».'); render(); };
  $('#uno-pass').onclick = () => { if (current !== 0 || locked || finished) return; next(); render(); setTimeout(cpuTurn, 500); };
  $('#uno-say').onclick = () => { if (hands[0].length === 1) status('UNO! Отлично, вы предупредили соперников.'); };
  $('#uno-new').onclick = deal;
  $('#uno-fullscreen').onclick = async () => { const shell = game.querySelector('.uno-shell'); const toggleFocus = () => { game.classList.toggle('uno-focus'); $('#uno-fullscreen').textContent = game.classList.contains('uno-focus') ? '×' : '⛶'; }; try { if (document.fullscreenElement) await document.exitFullscreen(); else if (shell.requestFullscreen) await shell.requestFullscreen(); else toggleFocus(); } catch { toggleFocus(); } };
  $('#uno-colors').querySelectorAll('button').forEach(button => button.onclick = () => { if (!pendingWild) return; activeColor = button.dataset.color; applyEffect(pendingWild); });
  const courseTab = document.querySelector('#course-tab');
  const gameTab = document.querySelector('#game-tab');
  const courseView = document.querySelector('#course-view');
  courseTab.onclick = () => { courseView.hidden = false; game.hidden = true; courseTab.classList.add('active'); gameTab.classList.remove('active'); };
  gameTab.onclick = () => { courseView.hidden = true; game.hidden = false; gameTab.classList.add('active'); courseTab.classList.remove('active'); game.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  deal();
})();
