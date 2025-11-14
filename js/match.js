import {
  STORAGE_KEYS,
  ensureMatchSeedData,
  profileMap,
  safeRead,
  safeWrite
} from './match-data.js';

ensureMatchSeedData();

const layout = document.querySelector('[data-chat-layout]');
const listEl = document.querySelector('[data-conversations]');
const emptyListEl = document.querySelector('[data-empty-list]');
const searchInput = document.querySelector('[data-search]');
const threadEl = document.querySelector('[data-thread]');
const messagesEl = document.querySelector('[data-messages]');
const composerForm = document.querySelector('[data-composer]');
const composerInput = document.querySelector('[data-input]');
const backButton = document.querySelector('[data-back]');
const threadNameEl = document.querySelector('[data-thread-name]');
const threadStatusEl = document.querySelector('[data-thread-status]');
const startCallButton = document.querySelector('[data-start-call]');
const profileSheet = document.querySelector('[data-sheet]');
const sheetNameEl = document.querySelector('[data-sheet-name]');
const sheetSubtitleEl = document.querySelector('[data-sheet-subtitle]');
const sheetBodyEl = document.querySelector('[data-sheet-body]');
const statsNodes = {
  total: document.querySelector('[data-stat="conversations"]'),
  unread: document.querySelector('[data-stat="unread"]'),
  last: document.querySelector('[data-stat="last"]')
};
const SEARCH_DEBOUNCE = 220;

const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

let matches = safeRead(STORAGE_KEYS.matches) || [];
let conversations = safeRead(STORAGE_KEYS.conversations) || {};
let activeConversationId = null;
let searchTimer = null;

renderConversationList();
if (window.lucide) window.lucide.createIcons();

searchInput?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    renderConversationList(searchInput.value);
  }, SEARCH_DEBOUNCE);
});

backButton?.addEventListener('click', () => {
  activeConversationId = null;
  layout?.setAttribute('data-view', 'list');
  location.hash = '';
  updateCallButtonState();
});

composerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!activeConversationId) return;
  const text = composerInput.value.trim();
  if (!text) return;
  appendMessage(activeConversationId, {
    id: crypto.randomUUID(),
    from: 'me',
    text,
    at: new Date().toISOString(),
    read: true
  });
  composerInput.value = '';
  autoSizeComposer();
});

composerInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    composerForm?.requestSubmit();
  }
});
composerInput?.addEventListener('input', autoSizeComposer);
autoSizeComposer();
updateCallButtonState();

threadEl?.querySelector('[data-open-profile]')?.addEventListener('click', () => {
  if (!activeConversationId) return;
  openProfileSheet(activeConversationId);
});

document.querySelector('[data-sheet-close]')?.addEventListener('click', closeProfileSheet);
profileSheet?.addEventListener('click', (event) => {
  if (event.target === profileSheet) closeProfileSheet();
});

startCallButton?.addEventListener('click', () => {
  if (!activeConversationId) return;
  openVideoCall(activeConversationId);
});

window.addEventListener('hashchange', syncFromHash);
window.addEventListener('storage', handleStorageSync);
syncFromHash();

function renderConversationList(query = '') {
  if (!listEl) return;
  const normalizedQuery = query.trim().toLowerCase();
  const sorted = [...matches].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const filtered = normalizedQuery
    ? sorted.filter((match) => match.name.toLowerCase().includes(normalizedQuery))
    : sorted;

  listEl.innerHTML = '';

  filtered.forEach((match) => {
    const profile = profileMap.get(match.profileId);
    const li = document.createElement('li');
    li.className = 'conversation';
    li.dataset.active = match.profileId === activeConversationId ? 'true' : 'false';
    li.tabIndex = 0;

    const avatar = document.createElement('div');
    avatar.className = 'conversation__avatar';
    if (match.photo) {
      avatar.style.backgroundImage = `url('${match.photo}')`;
    }
    avatar.textContent = getInitials(match.name);

    const meta = document.createElement('div');
    meta.className = 'conversation__meta';

    const head = document.createElement('div');
    head.className = 'conversation__meta-head';

    const nameEl = document.createElement('strong');
    nameEl.textContent = match.name;

    const timeEl = document.createElement('time');
    timeEl.textContent = formatTime(match.updatedAt);

    head.append(nameEl, timeEl);

    const preview = document.createElement('div');
    preview.className = 'conversation__preview';

    const previewText = document.createElement('span');
    previewText.textContent = match.preview || 'Match recente';
    preview.appendChild(previewText);

    if (match.unread) {
      const badge = document.createElement('span');
      badge.className = 'conversation__badge';
      badge.textContent = String(match.unread);
      preview.appendChild(badge);
    }

    meta.append(head, preview);

    const tag = document.createElement('span');
    tag.className = 'conversation__tag';
    tag.textContent = profile?.teaches || profile?.role || 'Match';

    li.append(avatar, meta, tag);

    li.addEventListener('click', () => openConversation(match.profileId));
    li.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openConversation(match.profileId);
      }
    });

    listEl.appendChild(li);
  });

  emptyListEl?.toggleAttribute('hidden', filtered.length > 0);
  updateChatStats();
}

function autoSizeComposer() {
  if (!composerInput) return;
  composerInput.style.height = 'auto';
  const next = Math.min(composerInput.scrollHeight, 160);
  composerInput.style.height = `${Math.max(next, 48)}px`;
}

