// --- 設定パネルの開閉ロジック ---
document.addEventListener('DOMContentLoaded', function() {
  const fab = document.getElementById('settingsFab');
  const panel = document.getElementById('settingsPanel');
  if (fab && panel) {
    fab.addEventListener('click', function() {
      panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
    });
    // パネル外クリックで閉じる（FAB内部のクリックは閉じない）
    document.addEventListener('mousedown', function(e) {
      if (panel.style.display === 'block' && !panel.contains(e.target) && !fab.contains(e.target)) {
        panel.style.display = 'none';
      }
    });
  }
});

// --- 設定パネルのロジック ---
document.addEventListener('DOMContentLoaded', function() {
  const autoSaveCheckbox = document.getElementById('autoSaveToggle');
  if (autoSaveCheckbox) {
    const autoSave = localStorage.autoSaveLinks !== 'false';
    autoSaveCheckbox.checked = autoSave;
    autoSaveCheckbox.addEventListener('change', function() {
      localStorage.autoSaveLinks = autoSaveCheckbox.checked;
      if (!autoSaveCheckbox.checked) {
        localStorage.removeItem('generatedLinks');
      } else {
        if (generatedLinks.length > 0) {
          try { localStorage.generatedLinks = JSON.stringify(generatedLinks); } catch (e) { }
        }
        if (localStorage.generatedLinks) {
          try { generatedLinks = JSON.parse(localStorage.generatedLinks); } catch (e) { generatedLinks = []; }
          renderPage(currentPage);
        }
      }
    });
  }

  pageSize = 8;
  document.documentElement.style.setProperty('--page-size', String(pageSize));
});

// --- ページ切替用変数 ---
let generatedLinks = [];
let pageSize = 8;
let currentPage = 0;
let processLogAutoScroll = true;

