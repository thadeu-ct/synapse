import {
  STORAGE_KEYS,
  ensureMatchSeedData,
  profileMap,
  safeRead,
  safeWrite
} from './match-data.js';

const NOTES_KEY = 'synapseCallNotes';

ensureMatchSeedData();

const elements = {
  status: document.querySelector('[data-call-status]'),
  timer: document.querySelector('[data-call-timer]'),
  banner: document.querySelector('[data-call-banner]'),
  remoteFeed: document.querySelector('[data-remote-feed]'),
  remoteName: document.querySelector('[data-remote-name]'),
  remoteRole: document.querySelector('[data-remote-role]'),
  participantName: document.querySelector('[data-participant-name]'),
  participantRole: document.querySelector('[data-participant-role]'),
  participantGoal: document.querySelector('[data-participant-goal]'),
  participantAvailability: document.querySelector('[data-participant-availability]'),
  topicsList: document.querySelector('[data-topics]'),
  notesField: document.querySelector('[data-notes]'),
  saveNotesBtn: document.querySelector('[data-action="save-notes"]'),
  shareLinkBtn: document.querySelector('[data-action="share-link"]'),
  toggleMicBtn: document.querySelector('[data-toggle="mic"]'),
  toggleCameraBtn: document.querySelector('[data-toggle="camera"]'),
  toggleCallBtn: document.querySelector('[data-action="toggle-call"]'),
  endCallBtn: document.querySelector('[data-action="end-call"]'),
  shareScreenBtn: document.querySelector('[data-action="share-screen"]'),
  notesShortcutBtn: document.querySelector('[data-action="notes"]'),
  stageAvatar: document.querySelector('[data-stage-avatar]'),
  stageName: document.querySelector('[data-stage-name]'),
  stageRole: document.querySelector('[data-stage-role]'),
  heroName: document.querySelector('[data-hero-name]'),
  heroArea: document.querySelector('[data-hero-area]'),
  heroSlot: document.querySelector('[data-hero-slot]'),
  callPill: document.querySelector('[data-call-pill]'),
  signalMeter: document.querySelector('[data-signal-meter]'),
  feedPill: document.querySelector('[data-feed-pill]'),
  feedCaption: document.querySelector('[data-feed-caption]'),
  overlay: document.querySelector('[data-call-overlay]'),
  recordingIndicator: document.querySelector('[data-recording-indicator]'),
  recordingLink: document.querySelector('[data-recording-link]'),
  recordingAvailability: document.querySelector('[data-recording-availability]'),
  recordingCopy: document.querySelector('[data-action="recording-copy"]'),
  premiumTrigger: document.querySelector('[data-open-premium]'),
  premiumModal: document.querySelector('[data-premium-modal]'),
  premiumClose: document.querySelector('[data-premium-close]')
};

const callState = {
  status: 'idle',
  timerId: null,
  startedAt: null,
  elapsedMs: 0
};

const RECORDING_DURATION_DAYS = 7;
const PREMIUM_DURATION_DAYS = 30;
const recordingDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
let currentRecordingLink = '';

const profileId = resolveProfileId();
const activeProfile = profileMap.get(profileId);

if (activeProfile) {
  hydrateProfile(activeProfile);
  hydrateNotes(profileId);
}

setupControls();

function resolveProfileId() {
  const hash = location.hash || '';
  if (hash.startsWith('#call/')) {
    const candidate = hash.replace('#call/', '').trim();
    if (profileMap.has(candidate)) return candidate;
  }
  const matches = safeRead(STORAGE_KEYS.matches) || [];
  if (matches.length && profileMap.has(matches[0].profileId)) return matches[0].profileId;
  const [firstProfile] = profileMap.keys();
  return firstProfile || 'ana-ribeiro';
}

