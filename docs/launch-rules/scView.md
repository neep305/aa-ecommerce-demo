# Rule: scView

## Rule 정보

- **Rule 이름**: `ACDL - scView - Send Beacon`
- **이벤트**: `scView`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `scView`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.pageName` = `장바구니`
  - `s.products` = `%ACDL - Products%`
  - `s.events` = `scView`
  - `s.prop4` = `cart_view`
  - `s.eVar7` = Custom Code: `event._aa.eVar7`
- [ ] **Adobe Analytics → Send Beacon**

## 검증

- [ ] 장바구니 Sheet 열기 시 Rule 실행
