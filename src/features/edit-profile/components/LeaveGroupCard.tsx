export function LeaveGroupCard() {
  return (
    <div className="astro-card border-[rgba(224,72,63,0.3)] p-[22px]">
      <div className="mb-1.5 text-sm font-extrabold text-astro-red">Leave the group</div>
      <p className="text-[13px] text-astro-text-muted [text-wrap:pretty]">
        Your stats and ratings stay in the record. Want to leave? Ask an admin in the group chat.
      </p>
    </div>
  )
}
