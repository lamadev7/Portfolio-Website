"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Interactive orchestrator graph.
 *
 * SVG viewBox is 130×100 (1.3:1) — matches the panel's intended aspect ratio
 * so nothing stretches. Click a sub-agent node to dispatch its scenario;
 * click the orchestrator to run all three.
 */

interface AgentNode {
  id: string;
  label: string;
  scope: string;
  x: number;
  y: number;
}

interface LogLine {
  t: "input" | "route" | "work" | "ok" | "head";
  text: string;
  from: string;
}

const AGENTS: AgentNode[] = [
  { id: "a1", label: "sub_agent_1", scope: "reconciliation", x: 22, y: 74 },
  { id: "a2", label: "sub_agent_2", scope: "runbook exec",   x: 65, y: 86 },
  { id: "a3", label: "sub_agent_3", scope: "load + routing", x: 108, y: 74 },
];
const ORCH: AgentNode = { id: "orch", label: "orchestrator", scope: "", x: 65, y: 24 };

const SCENARIOS: Record<string, LogLine[]> = {
  a1: [
    { from: "user", t: "input", text: "[user] reconcile entry #84122" },
    { from: "orch", t: "route", text: "→ route → sub_agent_1" },
    { from: "a1",   t: "work",  text: "sub_agent_1.scan(84122)" },
    { from: "a1",   t: "work",  text: "  ↳ 1 candidate found" },
    { from: "a1",   t: "ok",    text: "✓ sub_agent_1.resolve() ok" },
    { from: "orch", t: "ok",    text: "→ orchestrator.respond() ok" },
  ],
  a2: [
    { from: "user", t: "input", text: "[user] run playbook · task_7841" },
    { from: "orch", t: "route", text: "→ route → sub_agent_2" },
    { from: "a2",   t: "work",  text: "sub_agent_2.load('task.yaml')" },
    { from: "a2",   t: "work",  text: "  ↳ step 1/4 · fetch context" },
    { from: "a2",   t: "work",  text: "  ↳ step 4/4 · synthesize" },
    { from: "a2",   t: "ok",    text: "✓ sub_agent_2.run() ok" },
  ],
  a3: [
    { from: "user", t: "input", text: "[user] assign worker · LX-2901" },
    { from: "orch", t: "route", text: "→ route → sub_agent_3" },
    { from: "a3",   t: "work",  text: "sub_agent_3.candidates(LX-2901)" },
    { from: "a3",   t: "work",  text: "  ↳ 3 candidates · constraint check" },
    { from: "a3",   t: "work",  text: "  ↳ assigning · worker #W-4427" },
    { from: "a3",   t: "ok",    text: "✓ sub_agent_3.assign() ok" },
  ],
  all: [
    { from: "user", t: "input", text: "[user] coordinate task_7841 end-to-end" },
    { from: "orch", t: "route", text: "→ orchestrator.plan() ↦ [a1, a3]" },
    { from: "a1",   t: "work",  text: "sub_agent_1.resolve(7841)" },
    { from: "a1",   t: "ok",    text: "✓ resolved · 2 entries" },
    { from: "a3",   t: "work",  text: "sub_agent_3.assign(7841)" },
    { from: "a3",   t: "ok",    text: "✓ assigned · worker #W-4427" },
    { from: "orch", t: "ok",    text: "✓ orchestrator complete · 1.42s" },
  ],
};

const INITIAL_LOG: LogLine[] = [
  { t: "ok", text: "orchestrator.ready() · 3 sub-agents healthy", from: "orch" },
];

