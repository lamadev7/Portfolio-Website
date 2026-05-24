/**
 * SCENE 6 — ORCHESTRATOR LIVE: visual routing diagram with packets
 * animating along edges. Result of the agents code in scene 5.
 */
import { W, H, clear, bgGrid, titlebar, scanlines, type SceneParams } from "./helpers";

interface SubNode { id: string; scope: string; x: number; }

const SUBS: SubNode[] = [
  { id: "sub_agent_1", scope: "reconciliation", x: W * 0.22 },
  { id: "sub_agent_2", scope: "runbook exec",   x: W * 0.50 },
  { id: "sub_agent_3", scope: "routing",        x: W * 0.78 },
];

type LineState = "idle" | "flowing-out" | "working" | "flowing-back" | "done";

function drawBoxNode(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, sub: string, active: boolean, accent: string,
) {
  ctx.fillStyle = active ? "rgba(200,255,44,0.12)" : "rgba(15,17,15,0.9)";
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = active ? "#" + accent : "rgba(255,255,255,0.18)";
  ctx.lineWidth = active ? 2 : 1;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = "#" + accent;
  ctx.lineWidth = 1.5;
  ([[-1,-1],[1,-1],[-1,1],[1,1]] as const).forEach(([sx, sy]) => {
    const cx = x + sx * (w / 2), cy = y + sy * (h / 2);
    ctx.beginPath();
    ctx.moveTo(cx - sx * 8, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy - sy * 8);
    ctx.stroke();
  });
  ctx.fillStyle = active ? "#" + accent : "#e9efe6";
  ctx.font = "bold 16px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 2);
  ctx.fillStyle = "#5a605a";
  ctx.font = "10px JetBrains Mono, monospace";
  ctx.fillText(sub, x, y + 18);
  ctx.textAlign = "start";
}

export function drawOrchestratorLive(ctx: CanvasRenderingContext2D, t: number, p: SceneParams) {
  clear(ctx);
  bgGrid(ctx);
  titlebar(ctx, p.accentHex, "orchestrator.live · ws://internal · routing visualizer");

  const orchX = W / 2, orchY = 130;
  const orchW = 240, orchH = 60;
  const subY = 360, subW = 200, subH = 60;

  // Determine which sub-agent is active right now
  const cycleS = 7.0;
  const cy = t % cycleS;
  let activeIdx = -1;
  let lineState: LineState = "idle";
  let lineProgress = 0;
  if (cy < 0.4) {
    lineState = "idle"; activeIdx = -1;
  } else if (cy < 1.8) {
    activeIdx = Math.floor(t / cycleS) % 3;
    lineState = "flowing-out";
    lineProgress = (cy - 0.4) / 1.4;
  } else if (cy < 4.0) {
    activeIdx = Math.floor(t / cycleS) % 3;
    lineState = "working";
  } else if (cy < 5.4) {
    activeIdx = Math.floor(t / cycleS) % 3;
    lineState = "flowing-back";
    lineProgress = (cy - 4.0) / 1.4;
  } else {
    activeIdx = Math.floor(t / cycleS) % 3;
    lineState = "done";
  }

  // edges with animated packet
  SUBS.forEach((s, i) => {
    const ax = orchX, ay = orchY + orchH / 2;
    const bx = s.x,   by = subY  - subH / 2;
    const isActive = i === activeIdx;
    ctx.strokeStyle = isActive ? "#" + p.accentHex : "rgba(255,255,255,0.10)";
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.setLineDash(isActive ? [6, 4] : [2, 4]);
    ctx.lineDashOffset = isActive ? -(t * 30) : 0;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2 + 30;
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    if (isActive && (lineState === "flowing-out" || lineState === "flowing-back")) {
      const frac = lineState === "flowing-out" ? lineProgress : 1 - lineProgress;
      const it = 1 - frac;
      const px = it * it * ax + 2 * it * frac * mx + frac * frac * bx;
      const py = it * it * ay + 2 * it * frac * my + frac * frac * by;
      ctx.fillStyle = "#" + p.accentHex;
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(200,255,44,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.stroke();
    }
  });

  // orchestrator (top)
  drawBoxNode(ctx, orchX, orchY, orchW, orchH, "orchestrator", "Claude · MCP · A2A", activeIdx >= 0, p.accentHex);

  // sub-agents (bottom row)
  SUBS.forEach((s, i) => {
    const isActive = i === activeIdx;
    drawBoxNode(ctx, s.x, subY, subW, subH, s.id, s.scope, isActive, p.accentHex);

    if (isActive && lineState === "working") {
      const a = (t * 4) % (Math.PI * 2);
      ctx.strokeStyle = "#" + p.accentHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x + subW / 2 - 12, subY - subH / 2 + 12, 7, a, a + Math.PI * 1.4);
      ctx.stroke();
    }
    if (isActive && lineState === "done") {
      ctx.strokeStyle = "#" + p.accentHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + subW / 2 - 18, subY - subH / 2 + 12);
      ctx.lineTo(s.x + subW / 2 - 12, subY - subH / 2 + 18);
      ctx.lineTo(s.x + subW / 2 - 4,  subY - subH / 2 + 6);
      ctx.stroke();
    }
  });

  // dispatch log panel
  ctx.fillStyle = "rgba(15,17,15,0.8)";
  ctx.fillRect(40, 460, W - 80, 80);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.strokeRect(40, 460, W - 80, 80);
  ctx.fillStyle = "#5a605a";
  ctx.font = "10px JetBrains Mono, monospace";
  ctx.fillText("DISPATCH LOG", 52, 478);

  const messages = [
    "→ orchestrator.plan(task_7841)",
    lineState === "idle" ? "  idle …" :
    lineState === "flowing-out" ? "  → routing → " + SUBS[activeIdx].id :
    lineState === "working" ? "  " + SUBS[activeIdx].id + ".run() · in-flight" :
    lineState === "flowing-back" ? "  ← " + SUBS[activeIdx].id + " · returning result" :
    "  ✓ " + SUBS[activeIdx].id + " · ok",
    activeIdx >= 0
      ? "  agent: " + SUBS[activeIdx].id + " · scope: " + SUBS[activeIdx].scope
      : "  awaiting tasks…",
  ];
  ctx.font = "13px JetBrains Mono, monospace";
  messages.forEach((m, i) => {
    const y = 500 + i * 16;
    const isOk = m.includes("✓");
    ctx.fillStyle = m.startsWith("→") ? "#" + p.accentHex : isOk ? "#" + p.accentHex : "#e9efe6";
    ctx.fillText(m, 52, y);
  });

  // bottom statusbar
  ctx.fillStyle = "#" + p.accentHex;
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = "#070907";
  ctx.font = "12px JetBrains Mono, monospace";
  ctx.fillText("● orchestrator healthy · 3/3 sub-agents · MCP tools loaded", 12, H - 8);

  scanlines(ctx);
}
