import { commandSchema, type Member, type Vehicle, type Event } from "./schema";
import { applyCommand, FleetError } from "./operations";
import { fleetToday } from "./logic";
export { FleetError, canOperate, publicVehicle, publicEvent, stripVehicle } from "./operations";

/** HTTP boundary validates the complete payload before running the pure domain engine. */
export function buildMutation(input: unknown, me: Member, current: Vehicle | null, events: Event[], members: Member[], today = fleetToday()) {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) throw new FleetError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
  return applyCommand(parsed.data, me, current, events, members, today);
}
