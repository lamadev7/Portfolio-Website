import dynamic from "next/dynamic";
import SectionHead from "@/components/ui/SectionHead";

/**
 * AgentGraph is a heavy client component (SVG state, animation loop).
 * Dynamic-load it with ssr:false so it doesn't bloat the initial HTML.
 */
const AgentGraph = dynamic(() => import("@/components/agents/AgentGraph"), {
  ssr: false,
  loading: () => (
    <div className="agent-panel">
      <div className="panel-head">
        <span>orchestrator.live · loading…</span>
      </div>
      <div className="graph" />
    </div>
  ),
});

export default function AgentsSection() {
  return (
    <section id="agents" data-screen-label="04 Agents">
      <SectionHead num="// 03" title="Agentic AI · on the boundaries between agents." meta="live simulator" />
      <div className="agents">
        <div className="intro">
          <h3>
            The interesting question isn&apos;t <em>can the model do this task?</em>
          </h3>
          <p>
            That question is mostly settled. It&apos;s <em>what should this agent be allowed to know,
            decide, and remember?</em> Get those edges wrong and you&apos;ve built a confident, helpful,
            expensive distributed system that occasionally invoices someone twice.
          </p>
          <p>
            At PortPro I&apos;m building an orchestrator that routes work to three specialised sub-agents.
            The model picks the action. The orchestrator picks the agent. The engineer picks where the
            boundaries go — that&apos;s the job.
          </p>
          <p style={{ color: "var(--ink-faint)", fontSize: 12 }}>
            → click a node to dispatch a run · or run the orchestrator end-to-end.
          </p>
          <div className="agents-stack">
            stack · <span>Google ADKs</span> · <span>MCP</span> · <span>Claude Agents</span>
          </div>
        </div>
        <AgentGraph />
      </div>
    </section>
  );
}