function hydrateProfile(profile) {
  if (elements.remoteFeed && profile.photo) {
    elements.remoteFeed.style.setProperty('--feed-image', `url('${profile.photo}')`);
    elements.remoteFeed.style.backgroundImage = `url('${profile.photo}')`;
  }
  if (elements.remoteName) elements.remoteName.textContent = profile.name;
  if (elements.remoteRole) elements.remoteRole.textContent = profile.role;
  setStageAvatar(profile);
  if (elements.stageName) elements.stageName.textContent = profile.name;
  if (elements.stageRole) {
    elements.stageRole.textContent = [profile.teaches, profile.location].filter(Boolean).join(' · ') || profile.role || '';
  }
  if (elements.participantName) elements.participantName.textContent = profile.name;
  if (elements.participantRole) {
    elements.participantRole.textContent = `${profile.role || ''}${profile.location ? ` · ${profile.location}` : ''}`.trim();
  }
  if (elements.participantGoal) elements.participantGoal.textContent = profile.match || profile.teaches || 'Troca personalizada';
  if (elements.participantAvailability) elements.participantAvailability.textContent = profile.availability || 'Defina pelo chat';
  setHeroMeta(profile);
  setRecordingInfo(profile);
  if (elements.topicsList) {
    const topics = (profile.topics || profile.teaches?.split('/') || []).filter(Boolean);
    elements.topicsList.innerHTML = topics.map((topic) => `<li>${topic}</li>`).join('');
    if (!topics.length) {
      elements.topicsList.innerHTML = '<li>Personalize os tópicos no chat</li>';
    }
  }
}

function hydrateNotes(id) {
  if (!elements.notesField) return;
  const notes = safeRead(NOTES_KEY) || {};
  elements.notesField.value = notes[id] || '';
}

function setupControls() {
  toggleButton(elements.toggleMicBtn, 'Microfone ativo', 'Microfone mutado');
  toggleButton(elements.toggleCameraBtn, 'Câmera ativa', 'Câmera desligada');

  elements.shareLinkBtn?.addEventListener('click', handleLinkShare);
  elements.shareScreenBtn?.addEventListener('click', () => updateBanner('Compartilhamento pronto. Escolha uma janela para transmitir.'));
  elements.notesShortcutBtn?.addEventListener('click', () => {
    elements.notesField?.focus();
    updateBanner('Use este campo para registrar próximos passos.');
  });
  elements.saveNotesBtn?.addEventListener('click', () => {
    if (!elements.notesField || !activeProfile) return;
    const notes = safeRead(NOTES_KEY) || {};
    notes[activeProfile.id] = elements.notesField.value.trim();
    safeWrite(NOTES_KEY, notes);
    updateBanner('Notas salvas localmente.');
  });

  elements.toggleCallBtn?.addEventListener('click', () => {
    if (callState.status === 'idle') {
      startConnecting();
    } else if (callState.status === 'ended') {
      resetCall();
      startConnecting();
    }
  });

  elements.endCallBtn?.addEventListener('click', endCall);

  document.querySelectorAll('.video-call__checklist li').forEach((item) => {
    item.addEventListener('click', () => item.classList.toggle('is-done'));
  });

  elements.recordingCopy?.addEventListener('click', handleRecordingCopy);
  elements.premiumTrigger?.addEventListener('click', openPremiumModal);
  elements.premiumClose?.addEventListener('click', closePremiumModal);
  elements.premiumModal?.addEventListener('click', (event) => {
    if (event.target === elements.premiumModal) closePremiumModal();
  });
}

function toggleButton(button, enabledLabel, disabledLabel) {
  if (!button) return;
  const span = button.querySelector('span');
  if (span) span.textContent = enabledLabel;
  button.addEventListener('click', () => {
    const wasPressed = button.getAttribute('aria-pressed') === 'true';
    const isNowPressed = !wasPressed;
    button.setAttribute('aria-pressed', String(isNowPressed));
    const nextLabel = isNowPressed ? disabledLabel : enabledLabel;
    if (span) span.textContent = nextLabel;
    updateBanner(nextLabel);
  });
}

function handleLinkShare() {
  if (!activeProfile) return;
  const url = new URL(location.href);
  url.hash = `#call/${activeProfile.id}`;
  const link = url.toString();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(link).then(() => updateBanner('Link copiado para a área de transferência.')).catch(() => fallbackPrompt(link));
  } else {
    fallbackPrompt(link);
  }
}

