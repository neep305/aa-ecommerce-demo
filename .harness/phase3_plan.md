---
phase: 3-plan
---

## 구현 계획

| Phase | 함수명 | 대상 파일 | 변경 내용 |
|-------|--------|----------|----------|
| 1 | `phase_1_create_adobe_types` | `src/types/adobe.d.ts` | window.adobeDataLayer, window._satellite, window.adobe, window.s, window.Visitor 전역 타입 선언 (strict 호환) |
| 2 | `phase_2_create_analytics_acdl` | `src/analytics/acdl.ts` | ACDL 타입 정의(ACDLEvent 등), initAdobeDataLayer(), pushToDataLayer(), getDataLayerState() 구현 |
| 3 | `phase_3_create_analytics_aa` | `src/analytics/aa.ts` | 기존 AdobeAnalytics 9개 메서드를 ACDL push 방식으로 전환. `_aa` 키에 AppMeasurement 변수 매핑 포함. rawData 반환으로 로그 패널 호환성 유지 |
| 4 | `phase_4_create_analytics_ecid` | `src/analytics/ecid.ts` | Launch 비동기 로드 대응 폴링 기반 ECID 조회. _satellite.getVar('ecid') / window.Visitor.getInstance() 두 가지 방법 지원. onLaunchReady() 헬퍼 포함 |
| 5 | `phase_5_create_analytics_target` | `src/analytics/target.ts` | at.js 2.x 기준 getAndApplyOffer(), targetTrackEvent(), triggerTargetView() 래퍼. Target 미로드 시 graceful fallback |
| 6 | `phase_6_create_analytics_index` | `src/analytics/index.ts` | 모든 analytics 모듈의 통합 re-export. 타입 export 포함 |
| 7 | `phase_7_update_index_html` | `index.html` | `<!-- ADOBE LAUNCH EMBED START/END -->` 주석 블록 추가. 환경별 URL 안내 주석. VITE_LAUNCH_URL 기반 동적 스크립트 삽입 인라인 JS 추가 |
| 8 | `phase_8_create_env_example` | `.env.example` | VITE_LAUNCH_URL_DEV / STAGE / PROD 및 VITE_LAUNCH_URL 템플릿 |
| 9 | `phase_9_update_app_tsx` | `src/App.tsx` | AdobeAnalytics 인라인 객체(80~213줄) 제거. @/analytics import로 교체. AdobeAnalytics.xxx → 직접 함수 호출. initAdobeDataLayer() useEffect 추가 |
| 10 | `phase_10_update_main_tsx` | `src/main.tsx` | ACDL 사전 초기화 관련 주석 추가 (타입 선언은 tsconfig에서 자동 포함) |

## run_phases.py 생성 완료 여부

**생성 성공**

- 파일 위치: `/Users/jason/dev/adobe/aa-ecommerce-demo/run_phases.py`
- 실행 검증: `python3 run_phases.py` 로 전체 10개 phase 정상 실행 확인
- 개별 phase 실행: `python3 run_phases.py phase_N` 형태로 단독 실행 가능
- 생성된 파일 목록:
  - `src/types/adobe.d.ts`
  - `src/analytics/acdl.ts`
  - `src/analytics/aa.ts`
  - `src/analytics/ecid.ts`
  - `src/analytics/target.ts`
  - `src/analytics/index.ts`
  - `index.html` (수정)
  - `.env.example`
  - `src/App.tsx` (수정)
  - `src/main.tsx` (수정)

## 예상 위험 요소

- **TypeScript strict 모드 충돌**: `noUnusedLocals` / `noUnusedParameters` 활성화 상태. `src/analytics/aa.ts` 내 Product/CartItem 인터페이스가 App.tsx의 동명 인터페이스와 중복 선언됨 — tsc 빌드 시 오류 가능. 해결: aa.ts 내 인터페이스를 `types/` 공용 파일로 분리하거나 `import type`으로 교차 참조.
- **VITE_LAUNCH_URL 빌드 타임 치환**: Vite는 `%VITE_LAUNCH_URL%`를 빌드 시 index.html에서 치환하지만, `.env` 파일이 없으면 빈 문자열이 됨 — 개발 서버에서는 Launch URL 없이도 앱 동작은 정상(analytics console.log만 출력).
- **bundle.html (Parcel) 환경변수**: Parcel은 Vite `VITE_*` 환경변수를 인식하지 않음. 단일파일 배포용 bundle.html은 별도 빌드 파이프라인 업데이트 필요.
- **window.adobeDataLayer 타입 충돌**: `adobe.d.ts`에서 `declare global { interface Window { adobeDataLayer: ACDLDataLayer } }` 선언 시, 다른 라이브러리가 동명 Window 확장을 하면 충돌 가능 — 현재 의존성에는 해당 없음.
- **aa.ts의 `_aa` 키**: ACDL 표준에 없는 커스텀 키(`_aa`)를 사용하므로 Launch Rule에서 데이터 요소 매핑 시 `event._aa.pageName` 형태로 접근해야 함 — 팀 Launch 구성 시 문서화 필요.
- **target.ts의 `console.debug`**: `noUnusedLocals` 외 ESLint no-console 규칙이 있을 경우 lint 실패 가능.
