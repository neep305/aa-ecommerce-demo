# Rule: prodView

## Rule 정보

- **Rule 이름**: `ACDL - prodView - Send Beacon`
- **이벤트**: `prodView`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Type: **Specific Event**
- [ ] Event Key: `event` equals `prodView`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.pageName` = `%ACDL - Page Name%`
  - `s.products` = `%ACDL - Products%`
  - `s.events` = `prodView`
  - `s.prop2` = Custom Code: `event._aa.prop2`
  - `s.eVar2` = Custom Code: `event._aa.eVar2`
  - `s.eVar3` = Custom Code: `event._aa.eVar3`
  - `s.eVar4` = Custom Code: `event._aa.eVar4`
- [ ] **Adobe Analytics → Send Beacon**

## 검증

- [ ] 상품 클릭 시 Rule 실행
- [ ] products 문자열 `;{SKU}` 형식 확인