function fallbackPrompt(text) {
  window.prompt('Copie este link para compartilhar com o match:', text);
}

function startConnecting() {
  setCallStatus('connecting');
  updateBanner('Chamando participante...');
  elements.toggleCallBtn?.classList.add('is-loading');
  updateCallButton('Conectando...');
  elements.toggleCallBtn?.setAttribute('disabled', '');
  setTimeout(() => {
    if (callState.status === 'connecting') {
      beginLiveCall();
    }
  }, 1400);
}

function beginLiveCall() {
  setCallStatus('live');
  callState.startedAt = Date.now();
  callState.timerId = window.setInterval(tickTimer, 1000);
  updateCallButton('Ao vivo');
  elements.endCallBtn?.removeAttribute('disabled');
  elements.toggleCallBtn?.classList.remove('is-loading');
  updateBanner('Chamada conectada. Boa sessão!');
  applyLiveFeedStyles(true);
}

function tickTimer() {
  if (!callState.startedAt || !elements.timer) return;
  const elapsed = Date.now() - callState.startedAt + callState.elapsedMs;
  elements.timer.textContent = formatDuration(elapsed);
}

function endCall() {
  if (callState.status !== 'live') return;
  callState.elapsedMs += Date.now() - (callState.startedAt || Date.now());
  callState.startedAt = null;
  if (callState.timerId) {
    clearInterval(callState.timerId);
    callState.timerId = null;
  }
  setCallStatus('ended');
  updateCallButton('Entrar novamente');
  elements.toggleCallBtn?.removeAttribute('disabled');
  elements.endCallBtn?.setAttribute('disabled', '');
  updateBanner('Chamada encerrada. Registre seus próximos passos nas notas.');
  applyLiveFeedStyles(false);
}

function resetCall() {
  callState.status = 'idle';
  callState.elapsedMs = 0;
  elements.timer.textContent = '00:00';
}

function applyLiveFeedStyles(isLive) {
  elements.remoteFeed?.classList.toggle('is-live', isLive);
  elements.remoteFeed?.classList.toggle('is-dimmed', !isLive);
}

function updateCallButton(label) {
  const span = elements.toggleCallBtn?.querySelector('span');
  if (span) span.textContent = label;
}

function setCallStatus(status) {
  callState.status = status;
  if (!elements.status || !elements.banner) return;
  const copy = {
    idle: 'aguardando participante',
    connecting: 'conectando...',
    live: 'em andamento',
    ended: 'encerrada'
  }[status] || status;
  elements.status.textContent = copy;
  const headline = {
    idle: 'Conexão pronta',
    connecting: 'Chamando participante',
    live: 'Sessão em andamento',
    ended: 'Sessão finalizada'
  }[status];
  const titleEl = elements.banner.querySelector('strong');
  if (headline && titleEl) titleEl.textContent = headline;
  elements.banner.classList.remove('is-connecting', 'is-live', 'is-ended');
  if (status === 'connecting') elements.banner.classList.add('is-connecting');
  if (status === 'live') elements.banner.classList.add('is-live');
  if (status === 'ended') elements.banner.classList.add('is-ended');
  updateCallVisuals(status);
}

