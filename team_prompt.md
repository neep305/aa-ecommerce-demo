팀 목표: Adobe Tags(Launch) 데모 앱에서 태그가 올바르게 구현되었는지 end-to-end 검증하고, 검증 보고서를 작성한다.

---

## 팀 구성

### 팀 리드 (오케스트레이터)
- 역할: 전체 태스크 분배, 진행 조율, 최종 보고서 취합
- 산출물: 프로젝트 브리프, 최종 통합 검증 보고서

---

### teammate 1 - AEP Engineer
- 전문 영역: Adobe Experience Platform, Adobe Tags(Launch)
- 목표: Tags 구현 전반 검토 — rules, data elements, extensions 설정이 올바른지 확인
- 산출물:
  - Tags 구현 검토 보고서 (rules/data elements/extensions 설정 적합성)
  - XDM 스키마 및 Datastream 매핑 문서
- 의존성: 없음 (첫 번째로 실행)

---

### teammate 2 - Adobe Analytics Expert
- 전문 영역: Adobe Analytics 변수 설계, 리포팅 검증
- 목표: AA 변수 매핑 및 데이터 수집 품질 검증
- 산출물:
  - eVar / prop / event 매핑 체크리스트
  - 데이터 품질 검증 결과 (누락/오류 항목 포함)
- 의존성: AEP Engineer 검토 보고서 완료 이후 실행

---

### teammate 3 - Frontend Engineer
- 전문 영역: 데모 앱 구현, Data Layer 설계, Tags 연동 코드
- 목표: 데모 앱의 Data Layer 구조 구현 및 Tags와의 연동 코드 작성/검토
- 산출물:
  - Data Layer 설계 문서 (이벤트 구조, 변수 명세)
  - Tags 연동 구현 코드 및 코드 리뷰 결과
- 의존성: 없음 (AEP Engineer와 병렬 실행)

---

### teammate 4 - QA Engineer
- 전문 영역: 태그 검증 테스트, 브라우저 디버깅 (Debugger, Network)
- 목표: 데모 앱에서 실제 태그 발화 여부 테스트 케이스 작성 및 실행
- 산출물:
  - 테스트 플랜 (페이지별/이벤트별 검증 시나리오)
  - 테스트 실행 결과 및 버그 리포트
- 의존성: AEP Engineer 및 Frontend Engineer 결과물 완료 이후 실행

---

## 태스크 흐름

```
[AEP Engineer] Tags 구현 검토   ←→   [Frontend Engineer] Data Layer 구현
              ↓                                    ↓
[AA Expert] 변수 매핑 검증              [QA Engineer] 테스트 실행
              ↓                                    ↓
         [팀 리드] 결과 취합 → 최종 검증 보고서 작성
```

---

## 검증 범위 (참고)

- Adobe Tags extension 설정 (Web SDK / AA Extension)
- Data Layer 구조 및 이벤트 트리거
- XDM 오브젝트 매핑
- Page View / Custom Event / Ecommerce 이벤트 발화 여부
- Adobe Analytics 리포트 스위트 데이터 수신 확인
