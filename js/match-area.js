import {
  STORAGE_KEYS,
  ensureMatchSeedData,
  profileMap,
  profiles,
  safeRead,
  safeWrite,
  seedConversations,
  serializeMatch,
  serializeProfile
} from './match-data.js';

const stackEl = document.querySelector('[data-stack]');
const emptyStateEl = document.querySelector('[data-empty]');
const deckHintEl = document.querySelector('.deck-hint');
const actionRowEl = document.querySelector('.action-row');
const queueListEl = document.querySelector('[data-queue-list]');
const modalEl = document.querySelector('[data-modal]');
const modalTitleEl = document.getElementById('profileModalTitle');
const modalRoleEl = document.querySelector('[data-modal-role]');
const modalContentEl = document.querySelector('[data-modal-content]');
const counterTargets = {
  total: Array.from(document.querySelectorAll('[data-counter="total"]')),
  fresh: Array.from(document.querySelectorAll('[data-counter="fresh"]')),
  live: Array.from(document.querySelectorAll('[data-counter="live"]'))
};
const filterLabelEl = document.querySelector('[data-filter-label]');
const filterEmptyEl = document.querySelector('[data-filter-empty]');
const storyRailEl = document.querySelector('[data-story-rail]');
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
const filterResetEls = Array.from(document.querySelectorAll('[data-clear-filter]'));
const numberFormatter = new Intl.NumberFormat('pt-BR');

const ACTIONS = {
  LIKE: 'like',
  PASS: 'pass',
  PROFILE: 'profile'
};

const THRESHOLDS = {
  horizontal: 110,
  vertical: 120
};
const QUEUE_PREVIEW_LIMIT = 4;
const FILTERS = {
  all: () => true,
  fresh: (profile) => vibeMatches(profile, ['novo']),
  live: (profile) => vibeMatches(profile, ['disponível', 'focus']),
  highlight: (profile) => vibeMatches(profile, ['host', 'trend', 'fire'])
};
const FILTER_LABELS = {
  all: 'Todos',
  fresh: 'Novos',
  live: 'Disponíveis',
  highlight: 'Em alta'
};

let decisions = { liked: [], passed: [] };
let queue = [];
let activePointerId = null;
let dragStart = null;
let dragOffset = { dx: 0, dy: 0 };
let activeCard = null;
let activeFilter = 'all';

if (!stackEl) {
  console.warn('Match area: deck não encontrado no DOM.');
} else {
  ensureMatchSeedData();
  decisions = loadDecisions();
  queue = buildQueue();
  setupFilters();
  renderStoryRail();
  renderDeck();
  setupActionButtons();
  setupKeyboardShortcuts();
  setupModal();
}

function loadDecisions() {
  const stored = safeRead(STORAGE_KEYS.decisions);
  if (stored?.liked && stored?.passed) {
    return stored;
  }
  const fallback = { liked: [], passed: [] };
  safeWrite(STORAGE_KEYS.decisions, fallback);
  return fallback;
}

function buildQueue() {
  const liked = new Set(decisions.liked || []);
  const passed = new Set(decisions.passed || []);
  return profiles.filter((profile) => !liked.has(profile.id) && !passed.has(profile.id));
}

function renderDeck() {
  const visibleQueue = getVisibleQueue();
  stackEl.innerHTML = '';

  visibleQueue.forEach((profile, index) => {
    const card = createCard(profile, index);
    stackEl.appendChild(card);
    attachGestureListeners(card);
  });

  toggleEmptyState(visibleQueue);
  updateDashboardMeta();
}

function createCard(profile, index) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = profile.id;
  card.tabIndex = 0;
  card.style.zIndex = String(100 - index);

  card.innerHTML = `
    <div class="card__overlay card__overlay--like" data-overlay="like">MATCH</div>
    <div class="card__overlay card__overlay--pass" data-overlay="pass">NÃO</div>
    <div class="card__overlay card__overlay--profile" data-overlay="profile">PROFILE</div>
    <div class="card__image" style="background-image:url('${profile.photo}')">
      <span class="card__badge">${profile.vibe}</span>
    </div>
    <div class="card__body">
      <h2 class="card__title">${profile.name}, ${profile.age}</h2>
      <p class="card__meta">${profile.role} · ${profile.location}</p>
      <div class="card__tags">
        <span class="tag">Ensina: ${profile.teaches}</span>
        <span class="tag">Quer aprender: ${profile.learns}</span>
      </div>
      <ul class="card__skills">
        <li><strong>Match ideal:</strong> <span>${profile.match}</span></li>
        <li><strong>Disponibilidade:</strong> <span>${profile.availability}</span></li>
      </ul>
    </div>
  `;

  return card;
}

