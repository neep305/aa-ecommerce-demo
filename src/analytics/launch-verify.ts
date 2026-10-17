/**
 * launch-verify.ts — Launch 연동 상태 검증 헬퍼
 *
 * onLaunchReady 콜백에서 호출하여 _satellite, ECID, ACDL 상태를 확인합니다.
 * Rule 실행·비콘 수신은 Adobe Experience Platform Debugger에서 확인하세요.
 *
 * NOTE: 현재 AA(AppMeasurement) 기반 구현입니다.
 * Web SDK(Alloy) 마이그레이션 시 비콘 엔드포인트가 /b/ss/ → edge.adobedc.net/ee/ 로 변경됩니다.
 */

import { getDataLayerState } from "./acdl";
import { getECID, isLaunchLoaded } from "./ecid";

export interface LaunchVerifyResult {
  launchLoaded: boolean;
  buildEnvironment?: string;
  ecid: string | null;
  acdlEventCount: number;
  acdlEventNames: string[];
  /** 문제가 감지되었을 때 표시되는 경고/안내 메시지 */
  hints: string[];
  /** 정상 상태에서도 유용한 일반 디버깅 가이드 */
  tips: string[];
}

export async function verifyLaunchSetup(
  orgId?: string
): Promise<LaunchVerifyResult> {
  const hints: string[] = [];
  const tips: string[] = [];
  const launchLoaded = isLaunchLoaded();

  if (!launchLoaded) {
    hints.push(
      "Launch가 로드되지 않았습니다. .env.development에 VITE_LAUNCH_URL을 설정하고 dev 서버를 재시작하세요."
    );
  } else {
    tips.push(
      "Adobe Experience Platform Debugger → Tags 탭에서 Rule 실행(pageView/prodView/scAdd)을 확인하세요."
    );
    tips.push(
      "Network 탭에서 AA 비콘(/b/ss/) 수신 여부를 확인하세요. RSID 설정 후 Publish 필요합니다."
    );
  }

  const state = getDataLayerState();
  const acdlEntries = Array.isArray(state) ? state : [];
  const acdlEventNames = acdlEntries
    .map((entry) => {
      if (entry && typeof entry === "object" && "event" in entry) {
        return String((entry as { event: unknown }).event);
      }
      return null;
    })
    .filter((name): name is string => name !== null);

  let buildEnvironment: string | undefined;
  if (launchLoaded && window._satellite?.buildInfo) {
    buildEnvironment = window._satellite.buildInfo.environment;
  }

  const ecid = launchLoaded ? await getECID(orgId) : null;

  if (launchLoaded && !ecid) {
    hints.push(
      "ECID를 가져오지 못했습니다. Launch Property에 Experience Cloud ID Service Extension과 'ecid' Data Element를 설정했는지 확인하세요. " +
      "Visitor API fallback을 사용하려면 verifyLaunchSetup()에 orgId를 전달하세요."
    );
  }

  const result: LaunchVerifyResult = {
    launchLoaded,
    buildEnvironment,
    ecid,
    acdlEventCount: acdlEntries.length,
    acdlEventNames,
    hints,
    tips,
  };

  console.group("[Launch Verify]");
  console.log("Launch loaded:", result.launchLoaded);
  if (result.buildEnvironment) {
    console.log("Environment:", result.buildEnvironment);
  }
  console.log("ECID (MID):", result.ecid ?? "(not available)");
  console.log("ACDL events:", result.acdlEventNames);
  if (result.hints.length > 0) {
    result.hints.forEach((hint) => console.warn("⚠", hint));
  }
  if (result.tips.length > 0) {
    result.tips.forEach((tip) => console.info("💡", tip));
  }
  console.groupEnd();

  return result;
}