export default function AgentGraph() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [running, setRunning] = useState<keyof typeof SCENARIOS | null>(null);
  const [log, setLog] = useState<LogLine[]>(INITIAL_LOG);
  const [tick, setTick] = useState(0);

  // tick clock for pulsing edges
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const frame = () => {
      setTick((performance.now() - start) / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // scenario player
  useEffect(() => {
    if (!running) return;
    const steps = SCENARIOS[running];
    let i = 0;
    setLog((l) => [...l.slice(-3), { t: "head", text: `─── run · ${running} ───`, from: "orch" }]);
    setActive(null);
    const interval = setInterval(() => {
      const step = steps[i];
      if (!step) {
        clearInterval(interval);
        setRunning(null);
        setActive(null);
        return;
      }
      setLog((l) => [...l, step].slice(-9));
      if (step.from !== "user" && step.from !== "orch") setActive(step.from);
      else if (step.from === "orch") setActive("orch");
      i++;
    }, 600);
    return () => clearInterval(interval);
  }, [running]);

  const onRun = (id: keyof typeof SCENARIOS) => { if (!running) setRunning(id); };

  return (
    <div className="agent-panel">
      <PanelHead />
      <div className="graph">
        <svg viewBox="0 0 130 100" preserveAspectRatio="xMidYMid meet">
          <TrustBoundary />
          {AGENTS.map((a) => (
            <Edge key={a.id} a={ORCH} b={a} agentId={a.id} active={active} hovered={hovered} tick={tick} />
          ))}
          <Node n={ORCH} kind="orch" active={active} hovered={hovered} tick={tick} running={running}
                setHovered={setHovered} setRunning={setRunning} />
          {AGENTS.map((a) => (
            <Node key={a.id} n={a} kind="agent" active={active} hovered={hovered} tick={tick} running={running}
                  setHovered={setHovered} setRunning={setRunning} />
          ))}
        </svg>
      </div>
      <div className="log">
        {log.map((l, i) => (
          <div className="line" key={i}>
            <span className="t">[{String(i).padStart(2, "0")}]</span>{" "}
            <span className={l.t === "ok" ? "ok" : l.t === "head" ? "a" : ""}>{l.text}</span>
          </div>
        ))}
      </div>
      <Controls running={running} onRun={onRun} />
    </div>
  );
}

/* ------------------- subcomponents (kept inline; only used here) ------------------- */

function PanelHead() {
  return (
    <div className="panel-head">
      <span>orchestrator.live · ws://internal</span>
      <span className="lamps">
        <span className="lamp on" />
        <span className="lamp on" />
        <span className="lamp" />
      </span>
    </div>
  );
}

function TrustBoundary() {
  return (
    <>
      <rect x="3" y="3" width="124" height="94" fill="none" stroke="var(--rule)" strokeWidth="0.3"
            strokeDasharray="0.6 1.2" vectorEffect="non-scaling-stroke" />
      {[[3,3,1],[127,3,2],[3,97,3],[127,97,4]].map(([x, y, k]) => (
        <g key={k}>
          <line x1={x} y1={y} x2={x + (k%2===1?5:-5)} y2={y} stroke="var(--accent)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1={x} y1={y} x2={x} y2={y + (k<3?5:-5)} stroke="var(--accent)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <text x="65" y="6.5" textAnchor="middle" fill="var(--ink-faint)" fontSize="2"
            fontFamily="var(--mono)" style={{ letterSpacing: ".22em" }}>
        ── ORCHESTRATOR · TRUST BOUNDARY ──
      </text>
    </>
  );
}

interface EdgeProps {
  a: AgentNode; b: AgentNode; agentId: string;
  active: string | null; hovered: string | null; tick: number;
}
function Edge({ a, b, agentId, active, hovered, tick }: EdgeProps) {
  const isActive = active === agentId || active === "orch";
  const isHovered = hovered === agentId;
  const dash = isActive ? 12 - (tick * 30) % 12 : 0;
  return (
    <g>
      <line
        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={isActive || isHovered ? "var(--accent)" : "var(--rule-2)"}
        strokeWidth={isActive ? 0.6 : 0.3}
        strokeDasharray={isActive ? "2 1.5" : "0.6 1.4"}
        strokeDashoffset={dash * 0.3}
        opacity={isActive ? 1 : 0.7}
        vectorEffect="non-scaling-stroke"
      />
      {isActive && (
        <circle
          cx={a.x + (b.x - a.x) * ((tick * 0.35) % 1)}
          cy={a.y + (b.y - a.y) * ((tick * 0.35) % 1)}
          r="0.9"
          fill="var(--accent)"
        />
      )}
    </g>
  );
}

interface NodeProps {
  n: AgentNode;
  kind: "orch" | "agent";
  active: string | null;
  hovered: string | null;
  tick: number;
  running: string | null;
  setHovered: (id: string | null) => void;
  setRunning: (id: keyof typeof SCENARIOS) => void;
}
function Node({ n, kind, active, hovered, tick, running, setHovered, setRunning }: NodeProps) {
  const isActive = active === n.id;
  const isHovered = hovered === n.id;
  const stroke = isActive ? "var(--accent)" : isHovered ? "var(--ink)" : "var(--rule-2)";
  const fill = isActive ? "var(--accent-soft)" : "rgba(15,17,15,.92)";
  const w = kind === "orch" ? 30 : 24;
  const h = 9;
  const x = n.x - w / 2;
  const y = n.y - h / 2;

  const onClick = () => {
    if (running) return;
    setRunning(n.id === "orch" ? "all" : (n.id as keyof typeof SCENARIOS));
  };

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(n.id)}
      onMouseLeave={() => setHovered(null)}
      onClick={onClick}
    >
      {isActive && (
        <rect
          x={x - 1.4} y={y - 1.4} width={w + 2.8} height={h + 2.8}
          fill="none" stroke="var(--accent)" strokeWidth="0.3"
          opacity={0.4 + Math.sin(tick * 4) * 0.3}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="transparent" />
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth="0.4"
            vectorEffect="non-scaling-stroke" />
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx, sy], idx) => {
        const cx = n.x + sx * (w / 2);
        const cy = n.y + sy * (h / 2);
        return (
          <g key={idx}>
            <line x1={cx} y1={cy} x2={cx - sx * 2} y2={cy}
              stroke={isActive ? "var(--accent)" : "var(--ink-dim)"} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            <line x1={cx} y1={cy} x2={cx} y2={cy - sy * 1.4}
              stroke={isActive ? "var(--accent)" : "var(--ink-dim)"} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      <text
        x={n.x} y={n.y + 0.6}
        textAnchor="middle" dominantBaseline="middle"
        fill={isActive ? "var(--accent)" : "var(--ink)"}
        fontSize="2.6"
        fontFamily="var(--mono)"
        style={{ letterSpacing: ".02em", pointerEvents: "none" }}
      >
        {n.label}
      </text>
      {kind === "orch" ? (
        <text x={n.x} y={n.y - h / 2 - 2.2} textAnchor="middle" fill="var(--ink-faint)" fontSize="1.9"
              fontFamily="var(--mono)" style={{ letterSpacing: ".12em", pointerEvents: "none" }}>
          ROOT · CLICK TO RUN ALL
        </text>
      ) : (
        <text x={n.x} y={n.y + h / 2 + 3.2} textAnchor="middle"
              fill={isHovered ? "var(--ink)" : "var(--ink-faint)"} fontSize="2.2"
              fontFamily="var(--mono)" style={{ letterSpacing: ".04em", pointerEvents: "none" }}>
          {n.scope}
        </text>
      )}
    </g>
  );
}

function Controls({ running, onRun }: { running: string | null; onRun: (id: keyof typeof SCENARIOS) => void }) {
  const buttons = useMemo(() => ([
    { id: "a1" as const,  label: "▸ run sub_agent_1" },
    { id: "a2" as const,  label: "▸ run sub_agent_2" },
    { id: "a3" as const,  label: "▸ run sub_agent_3" },
  ]), []);
  return (
    <div className="agent-controls">
      {buttons.map((b) => (
        <button
          key={b.id}
          className={running === b.id ? "running" : ""}
          onClick={() => onRun(b.id)}
        >
          {b.label}
        </button>
      ))}
      <button
        className={running === "all" ? "running" : ""}
        onClick={() => onRun("all")}
        style={{ marginLeft: "auto" }}
      >
        ▸ orchestrate all
      </button>
    </div>
  );
}
