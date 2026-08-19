import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReviewProposal } from "@/types";

/** Renders the message body with "• " lines grouped into a checklist and the rest as
 * plain paragraphs, so legal/declaration text reads as a scannable document instead of
 * one dense block. Falls back gracefully for messages with no bullets at all. */
function MessageBody({ message }: { message: string }) {
  const lines = message.split("\n");
  const blocks: { type: "paragraph" | "list"; lines: string[] }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const isBullet = line.startsWith("•");
    const text = isBullet ? line.replace(/^•\s*/, "") : line;
    const lastBlock = blocks[blocks.length - 1];
    const blockType = isBullet ? "list" : "paragraph";
    if (lastBlock && lastBlock.type === blockType) {
      lastBlock.lines.push(text);
    } else {
      blocks.push({ type: blockType, lines: [text] });
    }
  }

  return (
    <div dir="auto" className="flex flex-col gap-4">
      {blocks.map((block, i) =>
        block.type === "list" ? (
          <ul key={i} className="flex flex-col gap-2.5">
            {block.lines.map((item, j) => (
              <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-sm leading-relaxed text-gray-700">
            {block.lines.join(" ")}
          </p>
        )
      )}
    </div>
  );
}

export function ProposalDetails({ proposal }: { proposal: ReviewProposal }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Proposal</p>
          <h2 className="text-xl font-semibold text-gray-900">{proposal.title}</h2>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Company</dt>
          <dd className="mt-1 text-sm text-gray-800">{proposal.company_name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Contact Person</dt>
          <dd className="mt-1 text-sm text-gray-800">{proposal.contact_person}</dd>
        </div>
        {proposal.phone && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Phone Number</dt>
            <dd className="mt-1 text-sm text-gray-800">{proposal.phone}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-900 text-xs text-white">
            📄
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Message for your review</p>
        </div>
        <MessageBody message={proposal.message} />
      </div>

      {proposal.attachments.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Attachments</p>
          <ul className="mt-2 flex flex-col gap-1">
            {proposal.attachments.map((att) => (
              <li key={att.id}>
                <a
                  href={att.file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline hover:text-blue-800"
                >
                  📎 {att.file_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
