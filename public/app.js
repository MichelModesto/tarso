const shirts = [
  [1, "Noir Money", "01-noir-money.jpg"],
  [2, "Emerald Vault", "02-emerald-vault.jpg"],
  [3, "Orange Caper", "03-orange-caper.jpg"],
  [4, "Vintage Getaway", "04-vintage-getaway.jpg"],
  [5, "Neon Cash Glitch", "05-neon-cash-glitch.jpg"],
  [6, "Black Gold Luxe", "06-black-gold-luxe.jpg"],
  [7, "Vault Blueprint", "07-vault-blueprint.jpg"],
  [8, "Pop Art Jackpot", "08-pop-art-jackpot.jpg"],
  [9, "Acid Graffiti", "09-acid-graffiti.jpg"],
  [10, "White Silver", "10-white-silver-minimal.jpg"],
  [11, "Ukiyo-e Fortune Tide", "11-ukiyoe-fortune-tide.jpg"],
  [12, "Midnight Casino", "12-midnight-casino.jpg"],
  [13, "Lotería Fortuna", "13-loteria-fortuna.jpg"],
  [14, "Bauhaus Fortune", "14-bauhaus-fortune.jpg"],
  [15, "Brasil Tropical", "15-brasil-tropical.jpg"],
  [16, "Chrome Racing", "16-chrome-racing.jpg"],
  [17, "Cosmic Treasure", "17-cosmic-treasure.jpg"],
  [18, "Analog Paper Cut", "18-analog-paper-cut.jpg"],
  [19, "Tattoo Flash Fortune", "19-tattoo-flash-fortune.jpg"],
  [20, "Memphis 90s", "20-memphis-90s.jpg"],
].map(([id, name, image]) => ({ id, name, image: `/images/${image}` }));

const state = {
  results: new Map(shirts.map(({ id }) => [id, 0])),
  totalVotes: 0,
  myVote: null,
  pendingVote: null,
  voting: false,
};

const grid = document.querySelector("#shirt-grid");
const rankingList = document.querySelector("#ranking-list");
const totalVotes = document.querySelector("#total-votes");
const voteStatus = document.querySelector("#vote-status");
const voteDialog = document.querySelector("#vote-dialog");
const confirmTitle = document.querySelector("#confirm-title");
const confirmVote = document.querySelector("#confirm-vote");
const imageDialog = document.querySelector("#image-dialog");
const largeImage = document.querySelector("#large-image");
const largeCaption = document.querySelector("#large-caption");
const toast = document.querySelector("#toast");

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function renderGallery() {
  const highest = Math.max(1, ...state.results.values());
  grid.innerHTML = shirts.map((shirt, index) => {
    const votes = state.results.get(shirt.id) || 0;
    const percentOfLeader = Math.round((votes / highest) * 100);
    const selected = state.myVote === shirt.id;
    const buttonLabel = selected ? "Seu voto" : state.myVote ? "Votação encerrada" : "Votar nesta camisa";
    return `
      <article class="shirt-card${selected ? " is-selected" : ""}" data-shirt-id="${shirt.id}">
        <button class="shirt-visual" data-preview="${shirt.id}" aria-label="Ampliar camisa ${shirt.id}, ${escapeHtml(shirt.name)}">
          <img src="${shirt.image}" alt="Camisa ${shirt.id}, ${escapeHtml(shirt.name)}, frente e costas" ${index > 1 ? 'loading="lazy"' : ''} />
          <span class="shirt-number">${String(shirt.id).padStart(2, "0")}</span>
        </button>
        <div class="shirt-body">
          <div class="shirt-title-row">
            <h2 class="shirt-title">${escapeHtml(shirt.name)}</h2>
            <span class="vote-count">${votes} ${votes === 1 ? "voto" : "votos"}</span>
          </div>
          <div class="progress" aria-hidden="true"><span style="width:${percentOfLeader}%"></span></div>
          <button class="button button-primary" data-vote="${shirt.id}" ${state.myVote || state.voting ? "disabled" : ""}>${buttonLabel}</button>
        </div>
      </article>`;
  }).join("");
}

