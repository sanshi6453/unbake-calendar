(() => {
  'use strict';

  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const STORAGE_KEY = 'unbake-calendar-v1';
  const AUTH_KEY = 'unbake-calendar-auth';
  const PASSCODE_KEY = 'unbake-calendar-passcode';
  const DEFAULT_LOGIN_PASSWORD = '0225';
  const TYPE_META = {
    muffin: { label: 'マフィン', title: 'スーパー sanshi', color: '#08a96f', bg: '#e8f8f1', image: './assets/muffin.png' },
    dagashi: { label: '駄菓子', title: '駄菓子販売', color: '#7960e8', bg: '#f0edff', image: './assets/dagashiya-hq.png' },
    shop: { label: 'お店', title: 'un bake', color: '#242329', bg: '#f1f0f2', image: './assets/unbake-logo-clean.png' },
    event: { label: 'イベント', title: 'イベント', color: '#e33c52', bg: '#fff0f2', icon: '★' },
    closed: { label: 'お休み', title: '休み', color: '#e33c52', bg: '#fff0f2', icon: '休' },
    other: { label: 'その他', title: '予定', color: '#3978be', bg: '#eaf3fd', icon: '•' }
  };

  const sample = {
    '2026-09': {
      notice: '7・8・9月はマフィンのお店販売はおやすみです',
      days: {
        2:[ev('muffin','スーパー sanshi','河芸')], 3:[ev('muffin','スーパー sanshi','河芸')],
        4:[ev('dagashi','駄菓子販売','')], 5:[ev('muffin','スーパー sanshi','川越')], 6:[ev('muffin','スーパー sanshi','川越')],
        8:[ev('muffin','スーパー sanshi','生桑')], 9:[ev('muffin','スーパー sanshi','生桑')], 10:[ev('dagashi','駄菓子販売','')], 11:[ev('dagashi','駄菓子販売','')],
        12:[ev('muffin','スーパー sanshi','エコー')], 13:[ev('muffin','スーパー sanshi','エコー')], 15:[ev('muffin','スーパー sanshi','桑名')],
        16:[ev('closed','休み','','','')], 17:[ev('muffin','スーパー sanshi','大矢知')], 18:[ev('muffin','スーパー sanshi','大矢知')],
        19:[ev('event','暮音祭','四日市競輪場','14:30','20:30')], 20:[ev('muffin','スーパー sanshi','明和')],
        22:[ev('event','3x3 united tsu ラウンド','四日市市民公園','11:00','')], 23:[ev('closed','休み','','','')], 24:[ev('dagashi','駄菓子販売','')],
        25:[ev('muffin','スーパー sanshi','菰野')], 26:[ev('muffin','スーパー sanshi','菰野')], 27:[ev('muffin','スーパー sanshi','菰野')],
        29:[ev('muffin','スーパー sanshi','ハンター')], 30:[ev('muffin','スーパー sanshi','ハンター'), ev('other','こども食堂','','16:00','18:00')]
      }
    }
  };

  function ev(type, name, place, start = '11:00', end = '15:00', note = '') { return { type, name, place, start, end, note, id: uid() }; }
  function uid() { return Math.random().toString(36).slice(2,9); }
  function pad(n) { return String(n).padStart(2,'0'); }
  function monthKey(date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}`; }
  function correctKnownTypos(data) {
    const events=data?.months?.['2026-09']?.days?.[22] || [];
    let changed=false;
    events.forEach(event=>{
      if(event.name==='3×3 united tsv ラウンド') { event.name='3x3 united tsu ラウンド'; changed=true; }
    });
    if(changed) localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    return data;
  }
  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.months) {
        if (!Array.isArray(saved.customTypes)) saved.customTypes = [];
        return correctKnownTypos(saved);
      }
    } catch (_) {}
    return correctKnownTypos({ months: sample, customTypes: [] });
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); }

  const now = new Date();
  const state = {
    date: new Date(now.getFullYear(), now.getMonth(), 1),
    data: loadData(), selectedDays: new Set(), editingDay: null, editingIndex: null
  };
  if (state.data.months['2026-09'] && now.getFullYear() === 2026 && now.getMonth() === 8) state.date = new Date(2026,8,1);

  const $ = (id) => document.getElementById(id);
  const loginOverlay = $('loginOverlay');
  const loginForm = $('loginForm');
  const loginPassword = $('loginPassword');
  const loginError = $('loginError');
  const currentPasscode = () => localStorage.getItem(PASSCODE_KEY) || DEFAULT_LOGIN_PASSWORD;

  function unlockCalendar() {
    document.body.classList.remove('login-locked');
    loginOverlay.hidden = true;
    loginOverlay.setAttribute('aria-hidden', 'true');
  }

  if (sessionStorage.getItem(AUTH_KEY) === '1') unlockCalendar();
  else requestAnimationFrame(() => loginPassword.focus({ preventScroll: true }));

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (loginPassword.value === currentPasscode()) {
      sessionStorage.setItem(AUTH_KEY, '1');
      loginError.textContent = '';
      unlockCalendar();
      return;
    }
    loginError.textContent = 'パスワードが違います';
    loginPassword.select();
  });

  const els = {
    calendar: $('calendar'), monthTitle: $('monthTitle'), monthEnglish: $('monthEnglish'), monthInput: $('monthInput'), notice: $('monthlyNotice'),
    backgroundColor: $('posterBackgroundColor'), backgroundValue: $('posterBackgroundValue'), monthAccentColor: $('monthAccentColor'), monthAccentValue: $('monthAccentValue'),
    eventDialog: $('eventDialog'), eventForm: $('eventForm'), datePills: $('datePills'), dateSelectArea: $('dateSelectArea'), sheetTitle: $('sheetTitle'),
    eventName: $('eventName'), eventPlace: $('eventPlace'), startTime: $('startTime'), endTime: $('endTime'), eventNote: $('eventNote'),
    existingEvents: $('existingEvents'), deleteButton: $('deleteButton'), previewDialog: $('previewDialog'), canvas: $('exportCanvas'),
    typeGrid: $('typeGrid'), customTypeOptions: $('customTypeOptions'), customTypeDialog: $('customTypeDialog'), customTypeForm: $('customTypeForm'),
    customTypeName: $('customTypeName'), customTypeColor: $('customTypeColor'), customTypeIcon: $('customTypeIcon'),
    customIconPreview: $('customIconPreview'), customIconPreviewImage: $('customIconPreviewImage'), customTypeError: $('customTypeError'),
    passcodeDialog: $('passcodeDialog'), passcodeForm: $('passcodeForm'), currentPasscodeInput: $('currentPasscode'),
    newPasscode: $('newPasscode'), confirmPasscode: $('confirmPasscode'), passcodeMessage: $('passcodeMessage')
  };

  function customTypes() { return state.data.customTypes; }
  function isCustomType(type) { return String(type).startsWith('custom-'); }
  function typeMeta(type) { return TYPE_META[type] || customTypes().find(item => item.id === type) || TYPE_META.other; }

  function renderCustomTypeOptions() {
    els.customTypeOptions.replaceChildren();
    customTypes().forEach(item => {
      const label = document.createElement('label');
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'type'; input.value = item.id;
      const span = document.createElement('span'); span.style.color = item.color;
      if (item.image) { const img = document.createElement('img'); img.src = item.image; img.alt = ''; span.append(img); }
      span.append(document.createTextNode(item.title));
      label.append(input, span); els.customTypeOptions.append(label);
    });
  }

  function currentMonthData() {
    const key = monthKey(state.date);
    if (!state.data.months[key]) state.data.months[key] = { notice: '', days: {} };
    const month=state.data.months[key];
    if (!month.backgroundColor) month.backgroundColor='#efeeec';
    if (!month.monthAccentColor) month.monthAccentColor='#ff4eb2';
    return month;
  }
  function daysInMonth() { return new Date(state.date.getFullYear(), state.date.getMonth()+1, 0).getDate(); }
  function mondayIndex(jsDay) { return (jsDay + 6) % 7; }

  function render() {
    const year = state.date.getFullYear(), month = state.date.getMonth();
    els.monthTitle.textContent = `${year}年${month+1}月`;
    els.monthEnglish.textContent = MONTHS_EN[month];
    els.monthInput.value = `${year}-${pad(month+1)}`;
    const monthData=currentMonthData();
    els.notice.value = monthData.notice || '';
    els.backgroundColor.value=monthData.backgroundColor;
    els.backgroundValue.value=monthData.backgroundColor;
    els.monthAccentColor.value=monthData.monthAccentColor;
    els.monthAccentValue.value=monthData.monthAccentColor;
    els.calendar.replaceChildren();
    const blanks = mondayIndex(new Date(year, month, 1).getDay());
    const totalDays = daysInMonth();
    const cellCount = Math.ceil((blanks + totalDays) / 7) * 7;
    for (let i=0; i<cellCount; i++) {
      if (i < blanks || i >= blanks + totalDays) {
        const empty = document.createElement('div'); empty.className = 'day empty'; empty.setAttribute('aria-hidden','true'); els.calendar.append(empty); continue;
      }
      const day = i - blanks + 1;
      const events = currentMonthData().days[day] || [];
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'day'; btn.setAttribute('role','gridcell');
      const col = i % 7; if (col === 5) btn.classList.add('saturday'); if (col === 6) btn.classList.add('sunday');
      if (year === now.getFullYear() && month === now.getMonth() && day === now.getDate()) btn.classList.add('today');
      btn.setAttribute('aria-label', `${month+1}月${day}日${events.length ? `、予定${events.length}件` : '、予定なし'}`);
      btn.innerHTML = `<span class="day-number">${day}</span>`;
      if (events.length) btn.append(makeEventChip(events[0], events.length));
      btn.addEventListener('click', () => openEditor(day, events.length ? 0 : null));
      els.calendar.append(btn);
    }
  }

  function makeEventChip(event, count) {
    const meta = typeMeta(event.type);
    const chip = document.createElement('span'); chip.className = `event-chip type-${event.type}${isCustomType(event.type) ? ' custom-event-chip' : ''}`; chip.style.setProperty('--chip-color',meta.color);
    if (meta.image) { const img = document.createElement('img'); img.src = meta.image; img.alt = ''; chip.append(img); }
    const name = event.name || meta.title;
    if (event.type === 'muffin' && /sanshi/i.test(name)) {
      const prefix = document.createElement('span'); prefix.className = 'event-prefix'; prefix.textContent = name.replace(/sanshi/i,'').trim() || 'スーパー'; chip.append(prefix);
      const strong = document.createElement('strong'); strong.className = 'brand-sanshi'; strong.textContent = 'sanshi'; chip.append(strong);
    } else {
      const strong = document.createElement('strong'); strong.textContent = event.type==='closed'?'休':name; chip.append(strong);
    }
    if (event.place) { const small = document.createElement('span'); small.className = 'event-place'; small.textContent = `(${event.place})`; chip.append(small); }
    if (event.start || event.end) { const time = document.createElement('span'); time.className = 'event-time'; time.textContent = `${event.start || ''}${event.end ? '〜'+event.end : ''}`; chip.append(time); }
    if (count > 1) { const more = document.createElement('span'); more.className = 'more-count'; more.textContent = count; chip.append(more); }
    return chip;
  }

  function renderDatePills() {
    els.datePills.replaceChildren();
    for (let d=1; d<=daysInMonth(); d++) {
      const b = document.createElement('button'); b.type='button'; b.className='date-pill'; b.textContent=d;
      if (state.selectedDays.has(d)) b.classList.add('selected');
      b.setAttribute('aria-pressed', state.selectedDays.has(d));
      b.addEventListener('click', () => { state.selectedDays.has(d) ? state.selectedDays.delete(d) : state.selectedDays.add(d); renderDatePills(); });
      els.datePills.append(b);
    }
  }

  function setType(type, forceDefaults = false) {
    const radio = document.querySelector(`input[name="type"][value="${type}"]`) || document.querySelector('input[name="type"]'); radio.checked = true;
    const meta = typeMeta(type);
    if (forceDefaults || !els.eventName.value) els.eventName.value = meta.title;
    const isClosed = type === 'closed';
    els.eventPlace.disabled = isClosed; els.startTime.disabled = isClosed; els.endTime.disabled = isClosed;
    if (isClosed) { els.eventPlace.value = ''; els.startTime.value = ''; els.endTime.value = ''; }
    else if (forceDefaults && type === 'muffin') { els.startTime.value='11:00'; els.endTime.value='15:00'; }
  }

  function openEditor(day = null, index = null) {
    state.editingDay = day; state.editingIndex = index; state.selectedDays = new Set(day ? [day] : []);
    const existing = day && index !== null ? (currentMonthData().days[day] || [])[index] : null;
    els.sheetTitle.textContent = existing ? `${state.date.getMonth()+1}月${day}日の予定` : '予定を追加';
    els.dateSelectArea.hidden = !!existing;
    els.deleteButton.hidden = !existing;
    els.eventForm.reset();
    els.startTime.value = '11:00'; els.endTime.value = '15:00';
    if (existing) {
      els.eventName.value=existing.name||''; els.eventPlace.value=existing.place||''; els.startTime.value=existing.start||''; els.endTime.value=existing.end||''; els.eventNote.value=existing.note||'';
      setType(existing.type, false);
    } else setType('muffin', true);
    renderDatePills(); renderExisting(day);
    if (!els.eventDialog.open) els.eventDialog.showModal();
  }

  function renderExisting(day) {
    els.existingEvents.replaceChildren();
    if (!day) return;
    const events = currentMonthData().days[day] || [];
    if (!events.length || (state.editingIndex !== null && events.length === 1)) return;
    const title = document.createElement('p'); title.className='existing-title'; title.textContent=`${day}日の予定`; els.existingEvents.append(title);
    events.forEach((event,index) => {
      const b=document.createElement('button'); b.type='button'; b.className='existing-item'; b.innerHTML=`<span>${escapeHtml(event.name || typeMeta(event.type).title)}${event.place ? `（${escapeHtml(event.place)}）` : ''}</span><b>編集</b>`;
      b.addEventListener('click',()=>openEditor(day,index)); els.existingEvents.append(b);
    });
    if (state.editingIndex !== null) {
      const b=document.createElement('button'); b.type='button'; b.className='existing-item'; b.innerHTML='<span>同じ日にもう1件追加する</span><b>＋追加</b>'; b.addEventListener('click',()=>openEditor(day,null)); els.existingEvents.append(b);
    }
  }
  function escapeHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function selectedType() { return document.querySelector('input[name="type"]:checked').value; }
  function buildFormEvent() {
    const type = selectedType(), meta = typeMeta(type);
    return { id: uid(), type, name: els.eventName.value.trim() || meta.title, place: els.eventPlace.value.trim(), start: els.startTime.value, end: els.endTime.value, note: els.eventNote.value.trim() };
  }

  els.eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = buildFormEvent(), month = currentMonthData();
    if (state.editingDay && state.editingIndex !== null) {
      item.id = month.days[state.editingDay][state.editingIndex].id || uid(); month.days[state.editingDay][state.editingIndex] = item;
    } else {
      if (!state.selectedDays.size) { alert('予定を入れる日を1日以上選んでください'); return; }
      state.selectedDays.forEach(day => { if (!month.days[day]) month.days[day]=[]; month.days[day].push({...item,id:uid()}); });
    }
    persist(); els.eventDialog.close(); render();
  });

  els.deleteButton.addEventListener('click', () => {
    if (state.editingDay === null || state.editingIndex === null) return;
    if (!confirm('この予定を削除しますか？')) return;
    const days=currentMonthData().days; days[state.editingDay].splice(state.editingIndex,1); if (!days[state.editingDay].length) delete days[state.editingDay];
    persist(); els.eventDialog.close(); render();
  });

  els.typeGrid.addEventListener('change', event => {
    if (event.target.matches('input[name="type"]')) setType(event.target.value, true);
  });

  let pendingCustomIcon = '';
  $('addTypeButton').addEventListener('click', () => {
    els.customTypeForm.reset(); els.customTypeColor.value = '#e33c52'; pendingCustomIcon = '';
    els.customIconPreview.hidden = true; els.customIconPreviewImage.removeAttribute('src'); els.customTypeError.textContent = '';
    els.customTypeDialog.showModal(); setTimeout(() => els.customTypeName.focus(), 50);
  });
  $('closeCustomType').addEventListener('click', () => els.customTypeDialog.close());
  els.customTypeIcon.addEventListener('change', async () => {
    const file = els.customTypeIcon.files && els.customTypeIcon.files[0];
    pendingCustomIcon = ''; els.customIconPreview.hidden = true; els.customTypeError.textContent = '';
    if (!file) return;
    try {
      pendingCustomIcon = await resizeIcon(file);
      els.customIconPreviewImage.src = pendingCustomIcon; els.customIconPreview.hidden = false;
    } catch (_) { els.customTypeError.textContent = 'この画像は読み込めませんでした'; }
  });
  els.customTypeForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = els.customTypeName.value.trim();
    if (!title) { els.customTypeError.textContent = '予定種類名を入力してください'; return; }
    const item = { id: `custom-${uid()}`, label: title, title, color: els.customTypeColor.value, bg: '#ffffff', image: pendingCustomIcon };
    customTypes().push(item); persist(); renderCustomTypeOptions(); els.customTypeDialog.close();
    setType(item.id, true);
  });

  $('passcodeButton').addEventListener('click', () => {
    els.passcodeForm.reset(); els.passcodeMessage.textContent = ''; els.passcodeMessage.classList.remove('success');
    els.passcodeDialog.showModal(); setTimeout(() => els.currentPasscodeInput.focus(), 50);
  });
  $('closePasscode').addEventListener('click', () => els.passcodeDialog.close());
  els.passcodeForm.addEventListener('submit', event => {
    event.preventDefault();
    els.passcodeMessage.classList.remove('success');
    if (els.currentPasscodeInput.value !== currentPasscode()) {
      els.passcodeMessage.textContent = '現在のパスコードが違います'; els.currentPasscodeInput.select(); return;
    }
    const next = els.newPasscode.value;
    if (!/^\d{4,8}$/.test(next)) {
      els.passcodeMessage.textContent = '新しいパスコードは4〜8桁の数字で入力してください'; els.newPasscode.select(); return;
    }
    if (next !== els.confirmPasscode.value) {
      els.passcodeMessage.textContent = '確認用のパスコードが一致しません'; els.confirmPasscode.select(); return;
    }
    localStorage.setItem(PASSCODE_KEY, next);
    els.passcodeMessage.textContent = 'パスコードを変更しました'; els.passcodeMessage.classList.add('success');
    setTimeout(() => els.passcodeDialog.close(), 700);
  });

  async function resizeIcon(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url), max = 512, scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d'); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'; context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }
  $('prevMonth').addEventListener('click',()=>changeMonth(-1)); $('nextMonth').addEventListener('click',()=>changeMonth(1));
  function changeMonth(delta) { state.date = new Date(state.date.getFullYear(), state.date.getMonth()+delta, 1); render(); }
  $('todayButton').addEventListener('click',()=>{ state.date=new Date(now.getFullYear(),now.getMonth(),1); render(); });
  $('monthPickerButton').addEventListener('click',()=>{ els.monthInput.hidden=false; try { els.monthInput.showPicker(); } catch (_) { els.monthInput.click(); } setTimeout(()=>{els.monthInput.hidden=true;},500); });
  els.monthInput.addEventListener('change',()=>{ const [y,m]=els.monthInput.value.split('-').map(Number); if(y&&m){state.date=new Date(y,m-1,1);render();} });
  $('bulkAddButton').addEventListener('click',()=>openEditor());
  els.notice.addEventListener('input',()=>{ currentMonthData().notice=els.notice.value; persist(); });
  function saveMonthColor(key,input,output){ currentMonthData()[key]=input.value; output.value=input.value; persist(); }
  els.backgroundColor.addEventListener('input',()=>saveMonthColor('backgroundColor',els.backgroundColor,els.backgroundValue));
  els.monthAccentColor.addEventListener('input',()=>saveMonthColor('monthAccentColor',els.monthAccentColor,els.monthAccentValue));

  $('helpButton').addEventListener('click',()=> $('helpDialog').showModal());
  $('closeHelp').addEventListener('click',()=> $('helpDialog').close()); $('helpOkay').addEventListener('click',()=> $('helpDialog').close());
  $('previewButton').addEventListener('click', async()=>{ await drawPoster(); els.previewDialog.showModal(); });
  $('closePreview').addEventListener('click',()=>els.previewDialog.close());
  $('downloadButton').addEventListener('click',()=>downloadCanvas());
  $('shareButton').addEventListener('click',()=>shareCanvas());

  async function loadImage(src) { return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=src; }); }
  function drawImageContain(ctx,img,x,y,w,h) {
    const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);
    const drawW=img.naturalWidth*ratio, drawH=img.naturalHeight*ratio;
    ctx.drawImage(img,x+(w-drawW)/2,y+(h-drawH)/2,drawW,drawH);
  }
  function fitText(ctx,text,maxWidth,start,min=15) { let size=start; do { ctx.font=ctx.font.replace(/\d+(?:\.\d+)?px/,`${size}px`); if(ctx.measureText(text).width<=maxWidth) break; size-=1; } while(size>min); return size; }
  function wrapLines(ctx,text,maxWidth,maxLines=2) {
    const chars=[...String(text||'')], lines=[]; let line='';
    for(const ch of chars){ const test=line+ch; if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch;if(lines.length===maxLines-1)break;}else line=test; }
    if(lines.length<maxLines&&line)lines.push(line); return lines;
  }
  function mixedTitleRuns(text,size) {
    const runs=[];
    for(const ch of String(text||'')) {
      const kind=/[A-Za-z0-9 ]/.test(ch)?'latin':'japanese';
      const last=runs[runs.length-1];
      if(last&&last.kind===kind) last.text+=ch;
      else runs.push({kind,text:ch});
    }
    return runs.map(run=>({...run,font:run.kind==='latin'?`400 ${size+2}px STHupo,sans-serif`:`900 ${size}px "Yu Gothic",sans-serif`}));
  }
  function measureMixedTitle(ctx,text,size) {
    return mixedTitleRuns(text,size).reduce((sum,run)=>{ctx.font=run.font;return sum+ctx.measureText(run.text).width;},0);
  }
  function wrapMixedTitleLines(ctx,text,maxWidth,size) {
    const lines=[]; let line='';
    for(const ch of String(text||'')) {
      const test=line+ch;
      if(line && measureMixedTitle(ctx,test,size)>maxWidth) {
        const breakAt=line.lastIndexOf(' ');
        if(breakAt>0) {
          lines.push(line.slice(0,breakAt).trim());
          line=(line.slice(breakAt+1)+ch).trimStart();
        } else {
          lines.push(line.trim()); line=ch;
        }
      } else line=test;
    }
    if(line.trim()) lines.push(line.trim());
    return lines;
  }
  function fitMixedTitleLines(ctx,text,maxWidth,maxLines,startSize,minSize) {
    let size=startSize,lines=[];
    while(size>=minSize) {
      lines=wrapMixedTitleLines(ctx,text,maxWidth,size);
      if(lines.length<=maxLines) return {lines,size};
      size-=1;
    }
    return {lines,size:minSize};
  }
  function drawMixedTitleCentered(ctx,text,centerX,y,size) {
    const runs=mixedTitleRuns(text,size).map(run=>{ctx.font=run.font;return {...run,width:ctx.measureText(run.text).width};});
    let x=centerX-runs.reduce((sum,run)=>sum+run.width,0)/2;
    ctx.textAlign='left';
    runs.forEach(run=>{ctx.font=run.font;ctx.fillText(run.text,x,y);x+=run.width;});
    ctx.textAlign='center';
  }
  function drawMixedTextCentered(ctx,text,centerX,y,japaneseFont,numberFont) {
    const parts=String(text).split(/([0-9０-９]+)/).filter(Boolean);
    const runs=parts.map(part=>{
      const font=/^[0-9０-９]+$/.test(part)?numberFont:japaneseFont;
      ctx.font=font;
      return {part,font,width:ctx.measureText(part).width};
    });
    let x=centerX-runs.reduce((sum,run)=>sum+run.width,0)/2;
    ctx.textAlign='left';
    runs.forEach(run=>{ctx.font=run.font;ctx.fillText(run.part,x,y);x+=run.width;});
  }

  async function drawPoster() {
    await document.fonts.load('32px STHupo');
    const c=els.canvas, ctx=c.getContext('2d');
    const [muffin,dagashi,logo]=await Promise.all([loadImage('./assets/muffin.png'),loadImage('./assets/dagashiya-hq.png'),loadImage('./assets/unbake-logo-clean.png')]);
    const customImages = {};
    await Promise.all(customTypes().filter(item => item.image).map(async item => { try { customImages[item.id] = await loadImage(item.image); } catch (_) {} }));
    const exportScale=c.width/1080, monthData=currentMonthData();
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);
    ctx.setTransform(exportScale,0,0,exportScale,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle=monthData.backgroundColor; ctx.fillRect(0,0,1080,c.height/exportScale);
    ctx.textAlign='left'; ctx.fillStyle='#202024'; ctx.font='400 52px STHupo, sans-serif';
    ctx.fillText('UN',54,72); ctx.fillText('BAKE',54,118); ctx.fillText('DAGASHI',54,164); ctx.fillText('IPPO',54,210);
    ctx.fillStyle='#68656b'; ctx.font='400 32px Georgia, serif'; ctx.textAlign='center'; ctx.fillText(MONTHS_EN[state.date.getMonth()],540,74);
    ctx.fillStyle=monthData.monthAccentColor; ctx.font='400 132px STHupo, sans-serif'; ctx.fillText(String(state.date.getMonth()+1),540,198);
    ctx.fillStyle='#66646a'; ctx.font='500 39px "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif'; ctx.fillText(`${state.date.getMonth()+1}月の営業日のご案内`,540,278);
    ctx.textAlign='left'; drawImageContain(ctx,muffin,802,42,72,72); ctx.fillStyle='#343137'; ctx.font='400 23px STHupo, sans-serif'; ctx.fillText('muffin・un cheese',883,74); ctx.font='500 18px "Yu Gothic",sans-serif'; ctx.fillText('焼き菓子各種販売',883,104);
    drawImageContain(ctx,dagashi,788,124,90,78); ctx.fillStyle='#e33c52'; ctx.font='800 24px "Yu Gothic",sans-serif'; ctx.fillText('水・木・金',886,154); ctx.fillText('駄菓子販売',886,188);

    const x0=54,y0=330,gridW=972,colW=gridW/7,headH=48;
    const blank=mondayIndex(new Date(state.date.getFullYear(),state.date.getMonth(),1).getDay()), total=daysInMonth();
    const rows=Math.ceil((blank+total)/7), gridBottom=1128, rowH=(gridBottom-y0-headH)/rows;
    const weekdays=['MON','TUE','WED','THU','FRI','SAT','SUN'];
    ctx.textAlign='center'; ctx.font='400 31px STHupo, sans-serif';
    weekdays.forEach((w,i)=>{ctx.fillStyle=i===5?'#3978be':i===6?'#e33c52':'#676455';ctx.fillText(w,x0+colW*i+colW/2,y0+31);});
    ctx.strokeStyle='#c8c5c1'; ctx.lineWidth=1.5;
    for(let r=0;r<=rows;r++){const y=y0+headH+r*rowH;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+gridW,y);ctx.stroke();}
    for(let i=0;i<=7;i++){const x=x0+i*colW;ctx.beginPath();ctx.moveTo(x,y0+headH);ctx.lineTo(x,gridBottom);ctx.stroke();}

    for(let day=1;day<=total;day++){
      const idx=blank+day-1,col=idx%7,row=Math.floor(idx/7),x=x0+col*colW,y=y0+headH+row*rowH;
      ctx.textAlign='left';ctx.fillStyle=col===5?'#3978be':col===6?'#e33c52':'#202024';ctx.font='400 43px STHupo, sans-serif';ctx.fillText(String(day),x+9,y+39);
      const events=currentMonthData().days[day]||[];
      if(events.length === 1) drawPosterEvent(ctx,events[0],x+3,y+2,colW-6,rowH-4,{muffin,dagashi,logo,customImages});
      else if(events.length > 1) {
        const firstH=rowH-38;
        drawPosterEvent(ctx,events[0],x+3,y+2,colW-6,firstH,{muffin,dagashi,logo,customImages},false,true);
        drawPosterEvent(ctx,events[1],x+3,y+2+firstH,colW-6,rowH-firstH-4,{muffin,dagashi,logo,customImages},true);
      }
    }
    const notice=(monthData.notice||'').trim();
    if(notice){
      ctx.fillStyle='#7960e8';ctx.font='800 26px "Yu Gothic",sans-serif';
      const lines=wrapLines(ctx,notice,820,2);
      lines.forEach((line,i)=>drawMixedTextCentered(ctx,line,540,1211+i*36,'800 26px "Yu Gothic",sans-serif','400 30px STHupo,sans-serif'));
    }
    drawImageContain(ctx,logo,455,1280,170,145);
  }

  function drawPosterEvent(ctx,event,x,y,w,h,images,secondary=false,splitPrimary=false){
    const meta=typeMeta(event.type);
    const compact=splitPrimary||h<95;
    ctx.save();
    ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    ctx.textAlign='center';

    if(secondary){
      ctx.strokeStyle=meta.color;ctx.globalAlpha=.55;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x+w-5,y);ctx.stroke();ctx.globalAlpha=1;
      ctx.fillStyle=meta.color;ctx.font='800 11px "Yu Gothic",sans-serif';fitText(ctx,event.name||meta.title,w-8,11,9);ctx.fillText(event.name||meta.title,x+w/2,y+14);
      const detail=[event.place?`(${event.place})`:'',event.start||event.end?`${event.start||''}${event.end?'〜'+event.end:''}`:''].filter(Boolean).join(' ');
      if(detail){ctx.font='400 10px STHupo,sans-serif';fitText(ctx,detail,w-8,10,8);ctx.fillText(detail,x+w/2,y+h-4);}
      ctx.restore();return;
    }

    if(event.type==='muffin'){
      const imageSize=compact?31:43;
      drawImageContain(ctx,images.muffin,x+w-imageSize-2,y+1,imageSize,imageSize);
      const name=event.name||meta.title;
      if(/sanshi/i.test(name)){
        const top=y+(compact?40:56);
        ctx.fillStyle=meta.color; ctx.font=`800 ${compact?15:20}px "Yu Gothic", sans-serif`; ctx.fillText(name.replace(/sanshi/i,'').trim()||'スーパー',x+w/2,top);
        ctx.font=`400 ${compact?24:35}px STHupo, sans-serif`; ctx.fillText('sanshi',x+w/2,top+(compact?18:27));
      } else {
        ctx.fillStyle=meta.color;ctx.font=`900 ${compact?17:22}px "Yu Gothic",sans-serif`;fitText(ctx,name,w-10,compact?17:22,12);ctx.fillText(name,x+w/2,y+(compact?59:77));
      }
      if(compact){
        const timeY=Math.min(y+90,y+h-6);
        if(event.place){ctx.fillStyle='#242329';ctx.font='800 11px "Yu Gothic",sans-serif';fitText(ctx,`(${event.place})`,w-8,11,9);ctx.fillText(`(${event.place})`,x+w/2,timeY-14);}
        if(event.start||event.end){ctx.fillStyle=meta.color;ctx.font='400 13px STHupo,sans-serif';fitText(ctx,`${event.start||''}${event.end?'〜'+event.end:''}`,w-8,13,10);ctx.fillText(`${event.start||''}${event.end?'〜'+event.end:''}`,x+w/2,timeY);}
      } else {
        let lineY=y+105;
        if(event.place){ctx.fillStyle='#242329';ctx.font='800 16px "Yu Gothic",sans-serif';ctx.fillText(`(${event.place})`,x+w/2,lineY);lineY+=19;}
        if(event.start||event.end){ctx.fillStyle=meta.color;ctx.font='400 17px STHupo,sans-serif';ctx.fillText(`${event.start||''}${event.end?'〜'+event.end:''}`,x+w/2,Math.min(y+h-3,lineY));}
      }
    } else if(event.type==='dagashi'){
      const imageW=Math.min(compact?62:98,w-10), imageH=Math.min(compact?46:74,h-8);
      drawImageContain(ctx,images.dagashi,x+(w-imageW)/2,y+(h-imageH)/2+5,imageW,imageH);
    } else if(event.type==='shop'){
      const imageSize=Math.min(compact?43:76,h-10,w-20);
      drawImageContain(ctx,images.logo,x+(w-imageSize)/2,y+(h-imageSize)/2+4,imageSize,imageSize);
    } else if(event.type==='closed'){
      const radius=compact?22:28,centerY=y+h/2+5;
      ctx.fillStyle=meta.color;ctx.beginPath();ctx.arc(x+w/2,centerY,radius,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.font=`900 ${compact?20:26}px "Yu Gothic",sans-serif`;ctx.fillText('休',x+w/2,centerY+(compact?7:9));
    } else if(isCustomType(event.type)) {
      const title=event.name||meta.title, icon=images.customImages[event.type];
      let lineY=y+(compact?48:64);
      if(icon){const size=Math.min(compact?32:48,h-(compact?42:62),w-18);drawImageContain(ctx,icon,x+(w-size)/2,y+5,size,size);lineY=y+size+(compact?18:26);}
      ctx.fillStyle=meta.color;ctx.font=`900 ${compact?13:17}px "Yu Gothic",sans-serif`;fitText(ctx,title,w-10,compact?13:17,10);ctx.fillText(title,x+w/2,lineY);
      lineY+=compact?15:21;
      if(event.place){ctx.fillStyle='#242329';ctx.font='700 13px "Yu Gothic",sans-serif';fitText(ctx,`(${event.place})`,w-8,13,9);ctx.fillText(`(${event.place})`,x+w/2,lineY);lineY+=16;}
      if(event.start||event.end){ctx.fillStyle=meta.color;ctx.font='400 15px STHupo,sans-serif';fitText(ctx,`${event.start||''}${event.end?'〜'+event.end:''}`,w-8,15,10);ctx.fillText(`${event.start||''}${event.end?'〜'+event.end:''}`,x+w/2,Math.min(y+h-4,lineY));}
    } else {
      const title=event.name||meta.title;
      ctx.fillStyle=meta.color;
      const is3x3=/^3[x×]3\s+united\s+tsu\s+ラウンド$/i.test(title.trim());
      let lineY;
      if(is3x3&&!compact){
        ctx.font='400 22px STHupo,sans-serif';ctx.fillText('3x3',x+w/2,y+54);
        ctx.font='400 17px STHupo,sans-serif';fitText(ctx,'united tsu',w-12,17,14);ctx.fillText('united tsu',x+w/2,y+73);
        ctx.font='900 14px "Yu Gothic",sans-serif';ctx.fillText('ラウンド',x+w/2,y+91);
        lineY=y+108;
      } else {
        const fitted=fitMixedTitleLines(ctx,title,w-10,3,compact?13:16,10);
        const lines=fitted.lines,lineGap=fitted.size+4;
        lineY=y+(lines.length>1?52:66);
        lines.forEach((line,i)=>drawMixedTitleCentered(ctx,line,x+w/2,lineY+i*lineGap,fitted.size));
        lineY+=lines.length*lineGap;
      }
      if(event.place){ctx.fillStyle='#242329';ctx.font='700 14px "Yu Gothic",sans-serif';ctx.fillText(`(${event.place})`,x+w/2,lineY);lineY+=18;}
      if(event.start||event.end){ctx.fillStyle=meta.color;ctx.font='400 16px STHupo,sans-serif';ctx.fillText(`${event.start||''}${event.end?'〜'+event.end:''}`,x+w/2,Math.min(y+h-4,lineY));}
    }
    ctx.restore();
  }

  function canvasBlob() { return new Promise(resolve=>els.canvas.toBlob(resolve,'image/png')); }
  async function downloadCanvas() { const blob=await canvasBlob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`unbake_${monthKey(state.date)}_calendar.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
  async function shareCanvas() {
    const blob=await canvasBlob(),file=new File([blob],`unbake_${monthKey(state.date)}_calendar.png`,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:`${state.date.getMonth()+1}月の営業カレンダー`});}catch(_){} }
    else downloadCanvas();
  }
  renderCustomTypeOptions();
  render();
})();
