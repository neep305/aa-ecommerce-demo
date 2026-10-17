# Adobe 태깅 구현 가이드

이 문서 모음은 AA Ecommerce Demo 앱에서 지원하는 **3가지 Adobe 태깅 구현 방식**을 설명합니다.

## 구현 방식 비교

| 방식 | 클라이언트 코드 | Launch 역할 | 적합한 경우 |
|------|----------------|-------------|------------|
| [AppMeasurement](./implementation-appmeasurement.md) | `s.t()` / `s.tl()` 직접 호출 | Launch 미사용 또는 레거시 | 레거시 사이트, Launch 없는 환경 |
| [Launch Extension](./implementation-launch-extension.md) | `adobeDataLayer.push()` | Rules + Extensions로 AA/ECID/Target 처리 | **이 데모 앱의 기본 방식** |
| [Web SDK](./implementation-web-sdk.md) | `alloy('sendEvent')` | Web SDK Extension + Datastream | AEP 중심, XDM 기반 통합 |

## 아키텍처

```
Client App                    Adobe Tags (Launch)              Destination
──────────                    ───────────────────              ───────────
adobeDataLayer.push  ──►  Rules + Data Elements  ──►  AA Extension  ──►  Adobe Analytics
                          ECID Extension         ──►  ECID (MID)
                          Target Extension       ──►  Adobe Target

alloy('sendEvent')   ──►  Web SDK Extension      ──►  Datastream   ──►  AEP / AA / Target
```

## 빠른 시작

1. 저장소 클론 후 의존성 설치: `pnpm install`
2. `.env.example`을 `.env.development`로 복사하고 Launch URL 설정
3. 개발 서버 실행: `pnpm dev` (또는 `npm run dev`)
4. 브라우저에서 페이지 이동 시 URL path(`/`, `/cart`, `/checkout` 등)가 변경되는지 확인
5. 우측 패널 **구현 코드** 탭으로 3가지 방식 스니펫 확인

## 라우트 (Launch URL 조건 테스트)

| 경로 | 페이지 |
|------|--------|
| `/` | 홈 (상품 목록) |
| `/product/:id` | 상품 상세 |
| `/event` | 이벤트/세일 |
| `/cart` | 장바구니 |
| `/checkout` | 체크아웃 |
| `/order-complete` | 주문 완료 |
| `/mypage` | 마이페이지 (가입 정보 조회/수정) |
| `/signup` | 회원가입 |

## 문서 목록

- [AppMeasurement 구현 가이드](./implementation-appmeasurement.md)
- [Launch Extension 구현 가이드](./implementation-launch-extension.md) — **핵심**
- [Web SDK 구현 가이드](./implementation-web-sdk.md)
- [SPA 환경 구현 가이드](./spa-implementation-guide.md) — 라우트 변경 감지 및 3가지 방식별 SPA 페이지뷰/이벤트 트래킹 샘플
- [XDM Schema Payload 점검 리포트](./xdm-schema-audit.md) — 스키마 샘플 대비 Web SDK 페이로드 감사
- [Launch Rule 체크리스트](./launch-rules/) — 이벤트별 Rule 설정

## 소스 코드 구조

```
src/analytics/
├── acdl.ts           # adobeDataLayer 초기화 및 push + 회원 정보 기반 identityMap 헬퍼
├── aa.ts             # 10개 ecommerce 이벤트 (ACDL + _aa 매핑)
├── ecid.ts           # ECID 조회 (Launch 로드 후)
├── target.ts         # Target Offer (at.js)
├── guide-snippets.ts # 구현 가이드 UI용 스니펫 데이터
└── index.ts          # 통합 export
```

## 검증 방법

1. **Data Layer**: DevTools Console에서 `window.adobeDataLayer` 확인
2. **Launch 로드**: `window._satellite` 존재 여부 확인
3. **Adobe Debugger**: Chrome Extension으로 비콘 수신 확인
4. **ECID**: `getECID()` 호출 후 MID 반환 확인
