/**
 * Durable payload carried by a chat routine confirmation card.
 *
 * Tool input is normalized before it reaches this shape: timestamps are
 * milliseconds, weekly day names are the scheduler's numeric weekday values,
 * and every text field has already been scrubbed for credential-shaped data.
 * Keeping the normalized operation on the card lets a confirmation survive an
 * app restart without asking the model to interpret the request again.
 */

export type RoutineRequestRunOn = "maus" | "cloud";

export type RoutineRequestSchedule =
  | { type: "once"; at: number }
  | { type: "daily"; time: string; weekdays: number[] };

export interface RoutineRequestDefinition {
  name: string;
  instructions: string;
  schedule: RoutineRequestSchedule;
  runOn: RoutineRequestRunOn;
  durationMinutes: number;
}

export type RoutineRequestChanges = Partial<RoutineRequestDefinition>;

/** Another bot in the proposer's section that the routine is scheduled for.
 * Captured (id + display name) when the card is created so the card stays
 * meaningful if the bot is later renamed; authority over the card remains
 * with the proposing conversation. */
export interface RoutineRequestTargetBot {
  botId: string;
  name: string;
}

export type RoutineRequestOperation =
  | { action: "create"; routine: RoutineRequestDefinition; forBot?: RoutineRequestTargetBot }
  | { action: "update"; routineId: string; expectedUpdatedAt: number; changes: RoutineRequestChanges }
  | { action: "pause"; routineId: string; expectedUpdatedAt: number }
  | { action: "resume"; routineId: string; expectedUpdatedAt: number }
  | { action: "run_now"; routineId: string; expectedUpdatedAt: number }
  | { action: "delete"; routineId: string; expectedUpdatedAt: number };

export interface RoutineRequestCardData {
  version: 1;
  /** Also used as the scheduler's idempotency key after confirmation. */
  requestId: string;
  /** Authority is fixed when the card is created; an agent cannot redirect it later. */
  botId: string;
  threadId: string;
  createdAt: number;
  operation: RoutineRequestOperation;
  /** Written after a successful confirmation. Useful for support/debugging. */
  appliedAt?: number;
  resultId?: string;
}
