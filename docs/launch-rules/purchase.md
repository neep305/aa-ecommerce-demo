# Rule: purchase

## Rule 정보

- **Rule 이름**: `ACDL - purchase - Send Beacon`
- **이벤트**: `purchase`

## Trigger

- [ ] Extension: **Adobe Client Data Layer**
- [ ] Event Key: `event` equals `purchase`

## Actions

- [ ] **Adobe Analytics → Set Variables**
  - `s.pageName` = `구매완료`
  - `s.products` = `%ACDL - Products%`
  - `s.events` = `purchase`
  - `s.purchaseID` = `%ACDL - Purchase ID%`
  - `s.transactionID` = `%ACDL - Purchase ID%`
  - `s.prop6` = `purchase_complete`
  - `s.eVar10` = Custom Code: `event._aa.eVar10`
  - `s.eVar11` = Custom Code: `event._aa.eVar11`
  - `s.eVar12` = Custom Code: `event._aa.eVar12`
- [ ] **Adobe Analytics → Send Beacon**

## 검증

- [ ] 결제 완료 시 Rule 실행
- [ ] purchaseID 중복 없이 고유 orderId 전송 확인
- [ ] Report Suite Revenue/Orders 확인
