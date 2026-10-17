# Rule: scCheckout

## Rule 정보

- **Rule 이름**: `ACDL - scCheckout - Send Beacon`
- **이벤트**: `scCheckout`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `scCheckout`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.pageName` = `%ACDL - Page Name%`
  - `s.products` = `%ACDL - Products%`
  - `s.events` = `scCheckout`
  - `s.prop5` = Custom Code: `event._aa.prop5`
  - `s.eVar8` = Custom Code: `event._aa.eVar8`
  - `s.eVar9` = Custom Code: `event._aa.eVar9`
- [ ] **Adobe Analytics → Send Beacon**

## 검증

- [ ] 결제하기 버튼 클릭 시 Rule 실행
- [ ] checkout step 번호 eVar9에 반영 확인
