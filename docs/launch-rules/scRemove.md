# Rule: scRemove

## Rule 정보

- **Rule 이름**: `ACDL - scRemove - Send Beacon`
- **이벤트**: `scRemove`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `scRemove`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.products` = `%ACDL - Products%`
  - `s.events` = `scRemove`
  - `s.prop3` = `remove_from_cart`
  - `s.eVar5` = Custom Code: `event._aa.eVar5`
- [ ] **Adobe Analytics → Send Beacon** (Link Tracking)

## 검증

- [ ] 장바구니에서 수량 감소/삭제 시 Rule 실행
