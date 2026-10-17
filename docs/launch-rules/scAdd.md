# Rule: scAdd

## Rule 정보

- **Rule 이름**: `ACDL - scAdd - Send Beacon`
- **이벤트**: `scAdd`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `scAdd`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.products` = `%ACDL - Products%`
  - `s.events` = `scAdd`
  - `s.prop3` = `add_to_cart`
  - `s.eVar5` = Custom Code: `event._aa.eVar5`
  - `s.eVar6` = Custom Code: `event._aa.eVar6`
- [ ] **Adobe Analytics → Send Beacon** (Link Tracking 옵션 사용 가능)

## 검증

- [ ] 장바구니 담기 클릭 시 Rule 실행
- [ ] products: `;{SKU};{qty};{value}` 형식 확인
