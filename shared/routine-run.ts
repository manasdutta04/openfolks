/** Durable, non-actionable projection of one background routine run.
 *
 * The provider still runs in its isolated execution task. This small card is
 * upserted into the trusted conversation that created the routine so the user
 * can see progress, results, and where to review an approval without hunting
 * through the routines calendar.
 */
export interface RoutineRunCardData {
  runId: string;
  routineId: string;
  routineName: string;
  status: "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled" | "missed";
  executionThreadId?: string;
  summary?: string;
  error?: string;
}