function renderPage(pageIndex) {
  const ps = 8;
  const logList = document.getElementById('logList');
  const paginationSummary = document.getElementById('paginationSummary');
  const pageButtons = document.getElementById('pageButtons');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const totalPages = Math.max(1, Math.ceil(generatedLinks.length / ps));
  let p = Math.max(0, Math.min(pageIndex, totalPages - 1));
  currentPage = p;
  localStorage.setItem('currentPage', String(currentPage));

  const startItem = generatedLinks.length === 0 ? 0 : currentPage * ps + 1;
  const endItem = Math.min((currentPage + 1) * ps, generatedLinks.length);
  const totalItems = generatedLinks.length;
  paginationSummary.textContent = totalItems === 0
    ? '表示 0 件'
    : `表示 ${startItem} - ${endItem} / ${totalItems} 件`;

  logList.innerHTML = '';
  const start = currentPage * ps;
  const end = Math.min(start + ps, generatedLinks.length);
  for (let i = start; i < end; i++) {
    const link = generatedLinks[i];
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${link}" target="_blank">
        ${link}
      </a>
    `;
    logList.appendChild(li);
  }

  if (pageButtons) {
    pageButtons.innerHTML = '';
    const paginationWrapper = pageButtons.parentElement;
    const paginationFooter = pageButtons.closest('.pagination-footer') || paginationWrapper;
    const paginationStyle = getComputedStyle(paginationWrapper);
    const gap = parseFloat(paginationStyle.gap) || 0;
    const arrowButtonWidth = 38;
    const availableWidth = Math.max(0,
      paginationFooter.clientWidth - arrowButtonWidth * 2 - gap * 2
    );
    const buttonWidth = 36;
    const visibleCount = Math.max(1, Math.floor((availableWidth + gap) / (buttonWidth + gap)));

    let pageStart;
    if (totalPages <= visibleCount) {
      pageStart = 0;
    } else {
      const halfVisible = Math.floor(visibleCount / 2);
      pageStart = currentPage - halfVisible;
      pageStart = Math.max(0, pageStart);
      pageStart = Math.min(pageStart, totalPages - visibleCount);
    }
    const pageEnd = Math.min(totalPages, pageStart + visibleCount);

    for (let page = pageStart; page < pageEnd; page++) {
      const btn = document.createElement('button');
      btn.textContent = String(page + 1);
      btn.className = page === currentPage ? 'active' : '';
      btn.setAttribute('aria-current', page === currentPage ? 'page' : 'false');
      btn.addEventListener('click', () => renderPage(page));
      pageButtons.appendChild(btn);
    }
  }

  if (prevBtn) prevBtn.disabled = (currentPage === 0);
  if (nextBtn) nextBtn.disabled = (currentPage >= totalPages - 1);
}

document.addEventListener('DOMContentLoaded', function() {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => renderPage(currentPage + 1));
  const clearBtn = document.getElementById('clearLinksBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      generatedLinks = [];
      localStorage.removeItem('generatedLinks');
      renderPage(0);
    });
  }
  const refreshBtn = document.getElementById('refreshButton');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      refreshChannel();
    });
  }
  const processLogList = document.getElementById('processLogList');
  if (processLogList) {
    processLogAutoScroll = processLogList.scrollHeight - processLogList.scrollTop - processLogList.clientHeight <= 2;
    processLogList.addEventListener('scroll', function() {
      processLogAutoScroll = processLogList.scrollHeight - processLogList.scrollTop - processLogList.clientHeight <= 2;
    });
  }
  try {
    document.documentElement.style.setProperty('--page-size', String(pageSize));
  } catch (e) { }
  window.addEventListener('resize', function() {
    renderPage(currentPage);
  });

  document.addEventListener('keydown', function(e) {
    try {
      const active = document.activeElement;
      const tag = active && active.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable;
      if (isInput) return;
    } catch (err) { }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      renderPage(currentPage - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      renderPage(currentPage + 1);
    }
  });
});

(function() {
  const input = document.getElementById('tokens');
  const maskBtn = document.getElementById('toggleTokenMask');
  const icon = document.getElementById('maskIcon');
  let masked = true;
  if (localStorage.tokenMasked === 'false') masked = false;
  function updateMask() {
    if (masked) {
      input.type = 'password';
      icon.innerHTML = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="#4e73df" stroke-width="2" fill="#fff"/><circle cx="12" cy="12" r="3" stroke="#4e73df" stroke-width="2" fill="#4e73df"/><line x1="4" y1="4" x2="20" y2="20" stroke="#e74c3c" stroke-width="2"/>';
    } else {
      input.type = 'text';
      icon.innerHTML = '<ellipse cx="12" cy="12" rx="10" ry="7" stroke="#4e73df" stroke-width="2" fill="#fff"/><circle cx="12" cy="12" r="3" stroke="#4e73df" stroke-width="2" fill="#4e73df"/>';
    }
  }
  updateMask();
  maskBtn.addEventListener('click', function() {
    masked = !masked;
    localStorage.tokenMasked = masked;
    updateMask();
  });
})();

function restoreSavedState() {
  if (localStorage.tokens) document.getElementById('tokens').value = localStorage.tokens;
  if (localStorage.channelID) document.getElementById('channelID').value = localStorage.channelID;
  if (localStorage.linkCount) document.getElementById('linkCount').value = localStorage.linkCount;
  const autoSave = (localStorage.autoSaveLinks !== 'false');
  if (autoSave && localStorage.generatedLinks) {
    try {
      generatedLinks = JSON.parse(localStorage.generatedLinks);
    } catch (e) { generatedLinks = []; }
  }
  const savedPage = parseInt(localStorage.getItem('currentPage') || '0', 10);
  renderPage(savedPage);
  document.getElementById('stopButton').disabled = true;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreSavedState);
} else {
  restoreSavedState();
}
document.getElementById('inviteForm').addEventListener('input', () => {
  localStorage.tokens = document.getElementById('tokens').value;
  localStorage.channelID = document.getElementById('channelID').value;
  localStorage.linkCount = document.getElementById('linkCount').value;
});

let abortController;
let jobs = [];
let currentJobIndex = 0;

function appendProcessLog(msg, type = 'info') {
  const processLogList = document.getElementById('processLogList');
  if (!processLogList) return;
  const li = document.createElement('li');
  li.innerHTML = msg;
  li.classList.add(type);
  processLogList.appendChild(li);
  while (processLogList.children.length > 80) {
    processLogList.removeChild(processLogList.firstChild);
  }
  if (processLogAutoScroll) {
    processLogList.scrollTop = processLogList.scrollHeight;
  }
}

async function refreshChannel() {
  const token = document.getElementById('tokens').value.split('\n').map(t => t.trim()).filter(Boolean)[0];
  const channelID = document.getElementById('channelID').value.trim();
  const loader = document.getElementById('loader');
  const refreshBtn = document.getElementById('refreshButton');
  const startBtn = document.getElementById('startButton');
  if (!token) {
    appendProcessLog('トークンを入力してください。', 'error');
    return;
  }
  if (!channelID) {
    appendProcessLog('チャンネルIDを入力してください。', 'error');
    return;
  }
  if (refreshBtn) refreshBtn.disabled = true;
  if (startBtn) startBtn.disabled = true;
  if (loader) loader.style.display = 'block';

  try {
    appendProcessLog('チャンネル情報を取得しています...', 'info');
    let res = await fetch(`https://discord.com/api/v9/channels/${channelID}`, {
      headers: { 'Authorization': token }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `チャンネル取得に失敗しました: ${res.status}`);
    }
    const channelInfo = await res.json();
    const guildID = channelInfo.guild_id;
    if (!guildID) {
      throw new Error('このチャンネルはギルドチャンネルではありません。');
    }

    appendProcessLog('チャンネルを削除しています...', 'info');
    res = await fetch(`https://discord.com/api/v9/channels/${channelID}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `チャンネル削除に失敗しました: ${res.status}`);
    }

    appendProcessLog('新しいチャンネルを作成しています...', 'info');
    res = await fetch(`https://discord.com/api/v9/guilds/${guildID}/channels`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `invite-channel-${Date.now()}`,
        type: 0,
        topic: 'リフレッシュによって再作成されたチャンネル',
        permission_overwrites: []
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `チャンネル作成に失敗しました: ${res.status}`);
    }
    const newChannel = await res.json();

    appendProcessLog('ギルド招待情報を取得しています...', 'info');
    await fetch(`https://discord.com/api/v9/guilds/${guildID}/invites`, {
      headers: { 'Authorization': token }
    });

    generatedLinks = [];
    localStorage.removeItem('generatedLinks');
    renderPage(0);

    document.getElementById('channelID').value = newChannel.id;
    localStorage.channelID = newChannel.id;
    appendProcessLog(`新しいチャンネルを作成しました: ${newChannel.id}`, 'success');
  } catch (err) {
    appendProcessLog(err.message || 'リフレッシュに失敗しました。', 'error');
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
    if (startBtn) startBtn.disabled = false;
    if (loader) loader.style.display = 'none';
  }
}