function renderRanking() {
  const ranked = shirts
    .map((shirt) => ({ ...shirt, votes: state.results.get(shirt.id) || 0 }))
    .sort((a, b) => b.votes - a.votes || a.id - b.id)
    .slice(0, 5);

  rankingList.innerHTML = ranked.map((shirt) => `
    <li class="rank-row">
      <span class="rank-name">${String(shirt.id).padStart(2, "0")} · ${escapeHtml(shirt.name)}</span>
      <span class="rank-votes">${shirt.votes} ${shirt.votes === 1 ? "voto" : "votos"}</span>
    </li>`).join("");
  totalVotes.textContent = state.totalVotes.toLocaleString("pt-BR");
}

function renderStatus() {
  if (!state.myVote) return;
  const shirt = shirts.find(({ id }) => id === state.myVote);
  voteStatus.classList.add("has-voted");
  voteStatus.innerHTML = `<strong>✓</strong><span>voto na ${String(shirt.id).padStart(2, "0")}</span>`;
}

function render() {
  renderGallery();
  renderRanking();
  renderStatus();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Ocorreu um erro inesperado.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function refreshResults() {
  const data = await fetchJson("/api/results");
  state.results = new Map(data.results.map(({ optionId, votes }) => [optionId, votes]));
  state.totalVotes = data.totalVotes;
  render();
  return data;
}

async function loadInitialState() {
  try {
    const [results, status] = await Promise.all([
      fetchJson("/api/results"),
      fetchJson("/api/status"),
    ]);
    state.results = new Map(results.results.map(({ optionId, votes }) => [optionId, votes]));
    state.totalVotes = results.totalVotes;
    state.myVote = status.optionId;
  } catch (error) {
    showToast(error.message);
  } finally {
    render();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 4200);
}

function openVoteDialog(optionId) {
  const shirt = shirts.find(({ id }) => id === optionId);
  if (!shirt || state.myVote) return;
  state.pendingVote = optionId;
  confirmTitle.textContent = `Votar na ${String(optionId).padStart(2, "0")} · ${shirt.name}?`;
  voteDialog.showModal();
}

function openImage(optionId) {
  const shirt = shirts.find(({ id }) => id === optionId);
  if (!shirt) return;
  largeImage.src = shirt.image;
  largeImage.alt = `Camisa ${shirt.id}, ${shirt.name}, frente e costas`;
  largeCaption.textContent = `${String(shirt.id).padStart(2, "0")} · ${shirt.name}`;
  imageDialog.showModal();
}

async function submitVote(optionId) {
  if (state.voting || state.myVote) return;
  state.voting = true;
  confirmVote.disabled = true;
  confirmVote.textContent = "Registrando…";
  renderGallery();

  try {
    await fetchJson("/api/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    state.myVote = optionId;
    showToast("Voto registrado. Obrigado por escolher o próximo manto!");
    await refreshResults();
  } catch (error) {
    if (error.status === 409 && error.payload?.optionId) {
      state.myVote = error.payload.optionId;
      showToast("Esta conexão já tinha um voto registrado.");
      render();
    } else {
      showToast(error.message);
    }
  } finally {
    state.voting = false;
    confirmVote.disabled = false;
    confirmVote.textContent = "Confirmar voto";
    voteDialog.close();
    render();
  }
}

grid.addEventListener("click", (event) => {
  const preview = event.target.closest("[data-preview]");
  if (preview) return openImage(Number(preview.dataset.preview));
  const vote = event.target.closest("[data-vote]");
  if (vote) openVoteDialog(Number(vote.dataset.vote));
});

confirmVote.addEventListener("click", (event) => {
  event.preventDefault();
  submitVote(state.pendingVote);
});
document.querySelector("#close-image").addEventListener("click", () => imageDialog.close());

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;

  context.registerTool({
    name: "get_shirt_vote_results",
    title: "Consultar votação das camisas",
    description: "Retorna o placar atual das 20 camisas do Na Bala F.C.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: refreshResults,
  });

  context.registerTool({
    name: "cast_shirt_vote",
    title: "Votar em uma camisa",
    description: "Registra o único voto permitido para este IP em uma camisa numerada de 1 a 20.",
    inputSchema: {
      type: "object",
      properties: { optionId: { type: "integer", minimum: 1, maximum: 20 } },
      required: ["optionId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute({ optionId }) {
      await submitVote(Number(optionId));
      return { ok: state.myVote === Number(optionId), optionId: state.myVote };
    },
  });
}

render();
loadInitialState();
registerWebMcpTools();
window.setInterval(() => refreshResults().catch(() => {}), 30000);