function updateBanner(text) {
  if (!elements.banner) return;
  elements.banner.querySelector('p')?.remove();
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  elements.banner.appendChild(paragraph);
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setInitialStatus() {
  setCallStatus('idle');
  if (elements.banner) {
    elements.banner.innerHTML = '<strong>Conexão pronta</strong><p>Avise seu match no chat e clique em "Entrar na chamada" para conectar.</p>';
  }
}

setInitialStatus();

function setStageAvatar(profile) {
  if (!elements.stageAvatar) return;
  const initials = getInitials(profile.name);
  elements.stageAvatar.textContent = initials;
  if (profile.photo) {
    elements.stageAvatar.style.setProperty('--avatar-image', `url('${profile.photo}')`);
    elements.stageAvatar.classList.add('has-photo');
  } else {
    elements.stageAvatar.style.removeProperty('--avatar-image');
    elements.stageAvatar.classList.remove('has-photo');
  }
}

function setHeroMeta(profile) {
  if (elements.heroName) elements.heroName.textContent = profile.name;
  if (elements.heroArea) elements.heroArea.textContent = profile.teaches || profile.match || profile.role || 'Mentoria cruzada';
  if (elements.heroSlot) elements.heroSlot.textContent = profile.availability || 'Combine pelo chat';
}

function setRecordingInfo(profile) {
  currentRecordingLink = generateRecordingLink(profile);
  if (elements.recordingLink) {
    elements.recordingLink.textContent = currentRecordingLink;
  }
  if (elements.recordingAvailability) {
    const expiresAt = new Date(Date.now() + RECORDING_DURATION_DAYS * 24 * 60 * 60 * 1000);
    elements.recordingAvailability.textContent = `Disponível por ${RECORDING_DURATION_DAYS} dias (até ${recordingDateFormatter.format(expiresAt)}). Assinantes premium mantêm por ${PREMIUM_DURATION_DAYS} dias.`;
  }
}

function updateCallVisuals(status) {
  const config = {
    idle: {
      pill: 'Sala pronta',
      overlayLabel: 'Aguardando participante',
      overlayCaption: 'Envie o link seguro pelo chat e aguarde a conexão.',
      hideOverlay: false,
      signal: 2,
      recording: false
    },
    connecting: {
      pill: 'Conectando...',
      overlayLabel: 'Estabelecendo conexão',
      overlayCaption: 'Sincronizando áudio, vídeo e criptografia.',
      hideOverlay: false,
      signal: 3,
      recording: false
    },
    live: {
      pill: 'Ao vivo',
      overlayLabel: 'Transmissão ativa',
      overlayCaption: 'Compartilhamento habilitado para ambos os lados.',
      hideOverlay: true,
      signal: 4,
      recording: true
    },
    ended: {
      pill: 'Sessão encerrada',
      overlayLabel: 'Chamada finalizada',
      overlayCaption: 'Revise suas notas antes de enviar o resumo.',
      hideOverlay: false,
      signal: 1,
      recording: false
    }
  }[status] || {
    pill: 'Sala pronta',
    overlayLabel: 'Aguardando participante',
    overlayCaption: 'Envie o link seguro pelo chat e aguarde a conexão.',
    hideOverlay: false,
    signal: 2,
    recording: false
  };

  if (elements.callPill) {
    elements.callPill.textContent = config.pill;
    elements.callPill.dataset.state = status;
  }
  if (elements.feedPill) elements.feedPill.textContent = config.overlayLabel;
  if (elements.feedCaption) elements.feedCaption.textContent = config.overlayCaption;
  elements.overlay?.classList.toggle('is-hidden', Boolean(config.hideOverlay));
  setSignalStrength(config.signal);
  setRecordingActive(config.recording);
}

function setSignalStrength(level = 4) {
  if (!elements.signalMeter) return;
  const bars = elements.signalMeter.querySelectorAll('span');
  bars.forEach((bar, index) => {
    bar.classList.toggle('is-active', index < level);
  });
}

function setRecordingActive(isActive) {
  if (!elements.recordingIndicator) return;
  elements.recordingIndicator.classList.toggle('is-active', isActive);
}

function handleRecordingCopy() {
  if (!currentRecordingLink) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(currentRecordingLink).then(() => updateBanner('Link da gravação copiado por 7 dias.')).catch(() => fallbackPrompt(currentRecordingLink));
  } else {
    fallbackPrompt(currentRecordingLink);
  }
}

function openPremiumModal() {
  elements.premiumModal?.removeAttribute('hidden');
}

function closePremiumModal() {
  elements.premiumModal?.setAttribute('hidden', '');
}

function generateRecordingLink(profile) {
  const slug = profile?.id || 'match';
  return `https://synapse.app/replay/${slug}`;
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((piece) => piece[0] || '')
    .join('')
    .toUpperCase();
}
