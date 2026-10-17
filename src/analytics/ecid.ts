/**
 * ecid.ts — ECID (Experience Cloud ID Service) 헬퍼
 *
 * Launch의 ECID Extension이 로드된 후 window.Visitor 또는
 * window._satellite.getVar("ecid") 방식으로 ECID를 조회합니다.
 *
 * ECID Extension은 비동기 로드되므로 Promise 기반 폴링을 사용합니다.
 */

// ---------------------------------------------------------------------------
// ECID 조회 (Promise 기반)
// ---------------------------------------------------------------------------

const POLLING_INTERVAL_MS = 200;
const POLLING_TIMEOUT_MS = 10_000;

/**
 * Launch ECID Extension이 제공하는 ECID(MID)를 비동기로 조회합니다.
 * _satellite.getVar("ecid") 또는 window.Visitor 인스턴스를 통해 조회합니다.
 *
 * @param orgId  Experience Cloud Org ID (예: "XXXXXXXXXXXXXXXXXXXXXXXX@AdobeOrg")
 * @returns      ECID 문자열 또는 null (타임아웃 시)
 */
export function getECID(orgId?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    function attempt(): void {
      // 방법 1: _satellite.getVar("ecid")
      if (
        typeof window !== "undefined" &&
        typeof window._satellite !== "undefined" &&
        typeof window._satellite.getVar === "function"
      ) {
        const ecidFromSatellite = window._satellite.getVar("ecid");
        if (ecidFromSatellite && typeof ecidFromSatellite === "string") {
          console.log("[ECID] _satellite.getVar('ecid'):", ecidFromSatellite);
          resolve(ecidFromSatellite);
          return;
        }
      }

      // 방법 2: window.Visitor 인스턴스
      if (
        typeof window !== "undefined" &&
        typeof window.Visitor !== "undefined" &&
        orgId
      ) {
        try {
          const visitor = window.Visitor.getInstance(orgId);
          if (visitor && typeof visitor.getMarketingCloudVisitorID === "function") {
            const ecid = visitor.getMarketingCloudVisitorID();
            if (ecid && typeof ecid === "string") {
              console.log("[ECID] Visitor.getMarketingCloudVisitorID():", ecid);
              resolve(ecid);
              return;
            }
          }
        } catch (e) {
          console.warn("[ECID] Visitor 인스턴스 조회 실패:", e);
        }
      }

      // 타임아웃 체크
      if (Date.now() - startTime >= POLLING_TIMEOUT_MS) {
        console.warn("[ECID] ECID 조회 타임아웃 — Launch가 로드되지 않았을 수 있습니다.");
        resolve(null);
        return;
      }

      setTimeout(attempt, POLLING_INTERVAL_MS);
    }

    attempt();
  });
}

/**
 * Launch 로드 여부를 확인합니다.
 */
export function isLaunchLoaded(): boolean {
  return (
    typeof window !== "undefined" && typeof window._satellite !== "undefined"
  );
}

/**
 * Launch가 로드될 때까지 대기 후 콜백을 실행합니다.
 */
export function onLaunchReady(
  callback: () => void,
  timeoutMs: number = POLLING_TIMEOUT_MS
): void {
  const startTime = Date.now();

  function check(): void {
    if (isLaunchLoaded()) {
      callback();
      return;
    }
    if (Date.now() - startTime >= timeoutMs) {
      console.warn("[ECID] Launch 로드 타임아웃");
      return;
    }
    setTimeout(check, POLLING_INTERVAL_MS);
  }

  check();
}
