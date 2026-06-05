import type {
  ActivityEvent,
  Alert,
  County,
  DashboardData,
  DashboardStats,
  Operator,
  Permit,
  RiskSummary,
} from "@/lib/types";

const mockStats: DashboardStats = {
  permitsThisWeek: 47,
  permitsWeekChangePct: 12,
  activeOperators: 128,
  operatorsChange: 3,
  activeRigs: 34,
};

const mockTopCounties: County[] = [
  { id: "mock-mckenzie", name: "McKenzie", permitsYtd: 412, rigs: 14, medianCycleDays: 118, topOperatorName: "Continental Resources", sharePct: 28 },
  { id: "mock-williams", name: "Williams", permitsYtd: 286, rigs: 9, medianCycleDays: 124, topOperatorName: "Hess Corporation", sharePct: 19 },
  { id: "mock-mountrail", name: "Mountrail", permitsYtd: 198, rigs: 7, medianCycleDays: 131, topOperatorName: "WPX Energy", sharePct: 14 },
  { id: "mock-dunn", name: "Dunn", permitsYtd: 164, rigs: 4, medianCycleDays: 127, topOperatorName: "Marathon Oil", sharePct: 11 },
  { id: "mock-divide", name: "Divide", permitsYtd: 121, rigs: 3, medianCycleDays: 136, topOperatorName: "Continental Resources", sharePct: 8 },
];

const mockLatestActivity: ActivityEvent[] = [
  { id: "mock-1", title: "Drilling permit approved", detail: "Hess — Elm Coulee 12-24H", countyName: "Williams", eventType: "permit", occurredAt: "2026-05-12T14:22:00Z" },
  { id: "mock-2", title: "Spud notification filed", detail: "Continental — Hawkeye Federal 5-32H", countyName: "McKenzie", eventType: "spud", occurredAt: "2026-05-12T11:05:00Z" },
  { id: "mock-3", title: "Completion report received", detail: "WPX — Missouri Ridge 14-33H", countyName: "Mountrail", eventType: "completion", occurredAt: "2026-05-11T16:40:00Z" },
  { id: "mock-4", title: "Gas capture plan update", detail: "Oasis — Sanish 8-21H", countyName: "Mountrail", eventType: "regulatory", occurredAt: "2026-05-11T09:18:00Z" },
  { id: "mock-5", title: "Water haul route variance", detail: "Marathon — Bailey 3-11H", countyName: "Dunn", eventType: "logistics", occurredAt: "2026-05-10T13:55:00Z" },
];

const mockRiskSummary: RiskSummary = {
  id: "mock-risk",
  headline: "Midstream and disposal headroom tightening in core McKenzie",
  bullets: [
    "Gas processing utilization in eastern McKenzie is trending above 88% on a 30-day average; new drilling clusters could push swing capacity earlier than modeled.",
    "Saltwater disposal capacity in southern Williams remains adequate, but permit-to-injection lead times have lengthened by roughly 9 business days quarter-over-quarter.",
    "Proppant and sand last-mile logistics show normal seasonal variance; no broad rail disruptions detected in the mock feed.",
  ],
  riskLevel: "elevated",
  generatedAt: "2026-05-12T08:00:00Z",
};