function openConversation(profileId) {
  const convo = conversations[profileId];
  if (!convo || !messagesEl) return;

  activeConversationId = profileId;
  const isCompact = window.matchMedia('(max-width: 1024px)').matches;
  layout?.setAttribute('data-view', isCompact ? 'thread' : 'list');
  location.hash = `#chat/${profileId}`;

  const roleLabel = [convo.profile.role, convo.profile.location].filter(Boolean).join(' · ');
  if (threadNameEl) threadNameEl.textContent = convo.profile.name;
  if (threadStatusEl) threadStatusEl.textContent = roleLabel || 'Match recente';

  renderMessages(profileId);
  markAsRead(profileId);
  renderConversationList(searchInput?.value || '');
  updateCallButtonState();
}

function renderMessages(profileId) {
  const convo = conversations[profileId];
  if (!convo || !messagesEl) return;

  messagesEl.innerHTML = '';
  convo.messages.forEach((message) => {
    const bubble = document.createElement('div');
    bubble.className = `message message--${message.from === 'me' ? 'me' : 'them'}`;

    const textEl = document.createElement('p');
    textEl.textContent = message.text;

    const timeEl = document.createElement('time');
    timeEl.textContent = formatTime(message.at);

    bubble.append(textEl, timeEl);
    messagesEl.appendChild(bubble);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendMessage(profileId, message) {
  const convo = conversations[profileId];
  if (!convo) return;
  convo.messages.push(message);
  safeWrite(STORAGE_KEYS.conversations, conversations);
  updateMatchPreview(profileId, message.text);
  renderMessages(profileId);
}

function updateMatchPreview(profileId, text) {
  matches = matches.map((match) => {
    if (match.profileId === profileId) {
      return { ...match, preview: text, updatedAt: new Date().toISOString(), unread: 0 };
    }
    return match;
  });
  safeWrite(STORAGE_KEYS.matches, matches);
  renderConversationList(searchInput?.value || '');
}

function markAsRead(profileId) {
  matches = matches.map((match) => (match.profileId === profileId ? { ...match, unread: 0 } : match));
  safeWrite(STORAGE_KEYS.matches, matches);
  updateChatStats();
}

function openVideoCall(profileId) {
  window.location.href = `./video-chamada.html#call/${profileId}`;
}

function updateCallButtonState() {
  if (!startCallButton) return;
  if (activeConversationId) {
    startCallButton.removeAttribute('disabled');
    const activeProfile = profileMap.get(activeConversationId);
    if (activeProfile) {
      startCallButton.setAttribute('aria-label', `Iniciar videochamada com ${activeProfile.name}`);
    }
  } else {
    startCallButton.setAttribute('disabled', '');
    startCallButton.setAttribute('aria-label', 'Selecione um match para iniciar videochamada');
  }
}

function openProfileSheet(profileId) {
  const profile = profileMap.get(profileId);
  if (!profile || !profileSheet || !sheetBodyEl || !sheetNameEl) return;
  sheetNameEl.textContent = profile.name;
  if (sheetSubtitleEl) {
    sheetSubtitleEl.textContent = [profile.role, profile.location].filter(Boolean).join(' · ');
  }
  sheetBodyEl.innerHTML = `
    <p><strong>Ensina:</strong> ${profile.teaches}</p>
    <p><strong>Quer aprender:</strong> ${profile.learns}</p>
    <p><strong>Match ideal:</strong> ${profile.match}</p>
    <p><strong>Disponibilidade:</strong> ${profile.availability}</p>
    <ul>
      ${(profile.topics || []).map((topic) => `<li>${topic}</li>`).join('')}
    </ul>
  `;
  profileSheet.removeAttribute('hidden');
}

function closeProfileSheet() {
  profileSheet?.setAttribute('hidden', '');
}

function syncFromHash() {
  const hash = location.hash;
  if (hash.startsWith('#chat/')) {
    const profileId = hash.replace('#chat/', '');
    if (profileId) {
      openConversation(profileId);
    }
  }
}

function handleStorageSync(event) {
  if (!event.key) return;
  if (![STORAGE_KEYS.matches, STORAGE_KEYS.conversations].includes(event.key)) {
    return;
  }
  matches = safeRead(STORAGE_KEYS.matches) || [];
  conversations = safeRead(STORAGE_KEYS.conversations) || {};
  renderConversationList(searchInput?.value || '');
  if (activeConversationId) {
    renderMessages(activeConversationId);
  }
  updateChatStats();
}

function formatTime(value) {
  const date = value ? new Date(value) : new Date();
  return timeFormatter.format(date);
}

function updateChatStats() {
  if (!statsNodes.total) {
    return;
  }

  const total = matches.length;
  const unread = matches.reduce((sum, match) => sum + (match.unread || 0), 0);
  const lastUpdated = matches.reduce((latest, match) => {
    const timestamp = match.updatedAt ? new Date(match.updatedAt).getTime() : 0;
    return timestamp > latest ? timestamp : latest;
  }, 0);

  statsNodes.total.textContent = total;
  statsNodes.unread.textContent = unread;
  statsNodes.last.textContent = lastUpdated ? formatRelative(new Date(lastUpdated)) : '—';
}

function formatRelative(date) {
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) {
    return 'agora';
  }
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
