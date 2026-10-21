const SOURCE = "https://status.jia.nz/api/live-state";
const SERVICE_IDS = ["jia-blog", "jia-cook", "jia-status", "jia-td2"];
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export async function onRequestGet() {
  try {
    const response = await fetch(SOURCE, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Status source unavailable");
    const payload = await response.json();
    const sourceServices = Array.isArray(payload.services) ? payload.services : [];
    const services = SERVICE_IDS.map((id) => {
      const service = sourceServices.find((item) => item.id === id);
      return {
        id,
        status: ["operational", "degraded", "maintenance", "partial_outage", "major_outage", "outage", "down"].includes(service?.status)
          ? service.status
          : "unknown",
      };
    });
    return Response.json(
      { available: payload.available === true, services },
      { headers: HEADERS },
    );
  } catch {
    return Response.json(
      { available: false, services: SERVICE_IDS.map((id) => ({ id, status: "unknown" })) },
      { status: 503, headers: HEADERS },
    );
  }
}
