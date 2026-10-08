export default function MemberAvatar({ member, large = false }) {
  return <span className={`avatar member-avatar${large ? ' member-avatar-large' : ''} avatar-${Number(member.id.slice(-1)) % 5}`} aria-hidden="true">{member.initials}</span>;
}
