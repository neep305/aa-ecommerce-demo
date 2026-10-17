---
phase: 1-clarify
request: |
  현재 이 소스를 모든 Adobe Launch(=Tag)의 Skeleton으로 사용할 수 있도록 구조를 변경.
status: ANSWERED
user_answers:
  기능_범위: "AA + ECID + Target 등 전체 Adobe Stack (AA AppMeasurement + ECID + Target 포함)"
  데이터_레이어: "Adobe Client Data Layer (ACDL) — adobeDataLayer.push 방식"
  launch_연동: "Placeholder + 환경변수 구조 제공 (dev/stage/prod Launch URL을 환경변수로 관리)"
  샘플_데이터: "샘플 데이터 유지 (레퍼런스 구현으로 남김)"
original_questions:
  - |
    [기능 범위] "모든 Adobe Launch(=Tag)"의 의미가 무엇인가요?
    현재 코드는 Adobe Analytics(AA) 데이터 레이어만 구현되어 있습니다(s 객체 방식, AppMeasurement 방식).
    Skeleton이 다음 중 어느 범위를 커버해야 하는지 명확히 해 주세요:
      A) AA AppMeasurement 방식만 (현재 방식 유지)
      B) AA + Adobe Web SDK(alloy.js / sendEvent) 방식 포함
      C) AA + ECID(Visitor ID Service) 포함
      D) 모든 AA 시나리오 + Target + Audience Manager 등 전체 Adobe Stack 포함
      E) Launch Rule/Data Element 계층을 시뮬레이션하는 구조로 리팩토링

  - |
    [출력물 형태] Skeleton의 최종 결과물이 무엇인가요?
    다음 중 어느 형태인지 확인이 필요합니다:
      A) 이 React 앱 자체를 클론/fork하여 재사용할 수 있는 보일러플레이트 구조로 리팩토링
      B) Launch의 데이터 레이어(digitalData / adobeDataLayer) 규격에 맞는 인터페이스로 변경
      C) bundle.html(현재 parcel 빌드 결과물)을 Launch 태그가 포함된 단일 파일로 배포 가능하게 정리
      D) 새 프로젝트를 시작할 때 복사해서 쓰는 템플릿 저장소 구조(예: configs, folder structure 표준화)

  - |
    [데이터 레이어 규격] 어떤 Data Layer 표준을 기준으로 하나요?
    현재 코드의 AdobeAnalytics 모듈은 AppMeasurement의 s 객체 속성값을 직접 반환하는 방식입니다.
    Skeleton이 다음 중 어떤 규격을 따라야 하는지 선택이 필요합니다:
      A) Adobe Client Data Layer (adobeDataLayer.push 방식, ACDL 표준)
      B) W3C Customer Experience Digital Data Layer (digitalData 객체)
      C) 현재처럼 커스텀 객체 방식 유지
      D) XDM 스키마 기반(AEP Web SDK sendEvent 방식)

  - |
    [Launch 연동 방식] 실제 Adobe Launch 스크립트 삽입이 포함되어야 하나요?
    현재 index.html에는 Launch embed code(//assets.adobedtm.com/... 스크립트)가 없고, 
    Analytics 호출도 실제 s.t()/s.tl()이 아닌 console.log 시뮬레이션입니다.
    Skeleton에 다음 항목이 포함되어야 하는지 확인이 필요합니다:
      A) 실제 Launch embed code 삽입 위치(placeholder) 제공
      B) 환경별(dev/stage/prod) Launch URL을 환경변수로 관리하는 구조 포함
      C) console.log 시뮬레이션 방식은 유지하되 실제 연동 가이드만 주석으로 추가
      D) 실제 s.t()/s.tl() 또는 alloy() 호출로 교체

  - |
    [ecommerce 콘텐츠 처리] 현재 한국어 쇼핑몰 샘플 데이터를 어떻게 처리할까요?
    Skeleton으로 사용하려면 도메인 특화 콘텐츠(신발, 가방 등 한국어 상품 데이터)를 
    제거하거나 추상화해야 할 수 있습니다:
      A) 샘플 데이터 그대로 유지 (레퍼런스 구현으로 남김)
      B) 제네릭한 placeholder 상품 데이터로 교체
      C) 콘텐츠 완전 제거 후 빈 scaffold만 남김
      D) 업종별 여러 샘플(ecommerce/media/B2B 등) 제공 구조로 분리

  - |
    [완료 기준] Skeleton 완성의 판단 기준은 무엇인가요?
    다음 중 해당하는 항목을 확인해 주세요:
      A) 새 프로젝트에 복사하여 Launch Property URL만 교체하면 동작해야 함
      B) 팀원이 fork하여 각자 업종에 맞게 커스터마이징할 수 있는 구조여야 함
      C) Adobe Launch 교육/데모 목적으로 이벤트 발화를 시각적으로 확인할 수 있어야 함
      D) CI/CD 파이프라인 없이 bundle.html 단일 파일로 배포 가능해야 함
---