function attachGestureListeners(card) {
  card.addEventListener('pointerdown', handlePointerDown);
  card.addEventListener('pointermove', handlePointerMove);
  card.addEventListener('pointerup', handlePointerUp);
  card.addEventListener('pointercancel', handlePointerUp);
}

function handlePointerDown(event) {
  if (activeCard || !isTopCard(event.currentTarget)) {
    return;
  }

  event.preventDefault();

  activeCard = event.currentTarget;
  activePointerId = event.pointerId;
  dragStart = { x: event.clientX, y: event.clientY };
  dragOffset = { dx: 0, dy: 0 };

  activeCard.classList.add('is-active');
  activeCard.setPointerCapture(activePointerId);
}

function handlePointerMove(event) {
  if (!activeCard || event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();

  dragOffset = {
    dx: event.clientX - dragStart.x,
    dy: event.clientY - dragStart.y
  };

  const rotation = dragOffset.dx * 0.05;
  activeCard.style.transform = `translate(${dragOffset.dx}px, ${dragOffset.dy}px) rotate(${rotation}deg)`;
  updateOverlays(activeCard, dragOffset);
}

function handlePointerUp(event) {
  if (!activeCard || event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();

  const action = resolveAction(dragOffset);
  activeCard.releasePointerCapture(activePointerId);

  finalizeGesture(action, dragOffset);
}

function resolveAction({ dx, dy }) {
  if (dx > THRESHOLDS.horizontal) {
    return ACTIONS.LIKE;
  }
  if (dx < -THRESHOLDS.horizontal) {
    return ACTIONS.PASS;
  }
  if (dy < -THRESHOLDS.vertical && Math.abs(dx) < THRESHOLDS.horizontal) {
    return ACTIONS.PROFILE;
  }
  return null;
}

function finalizeGesture(action, offset) {
  const card = activeCard;

  clearActiveState();

  if (!card) {
    return;
  }

  if (!action) {
    resetCard(card);
    return;
  }

  if (action === ACTIONS.PROFILE) {
    resetCard(card);
    openProfile(card.dataset.id);
    return;
  }

  swipeCard(card, action, offset);
}

function clearActiveState() {
  if (activeCard) {
    activeCard.classList.remove('is-active');
  }

  activeCard = null;
  activePointerId = null;
  dragStart = null;
  dragOffset = { dx: 0, dy: 0 };
}

function resetCard(card) {
  card.style.transition = 'transform 0.35s ease';
  card.style.transform = '';
  fadeOverlays(card);

  card.addEventListener(
    'transitionend',
    () => {
      card.style.transition = '';
    },
    { once: true }
  );
}

function swipeCard(card, action, offset = { dx: 0, dy: 0 }) {
  const width = window.innerWidth || 400;
  const horizontal = action === ACTIONS.LIKE ? width : -width;
  const rotation = action === ACTIONS.LIKE ? 25 : -25;

  fadeOverlays(card);

  card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

  requestAnimationFrame(() => {
    card.style.transform = `translate(${horizontal}px, ${offset.dy}px) rotate(${rotation}deg)`;
    card.style.opacity = '0';
  });

  card.addEventListener(
    'transitionend',
    () => {
      handleDecision(action, card.dataset.id);
    },
    { once: true }
  );
}

function handleDecision(action, profileId) {
  if (!profileId) {
    return;
  }

  if (action === ACTIONS.LIKE) {
    pushDecision('liked', profileId);
    persistMatchProfile(profileId);
  } else {
    pushDecision('passed', profileId);
  }

  queue = queue.filter((profile) => profile.id !== profileId);
  renderDeck();
}

function pushDecision(type, profileId) {
  if (!decisions[type]) {
    decisions[type] = [];
  }
  if (!decisions[type].includes(profileId)) {
    decisions[type].push(profileId);
    safeWrite(STORAGE_KEYS.decisions, decisions);
  }
}

function persistMatchProfile(profileId) {
  const profile = profileMap.get(profileId);
  if (!profile) {
    return;
  }

  const matches = safeRead(STORAGE_KEYS.matches) || [];
  if (!matches.some((match) => match.profileId === profile.id)) {
    matches.unshift(serializeMatch(profile));
    safeWrite(STORAGE_KEYS.matches, matches);
  }

  const conversations = safeRead(STORAGE_KEYS.conversations) || {};
  if (!conversations[profile.id]) {
    conversations[profile.id] = {
      profile: serializeProfile(profile),
      messages: seedConversations[profile.id] || [
        {
          id: crypto.randomUUID(),
          from: 'them',
          text: 'Match perfeito! Bora combinar nossa troca?',
          at: new Date().toISOString(),
          read: false
        }
      ]
    };
    safeWrite(STORAGE_KEYS.conversations, conversations);
  }
}

function updateOverlays(card, { dx, dy }) {
  const likeOverlay = card.querySelector('[data-overlay="like"]');
  const passOverlay = card.querySelector('[data-overlay="pass"]');
  const profileOverlay = card.querySelector('[data-overlay="profile"]');

  const likeProgress = clamp(Math.abs(dx) / THRESHOLDS.horizontal, 0, 1);
  const profileProgress = clamp(Math.abs(dy) / THRESHOLDS.vertical, 0, 1);

  if (dx > 0) {
    likeOverlay.style.opacity = likeProgress;
    passOverlay.style.opacity = 0;
  } else if (dx < 0) {
    passOverlay.style.opacity = likeProgress;
    likeOverlay.style.opacity = 0;
  } else {
    likeOverlay.style.opacity = 0;
    passOverlay.style.opacity = 0;
  }

  profileOverlay.style.opacity = dy < 0 ? profileProgress : 0;
}

function fadeOverlays(card) {
  card.querySelectorAll('.card__overlay').forEach((overlay) => {
    overlay.style.opacity = 0;
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setupActionButtons() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => triggerAction(button.dataset.action));
  });
}

function setupFilters() {
  if (!filterButtons.length && !filterResetEls.length) {
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.filter || 'all';
      setFilter(value);
    });
    button.classList.toggle('is-active', button.dataset.filter === activeFilter);
  });

  filterResetEls.forEach((button) => {
    button.addEventListener('click', () => setFilter('all'));
  });

  updateFilterLabel();
}

