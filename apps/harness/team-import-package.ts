import { packageAgentAsMember, type BotPackageDefinition } from "./bot-package.ts";
import { importedMemberProfile } from "./team-manifest.ts";
import type { RoutineSchedule } from "./routines.ts";
import type { GroupRecord, Store } from "./store.ts";

export interface RoutineImporter {
  create(input: {
    name: string;
    prompt: string;
    botId: string;
    runOn: "maus" | "cloud";
    enabled: boolean;
    schedule: RoutineSchedule;
    durationMinutes?: number;
  }): { id: string };
}

export interface ImportBotPackageInput {
  store: Store;
  pkg: BotPackageDefinition;
  selection: { instanceId: string; model: string };
  sectionOverride?: string;
  cwd?: string | null;
  routines?: RoutineImporter;
}

export interface ImportBotPackageResult {
  botIds: string[];
  groupIds: string[];
  routineIds: string[];
  section?: string;
  importedBots: ReturnType<Store["createBot"]>[];
  createdGroups: GroupRecord[];
}

/** Import a bot package: agents, playbooks, rooms, routines, and chief of staff. */
export function importBotPackage(input: ImportBotPackageInput): ImportBotPackageResult {
  const { store, pkg, selection, sectionOverride, cwd, routines } = input;
  const takenNames = new Set(store.bots.map((bot) => bot.name.trim().toLowerCase()));
  const memberIds = new Map<string, string>();
  const importedBots: ReturnType<Store["createBot"]>[] = [];
  const createdGroups: GroupRecord[] = [];
  const routineIds: string[] = [];

  const existingSections = new Set(
    [...store.bots.map((bot) => bot.section), ...store.groups.map((candidate) => candidate.section)]
      .filter((section): section is string => Boolean(section?.trim()))
      .map((section) => section.toLowerCase()),
  );
  let packageSection = sectionOverride ?? pkg.name;
  if (packageSection) {
    const stem = packageSection;
    for (let suffix = 2; existingSections.has(packageSection.toLowerCase()); suffix++) {
      packageSection = `${stem} ${suffix}`;
    }
  }

  const playbookByKey = new Map((pkg.playbooks ?? []).map((playbook) => [playbook.key, playbook]));
  for (const agent of pkg.agents) {
    const member = packageAgentAsMember(agent);
    const created = store.createBot(
      {
        ...importedMemberProfile(member, takenNames),
        modelSelection: selection,
        ...(packageSection ? { section: packageSection } : {}),
      },
      { seedMessages: false },
    );
    const installedPlaybooks = (agent.playbooks ?? []).flatMap((key) => {
      const playbook = playbookByKey.get(key);
      return playbook ? [{ ...playbook }] : [];
    });
    store.patchBot(created.id, {
      composio: false,
      ...(cwd ? { cwd } : {}),
      ...(installedPlaybooks.length ? { playbooks: installedPlaybooks } : {}),
      installedPackage: {
        id: pkg.id,
        name: pkg.name,
        release: pkg.release,
        requiredApps: pkg.requirements.apps.map((app) => ({ ...app })),
      },
    });
    importedBots.push(created);
    memberIds.set(member.key, created.id);
  }

  for (const room of pkg.rooms ?? []) {
    const ids = room.members.map((key) => memberIds.get(key)!);
    let created = store.createGroup(room.name, ids, false, packageSection);
    const defaultResponder =
      room.defaultResponder.kind === "agent"
        ? { kind: "member" as const, botId: memberIds.get(room.defaultResponder.agent)! }
        : ({ kind: room.defaultResponder.kind } as const);
    const groupPatch: Parameters<Store["patchGroup"]>[1] = {
      bulletin: room.bulletin ?? "",
      defaultResponder,
      setupCompletedAt: Date.now(),
    };
    if (cwd) groupPatch.cwd = cwd;
    created = store.patchGroup(created.id, groupPatch) ?? created;
    createdGroups.push(created);
  }

  for (const routine of pkg.routines ?? []) {
    if (!routines) continue;
    const created = routines.create({
      name: routine.name,
      prompt: routine.prompt,
      botId: memberIds.get(routine.agent)!,
      runOn: routine.runOn,
      enabled: false,
      schedule: routine.schedule,
      durationMinutes: routine.durationMinutes,
    });
    routineIds.push(created.id);
  }

  if (pkg.chiefOfStaff) {
    store.setChiefOfStaff(memberIds.get(pkg.chiefOfStaff)!);
  }

  return {
    botIds: importedBots.map((bot) => bot.id),
    groupIds: createdGroups.map((group) => group.id),
    routineIds,
    section: packageSection,
    importedBots,
    createdGroups,
  };
}
