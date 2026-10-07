import { json } from "../_shared.js";

export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT option_id AS optionId, COUNT(*) AS votes FROM votes GROUP BY option_id ORDER BY votes DESC, option_id ASC",
    ).all();

    const totals = Array.from({ length: 20 }, (_, index) => ({
      optionId: index + 1,
      votes: 0,
    }));

    for (const row of result.results || []) {
      const target = totals[row.optionId - 1];
      if (target) target.votes = Number(row.votes);
    }

    return json({
      results: totals,
      totalVotes: totals.reduce((sum, item) => sum + item.votes, 0),
    });
  } catch (error) {
    console.error("results_error", error);
    return json({ error: "Não foi possível carregar o placar agora." }, 503);
  }
}