function setFilter(value = 'all') {
  const normalized = FILTERS[value] ? value : 'all';
  if (normalized === activeFilter) {
    return;
  }

  activeFilter = normalized;
  filterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === activeFilter);
  });
  updateFilterLabel();
  renderDeck();
}

function triggerAction(action) {
  const card = getTopCard();
  if (!card || !action) {
    return;
  }

  if (action === ACTIONS.PROFILE) {
    flashOverlay(card, 'profile');
    setTimeout(() => {
      openProfile(card.dataset.id);
    }, 150);
    return;
  }

  flashOverlay(card, action === ACTIONS.LIKE ? 'like' : 'pass');
  setTimeout(() => {
    swipeCard(card, action);
  }, 120);
}

function flashOverlay(card, type) {
  const overlay = card.querySelector(`[data-overlay="${type}"]`);
  if (!overlay) {
    return;
  }

  overlay.style.transition = 'opacity 0.15s ease';
  overlay.style.opacity = 1;

  setTimeout(() => {
    overlay.style.opacity = 0;
    overlay.style.transition = '';
  }, 180);
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (modalIsOpen()) {
      if (event.key === 'Escape') {
        closeModal();
      }
      return;
    }

    if (!queue.length) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      triggerAction(ACTIONS.PASS);
    }

    if (event.key === 'ArrowRight') {
      triggerAction(ACTIONS.LIKE);
    }

    if (event.key === 'ArrowUp') {
      triggerAction(ACTIONS.PROFILE);
    }
  });
}

function getVisibleQueue() {
  const predicate = FILTERS[activeFilter] || FILTERS.all;
  return queue.filter(predicate);
}

function updateFilterLabel() {
  if (!filterLabelEl) {
    return;
  }
  const label = FILTER_LABELS[activeFilter] || FILTER_LABELS.all;
  filterLabelEl.textContent = `Mostrando: ${label}`;
}

function renderStoryRail() {
  if (!storyRailEl) {
    return;
  }

  storyRailEl.innerHTML = '';
  profiles.slice(0, 8).forEach((profile) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-chip';

    const ring = document.createElement('span');
    ring.className = 'story-chip__ring';

    const avatar = document.createElement('span');
    avatar.className = 'story-chip__avatar';
    if (profile.photo) {
      avatar.style.backgroundImage = `url('${profile.photo}')`;
    }
    avatar.textContent = getInitials(profile.name);

    const label = document.createElement('small');
    const labelText = getFirstName(profile.name) || profile.vibe || 'Perfil';
    label.textContent = labelText;

    ring.appendChild(avatar);
    button.append(ring, label);
    button.addEventListener('click', () => openProfile(profile.id));
    storyRailEl.appendChild(button);
  });
}

