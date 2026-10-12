/**
 * Folk-to-folk channels (group.dm) belong to the folks: the harness mirrors
 * their exchange in and refuses user messages, so the Desk shows them read-only.
 */
export function groupAcceptsUserMessages(group: { dm?: boolean }): boolean {
  return !group.dm;
}
