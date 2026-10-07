import { json, voterHash } from "../_shared.js";

export async function onRequestGet({ request, env }) {
  try {
    const ipHash = await voterHash(request, env);
    const vote = await env.DB.prepare(
      "SELECT option_id AS optionId FROM votes WHERE ip_hash = ? LIMIT 1",
    ).bind(ipHash).first();

    return json({ hasVoted: Boolean(vote), optionId: vote?.optionId || null });
  } catch (error) {
    console.error("status_error", error);
    return json({ error: "Não foi possível verificar seu voto agora." }, 503);
  }
}

