import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as vote } from "../functions/api/vote.js";
import { onRequestGet as status } from "../functions/api/status.js";
import { onRequestGet as results } from "../functions/api/results.js";

class FakeD1 {
  constructor() {
    this.rows = new Map();
  }

  prepare(sql) {
    const database = this;
    return {
      values: [],
      bind(...values) {
        this.values = values;
        return this;
      },
      async run() {
        const [optionId, ipHash] = this.values;
        if (database.rows.has(ipHash)) throw new Error("UNIQUE constraint failed: votes.ip_hash");
        database.rows.set(ipHash, optionId);
        return { success: true };
      },
      async first() {
        const [ipHash] = this.values;
        const optionId = database.rows.get(ipHash);
        return optionId ? { optionId } : null;
      },
      async all() {
        const counts = new Map();
        for (const optionId of database.rows.values()) counts.set(optionId, (counts.get(optionId) || 0) + 1);
        return { results: [...counts].map(([optionId, votes]) => ({ optionId, votes })) };
      },
    };
  }
}

function request(path, ip, body) {
  return new Request(`https://camisas.example${path}`, {
    method: body ? "POST" : "GET",
    headers: { "CF-Connecting-IP": ip, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test("stores one vote per IP and returns a live tally", async () => {
  const env = { DB: new FakeD1(), IP_HASH_SALT: "test-secret" };

  const first = await vote({ request: request("/api/vote", "203.0.113.10", { optionId: 7 }), env });
  assert.equal(first.status, 201);

  const duplicate = await vote({ request: request("/api/vote", "203.0.113.10", { optionId: 8 }), env });
  assert.equal(duplicate.status, 409);
  assert.deepEqual(await duplicate.json(), { error: "Este IP já registrou um voto.", optionId: 7 });

  const voterStatus = await status({ request: request("/api/status", "203.0.113.10"), env });
  assert.deepEqual(await voterStatus.json(), { hasVoted: true, optionId: 7 });

  const tally = await results({ env });
  const payload = await tally.json();
  assert.equal(payload.totalVotes, 1);
  assert.equal(payload.results[6].votes, 1);
  assert.equal(payload.results[7].votes, 0);
});
