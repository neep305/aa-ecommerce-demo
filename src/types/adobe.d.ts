/**
 * adobe.d.ts
 * Adobe Experience Cloud 전역 타입 선언
 * window.adobeDataLayer, window._satellite, window.adobe, window.s
 */

// ---------------------------------------------------------------------------
// Adobe Client Data Layer (ACDL)
// ---------------------------------------------------------------------------
interface ACDLDataLayerEntry {
  [key: string]: unknown;
}

interface ACDLDataLayer extends Array<ACDLDataLayerEntry> {
  push(...items: ACDLDataLayerEntry[]): number;
  getState(reference?: string): Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Adobe Launch / DTM (_satellite)
// ---------------------------------------------------------------------------
interface SatelliteLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface SatelliteProperty {
  name: string;
  settings: Record<string, unknown>;
}

interface Satellite {
  /** Launch Direct Call Rule 트리거 */
  track(identifier: string, detail?: Record<string, unknown>): void;
  /** Launch 데이터 요소 값 조회 */
  getVar(name: string): unknown;
  /** Launch 데이터 요소 값 설정 */
  setVar(name: string, value: unknown): void;
  /** Launch 규칙 강제 실행 */
  buildInfo: { buildDate: string; environment: string; turbineVersion: string };
  property: SatelliteProperty;
  logger: SatelliteLogger;
  /** ECID 등 Extension 제공 변수 접근 */
  getVisitorId?(): unknown;
}

// ---------------------------------------------------------------------------
// Adobe AppMeasurement (s object)
// ---------------------------------------------------------------------------
interface AppMeasurement {
  pageName: string;
  channel: string;
  server: string;
  pageType: string;
  prop1: string;
  prop2: string;
  prop3: string;
  prop4: string;
  prop5: string;
  prop6: string;
  prop7: string;
  prop8: string;
  eVar1: string;
  eVar2: string;
  eVar3: string;
  eVar4: string;
  eVar5: string;
  eVar6: string;
  eVar7: string;
  eVar8: string;
  eVar9: string;
  eVar10: string;
  eVar11: string;
  eVar12: string;
  eVar13: string;
  eVar14: string;
  eVar15: string;
  eVar16: string;
  products: string;
  events: string;
  purchaseID: string;
  transactionID: string;
  visitorID: string;
  trackingServer: string;
  trackingServerSecure: string;
  /** 페이지뷰 비콘 전송 */
  t(): void;
  /** 링크 트래킹 비콘 전송 */
  tl(obj: boolean | HTMLElement, linkType: string, linkName: string): void;
}

// ---------------------------------------------------------------------------
// Adobe Target (at.js)
// ---------------------------------------------------------------------------
interface AdobeTargetOffer {
  content: string | HTMLElement[];
  type: string;
}

interface AdobeTargetRequestOptions {
  mbox: string;
  params?: Record<string, string>;
  success?: (offer: AdobeTargetOffer) => void;
  error?: (status: string, error: Error) => void;
}

interface AdobeTargetTrackOptions {
  mbox: string;
  params?: Record<string, string>;
}

interface AdobeTarget {
  /** mbox 오퍼 조회 (at.js legacy) */
  getOffer(options: AdobeTargetRequestOptions): void;
  /** mbox 오퍼 적용 */
  applyOffer(options: { mbox: string; offer: AdobeTargetOffer }): void;
  /** Target 이벤트 트래킹 */
  trackEvent(options: AdobeTargetTrackOptions): void;
  /** 뷰 변경 알림 (SPA) */
  triggerView(viewName: string, options?: { page?: boolean }): void;
}

interface AdobeNamespace {
  target?: AdobeTarget;
}

// ---------------------------------------------------------------------------
// ECID / Visitor ID Service
// ---------------------------------------------------------------------------
interface AdobeVisitor {
  /** ECID(MID) 값 조회 */
  getMarketingCloudVisitorID(callback: (id: string) => void, retry?: boolean): string | void;
  /** AAM UUID 조회 */
  getAudienceManagerLocationHint(callback: (hint: number) => void): void;
  /** 동기 ECID (Launch Extension 제공 시) */
  getMarketingCloudVisitorID(): string | void;
}

// ---------------------------------------------------------------------------
// Window 전역 확장
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    /** Adobe Client Data Layer */
    adobeDataLayer: ACDLDataLayer;
    /** Adobe Launch (Tags) Runtime */
    _satellite: Satellite;
    /** Adobe AppMeasurement s 객체 */
    s: AppMeasurement;
    /** Adobe 네임스페이스 (Target at.js) */
    adobe: AdobeNamespace;
    /** ECID Visitor ID Service */
    Visitor: {
      getInstance(orgId: string, config?: Record<string, unknown>): AdobeVisitor;
    };
  }
}

export {};