function getTopCard() {
  return stackEl.querySelector('.card');
}

function isTopCard(card) {
  return card === getTopCard();
}

function toggleEmptyState(visibleQueue) {
  const noProfiles = queue.length === 0;
  const noVisible = visibleQueue.length === 0;
  const showFilterEmpty = noVisible && !noProfiles;

  stackEl.classList.toggle('hidden', noVisible);
  deckHintEl?.classList.toggle('hidden', noVisible);
  actionRowEl?.classList.toggle('is-disabled', noVisible);

  if (emptyStateEl) {
    emptyStateEl.classList.toggle('hidden', !noProfiles);
  }
  if (filterEmptyEl) {
    filterEmptyEl.classList.toggle('hidden', !showFilterEmpty);
  }
}

function updateDashboardMeta() {
  const freshCount = queue.filter((profile) => vibeMatches(profile, ['novo'])).length;
  const liveCount = queue.filter((profile) => vibeMatches(profile, ['disponível', 'focus'])).length;

  setCounter('total', queue.length);
  setCounter('fresh', freshCount);
  setCounter('live', liveCount);

  renderQueuePreview();
}

function setupModal() {
  if (!modalEl) {
    return;
  }

  document.querySelectorAll('[data-modal-close]').forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  modalEl.addEventListener('click', (event) => {
    if (event.target.dataset.modalClose !== undefined || event.target === modalEl || event.target.classList.contains('profile-modal__scrim')) {
      closeModal();
    }
  });
}

function openProfile(profileId) {
  const profile = profileMap.get(profileId);
  if (!profile || !modalEl || !modalContentEl || !modalTitleEl || !modalRoleEl) {
    return;
  }

  modalTitleEl.textContent = `${profile.name}, ${profile.age}`;
  modalRoleEl.textContent = `${profile.role} · ${profile.location}`;
  modalContentEl.innerHTML = `
    <section>
      <h3>Sobre</h3>
      <p>${profile.bio}</p>
    </section>
    <section>
      <h3>Match e disponibilidade</h3>
      <ul class="card__skills">
        <li><strong>Match ideal:</strong> <span>${profile.match}</span></li>
        <li><strong>Disponibilidade:</strong> <span>${profile.availability}</span></li>
      </ul>
    </section>
    <section>
      <h3>Destaques recentes</h3>
      <ul>
        ${profile.highlights.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </section>
    <section>
      <h3>Topics & vibes</h3>
      <div class="card__tags">
        ${profile.topics.map((topic) => `<span class="tag">${topic}</span>`).join('')}
      </div>
    </section>
  `;

  modalEl.classList.remove('hidden');
  modalEl.focus();
}

function closeModal() {
  modalEl?.classList.add('hidden');
}

function modalIsOpen() {
  return modalEl ? !modalEl.classList.contains('hidden') : false;
}

function renderQueuePreview() {
  if (!queueListEl) {
    return;
  }

  const visibleQueue = getVisibleQueue();
  queueListEl.innerHTML = '';

  if (!queue.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'match-area__queue-empty';
    emptyItem.textContent = 'Sem perfis disponíveis agora. Ative notificações para ser avisado quando chegarem novas recomendações.';
    queueListEl.appendChild(emptyItem);
    return;
  }

  if (!visibleQueue.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'match-area__queue-empty';
    emptyItem.textContent = 'Filtro sem resultados. Volte para “Todos” ou ajuste preferências.';
    queueListEl.appendChild(emptyItem);
    return;
  }

  visibleQueue.slice(0, QUEUE_PREVIEW_LIMIT).forEach((profile, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="match-area__queue-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="match-area__queue-avatar">${getInitials(profile.name)}</span>
      <div>
        <strong>${profile.name}</strong>
        <small>${profile.teaches}</small>
      </div>
      <span class="match-area__queue-vibe">${profile.vibe}</span>
    `;
    queueListEl.appendChild(li);
  });
}

function setCounter(key, value) {
  const targets = counterTargets[key] || [];
  const formatted = numberFormatter.format(value);
  targets.forEach((node) => {
    node.textContent = formatted;
  });
}

function getFirstName(name) {
  if (!name) {
    return '';
  }
  return name
    .trim()
    .split(/\s+/)
    .shift();
}

function getInitials(name) {
  if (!name) {
    return '?';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function vibeMatches(profile, keywords) {
  const vibe = profile.vibe?.toLowerCase() ?? '';
  return keywords.some((keyword) => vibe.includes(keyword));
}
