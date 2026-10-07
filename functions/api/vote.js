import { isValidOption, json, voterHash } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Envie uma opção válida." }, 400);
  }

  const optionId = Number(body?.optionId);
  if (!isValidOption(optionId)) {
    return json({ error: "Essa camisa não existe." }, 400);
  }

  try {
    const ipHash = await voterHash(request, env);
    await env.DB.prepare(
      "INSERT INTO votes (option_id, ip_hash) VALUES (?, ?)",
    ).bind(optionId, ipHash).run();

    return json({ ok: true, optionId }, 201);
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("UNIQUE") || message.includes("unique")) {
      const ipHash = await voterHash(request, env);
      const existing = await env.DB.prepare(
        "SELECT option_id AS optionId FROM votes WHERE ip_hash = ? LIMIT 1",
      ).bind(ipHash).first();
      return json({
        error: "Este IP já registrou um voto.",
        optionId: existing?.optionId || null,
      }, 409);
    }

    console.error("vote_error", error);
    return json({ error: "Não foi possível registrar o voto agora." }, 503);
  }
}