document.getElementById('inviteForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const startBtn = document.getElementById('startButton');
  const stopBtn = document.getElementById('stopButton');
  const loader = document.getElementById('loader');

  startBtn.disabled = true;
  stopBtn.disabled = false;
  loader.style.display = 'block';

  const tokens = document.getElementById('tokens').value
                    .split('\n').map(t => t.trim()).filter(Boolean);
  const channelID = document.getElementById('channelID').value;
  const linkCount = parseInt(document.getElementById('linkCount').value, 10);

  if (
    jobs.length === 0 ||
    jobs[0].token !== tokens[0] ||
    jobs[0].channelID !== channelID ||
    jobs.length !== tokens.length * linkCount
  ) {
    jobs = [];
    tokens.forEach(token => {
      for (let i = 0; i < linkCount; i++) {
        jobs.push({ token, channelID });
      }
    });
    currentJobIndex = 0;
    localStorage.setItem('currentPage', '0');
  }

  abortController = new AbortController();
  const signal = abortController.signal;
  const logList = document.getElementById('logList');
  if (currentJobIndex >= jobs.length) {
    currentJobIndex = 0;
  }
  const processLogList = document.getElementById('processLogList');
  function addProcessLog(msg, type = 'info') {
    appendProcessLog(msg, type);
  }
  addProcessLog('処理を開始しました。', 'info');

  async function createInvite(token, channel) {
    const url = `https://discord.com/api/v9/channels/${channel}/invites`;
    const body = JSON.stringify({
      max_age: 0,
      max_uses: 0,
      temporary: false,
      flags: 0,
      target_type: null,
      unique: true
    });

    try {
      let res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body,
        signal
      });

      while (res.status === 429) {
        let wait = 0;
        if (res.headers.has('X-RateLimit-Reset-After')) {
          wait = parseFloat(res.headers.get('X-RateLimit-Reset-After')) * 1000;
        } else if (res.headers.has('Retry-After')) {
          wait = parseFloat(res.headers.get('Retry-After')) * 1000;
        } else {
          wait = 3000;
        }
        await new Promise(r => setTimeout(r, wait));
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body,
          signal
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Error ${err.code}: ${err.message}`);
      }

      const json = await res.json();
      return `https://discord.gg/${json.code}`;
    } catch (err) {
      if (err.name === 'AbortError') {
        addProcessLog('処理が中止されました。', 'error');
      } else {
        addProcessLog(`${err.message}`, 'error');
      }
      loader.style.display = 'none';
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return null;
    }
  }

  for (; currentJobIndex < jobs.length; currentJobIndex++) {
    const { token, channelID } = jobs[currentJobIndex];
    const link = await createInvite(token, channelID);
    if (!link) return;

    generatedLinks.push(link);
    renderPage(currentPage);
    addProcessLog(`招待リンクを生成しました: <span style="color:#1d3f72;">${link}</span>`, 'success');
    const autoSave = (localStorage.autoSaveLinks !== 'false');
    if (autoSave) {
      try {
        localStorage.generatedLinks = JSON.stringify(generatedLinks);
      } catch (e) { }
    }
  }

  addProcessLog('完了しました！', 'success');
  loader.style.display = 'none';
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

document.getElementById('stopButton').addEventListener('click', () => {
  if (abortController) abortController.abort();
  document.getElementById('startButton').disabled = false;
  document.getElementById('stopButton').disabled = true;
  document.getElementById('loader').style.display = 'none';
});
