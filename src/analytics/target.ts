/**
 * target.ts — Adobe Target (at.js) 헬퍼
 *
 * Launch의 Target Extension이 로드된 후 window.adobe.target 을 통해
 * getOffer / trackEvent / triggerView 를 래핑합니다.
 *
 * at.js 2.x 기준 구현 (Legacy mbox.js 아님)
 */

// ---------------------------------------------------------------------------
// 타입 (window.adobe.target 사용을 위해 adobe.d.ts에서 전역 선언)
// ---------------------------------------------------------------------------
export interface TargetOfferContent {
  type: string;
  content: string | HTMLElement[];
}

export interface TargetGetOfferOptions {
  mbox: string;
  params?: Record<string, string>;
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Target 유틸리티
// ---------------------------------------------------------------------------

function isTargetAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.adobe !== "undefined" &&
    typeof window.adobe.target !== "undefined"
  );
}

// ---------------------------------------------------------------------------
// getOffer — mbox 오퍼 조회 및 적용
// ---------------------------------------------------------------------------

/**
 * Adobe Target mbox에서 오퍼를 조회하고 적용합니다.
 * at.js가 로드되지 않은 경우 조용히 건너뜁니다.
 *
 * @param mboxName  mbox 이름 (예: "hero-banner-offer")
 * @param params    mbox 파라미터 (key-value 페어)
 * @returns         성공 시 오퍼 내용, 실패 시 null
 */
export function getAndApplyOffer(
  mboxName: string,
  params?: Record<string, string>
): Promise<TargetOfferContent | null> {
  return new Promise((resolve) => {
    if (!isTargetAvailable()) {
      console.warn("[Target] adobe.target 미로드 — at.js가 Launch에 포함되어 있는지 확인하세요.");
      resolve(null);
      return;
    }

    window.adobe.target!.getOffer({
      mbox: mboxName,
      params,
      success(offer) {
        console.log(`[Target] getOffer(${mboxName}) 성공:`, offer);
        window.adobe.target!.applyOffer({ mbox: mboxName, offer });
        resolve(offer as TargetOfferContent);
      },
      error(status, error) {
        console.warn(`[Target] getOffer(${mboxName}) 실패:`, status, error);
        resolve(null);
      },
    });
  });
}

// ---------------------------------------------------------------------------
// trackEvent — Target 전환 이벤트 트래킹
// ---------------------------------------------------------------------------

/**
 * Adobe Target 전환 mbox를 호출합니다.
 * 구매 완료, CTA 클릭 등 목표 전환 이벤트에 사용합니다.
 *
 * @param mboxName  전환 mbox 이름 (예: "order-confirmation")
 * @param params    추가 파라미터 (예: orderId, orderTotal 등)
 */
export function targetTrackEvent(
  mboxName: string,
  params?: Record<string, string>
): void {
  if (!isTargetAvailable()) {
    console.warn("[Target] adobe.target 미로드 — trackEvent 건너뜀");
    return;
  }

  window.adobe.target!.trackEvent({ mbox: mboxName, params });
  console.log(`[Target] trackEvent(${mboxName}):`, params);
}

// ---------------------------------------------------------------------------
// triggerView — SPA 뷰 변경 알림 (React Router 등)
// ---------------------------------------------------------------------------

/**
 * SPA 라우트 변경 시 Target에 뷰 변경을 알립니다.
 * at.js 2.x의 triggerView()를 호출합니다.
 *
 * @param viewName  뷰 이름 (예: "home", "product-detail", "cart")
 * @param isPage    true면 새 페이지로 처리 (기본값: false)
 */
export function triggerTargetView(viewName: string, isPage: boolean = false): void {
  if (!isTargetAvailable()) {
    // SPA 라우팅 중 빈번하게 호출되므로 warn 레벨 아닌 debug 레벨
    console.debug("[Target] adobe.target 미로드 — triggerView 건너뜀:", viewName);
    return;
  }

  window.adobe.target!.triggerView(viewName, { page: isPage });
  console.log(`[Target] triggerView("${viewName}", page=${isPage})`);
}