export const mockPermits: Permit[] = [
  { id: "mock-p1", externalId: "ND-26-08421", operatorId: null, operatorName: "Continental Resources", wellName: "Hawkeye Federal 5-32H", countyName: "McKenzie", permitType: "Drilling", status: "Approved", filedAt: "2026-05-10" },
  { id: "mock-p2", externalId: "ND-26-08407", operatorId: null, operatorName: "Hess Corporation", wellName: "Elm Coulee 12-24H", countyName: "Williams", permitType: "Drilling", status: "Under review", filedAt: "2026-05-09" },
  { id: "mock-p3", externalId: "ND-26-08398", operatorId: null, operatorName: "Marathon Oil", wellName: "Bailey 3-11H", countyName: "Dunn", permitType: "Drilling", status: "Approved", filedAt: "2026-05-08" },
  { id: "mock-p4", externalId: "ND-26-08376", operatorId: null, operatorName: "WPX Energy", wellName: "Missouri Ridge 14-33H", countyName: "Mountrail", permitType: "Recomplete", status: "Approved", filedAt: "2026-05-07" },
  { id: "mock-p5", externalId: "ND-26-08351", operatorId: null, operatorName: "Oasis Petroleum", wellName: "Sanish 8-21H", countyName: "Mountrail", permitType: "Drilling", status: "Awaiting bond", filedAt: "2026-05-06" },
  { id: "mock-p6", externalId: "ND-26-08322", operatorId: null, operatorName: "Whiting Petroleum", wellName: "Pronghorn 2-18H", countyName: "Mountrail", permitType: "Drilling", status: "Approved", filedAt: "2026-05-05" },
];

export const mockOperators: Operator[] = [
  { id: "mock-op-1", externalId: "op-continental", name: "Continental Resources", permitsYtd: 62, rigs: 8, hq: "Oklahoma City, OK", focus: "McKenzie / Williams", isActive: true },
  { id: "mock-op-2", externalId: "op-hess", name: "Hess Corporation", permitsYtd: 48, rigs: 6, hq: "Houston, TX", focus: "Williams", isActive: true },
  { id: "mock-op-3", externalId: "op-marathon", name: "Marathon Oil", permitsYtd: 35, rigs: 5, hq: "Houston, TX", focus: "Dunn / McKenzie", isActive: true },
  { id: "mock-op-4", externalId: "op-wpx", name: "WPX Energy", permitsYtd: 31, rigs: 4, hq: "Tulsa, OK", focus: "Mountrail", isActive: true },
  { id: "mock-op-5", externalId: "op-oasis", name: "Oasis Petroleum", permitsYtd: 24, rigs: 3, hq: "Houston, TX", focus: "Mountrail / Williams", isActive: true },
];

export const mockCounties: County[] = [
  { id: "mock-c-mckenzie", name: "McKenzie", permitsYtd: 412, rigs: 14, medianCycleDays: 118, topOperatorName: "Continental Resources" },
  { id: "mock-c-williams", name: "Williams", permitsYtd: 286, rigs: 9, medianCycleDays: 124, topOperatorName: "Hess Corporation" },
  { id: "mock-c-mountrail", name: "Mountrail", permitsYtd: 198, rigs: 7, medianCycleDays: 131, topOperatorName: "WPX Energy" },
  { id: "mock-c-dunn", name: "Dunn", permitsYtd: 164, rigs: 4, medianCycleDays: 127, topOperatorName: "Marathon Oil" },
  { id: "mock-c-divide", name: "Divide", permitsYtd: 121, rigs: 3, medianCycleDays: 136, topOperatorName: "Continental Resources" },
  { id: "mock-c-burke", name: "Burke", permitsYtd: 54, rigs: 2, medianCycleDays: 142, topOperatorName: "Smaller independents" },
];

export const mockAlerts: Alert[] = [
  { id: "mock-a1", severity: "warning", title: "Processing utilization threshold", body: "Eastern McKenzie gas plants trending above 88% utilization on trailing 30 days.", countyName: "McKenzie", createdAt: "2026-05-12T07:30:00Z" },
  { id: "mock-a2", severity: "info", title: "New permit cluster", body: "Five drilling permits filed within 6 miles near Sanish field in the last 72 hours.", countyName: "Mountrail", createdAt: "2026-05-11T15:12:00Z" },
  { id: "mock-a3", severity: "critical", title: "Disposal lead time", body: "Median SWD permit-to-injection interval increased 9 business days vs. prior quarter.", countyName: "Williams", createdAt: "2026-05-10T09:45:00Z" },
];

export function getMockDashboard(): DashboardData {
  return {
    stats: mockStats,
    topCounties: mockTopCounties,
    latestActivity: mockLatestActivity,
    riskSummary: mockRiskSummary,
  };
}
