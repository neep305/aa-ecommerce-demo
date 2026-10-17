export interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  originalPrice?: number
  image: string
  description: string
  rating: number
  reviews: number
}

export interface CartItem extends Product {
  quantity: number
}

export const products: Product[] = [
  {
    id: '1', sku: 'SHOE-001', name: '프리미엄 러닝화', category: '신발',
    price: 159000, originalPrice: 199000, image: '👟',
    description: '가벼운 쿠셔닝과 통기성이 뛰어난 프리미엄 러닝화입니다.',
    rating: 4.8, reviews: 234
  },
  {
    id: '2', sku: 'BAG-002', name: '가죽 토트백', category: '가방',
    price: 289000, image: '👜',
    description: '천연 소가죽으로 제작된 클래식한 디자인의 토트백입니다.',
    rating: 4.5, reviews: 156
  },
  {
    id: '3', sku: 'WATCH-003', name: '스마트워치 프로', category: '전자기기',
    price: 449000, originalPrice: 499000, image: '⌚',
    description: '건강 모니터링과 다양한 스마트 기능을 갖춘 최신 스마트워치.',
    rating: 4.9, reviews: 892
  },
  {
    id: '4', sku: 'SHIRT-004', name: '린넨 셔츠', category: '의류',
    price: 89000, image: '👔',
    description: '시원하고 편안한 착용감의 프리미엄 린넨 셔츠입니다.',
    rating: 4.3, reviews: 78
  },
  {
    id: '5', sku: 'HEADPHONE-005', name: '노이즈캔슬링 헤드폰', category: '전자기기',
    price: 379000, originalPrice: 429000, image: '🎧',
    description: '업계 최고 수준의 노이즈캔슬링 기술이 적용된 무선 헤드폰.',
    rating: 4.7, reviews: 445
  },
  {
    id: '6', sku: 'JACKET-006', name: '방수 자켓', category: '의류',
    price: 249000, image: '🧥',
    description: '가볍지만 완벽한 방수 기능을 갖춘 아웃도어 자켓입니다.',
    rating: 4.6, reviews: 203
  },
  {
    id: '7', sku: 'CAP-007', name: '볼캡 스트릿 모자', category: '액세서리',
    price: 45000, originalPrice: 59000, image: '🧢',
    description: '감각적인 자수 포인트가 돋보이는 트렌디한 볼캡입니다.',
    rating: 4.4, reviews: 112
  },
  {
    id: '8', sku: 'SUNGLASS-008', name: '편광 선글라스', category: '액세서리',
    price: 129000, image: '🕶️',
    description: '자외선 차단 및 편광 렌즈가 탑재된 경량 선글라스입니다.',
    rating: 4.6, reviews: 88
  },
  {
    id: '9', sku: 'BACKPACK-009', name: '비즈니스 백팩', category: '가방',
    price: 189000, originalPrice: 229000, image: '🎒',
    description: '노트북 수납 공간과 방수 원단이 적용된 프리미엄 비즈니스 백팩.',
    rating: 4.7, reviews: 310
  },
  {
    id: '10', sku: 'BOOTS-010', name: '클래식 워커 부츠', category: '신발',
    price: 219000, image: '🥾',
    description: '내구성이 높고 클래식한 핏을 선사하는 고급 가죽 부츠.',
    rating: 4.5, reviews: 145
  },
  {
    id: '11', sku: 'EARBUDS-011', name: '무선 이어폰 에어', category: '전자기기',
    price: 199000, originalPrice: 239000, image: '🎙️',
    description: '고음질 HIFI 사운드와 선명한 통화 품질을 제공하는 노이즈 캔슬링 이어폰.',
    rating: 4.8, reviews: 620
  },
  {
    id: '12', sku: 'TABLET-012', name: '스마트 태블릿 11', category: '전자기기',
    price: 799000, originalPrice: 899000, image: '📱',
    description: '고화질 OLED 디스플레이와 강력한 옥타코어 프로세서를 탑재한 태블릿.',
    rating: 4.9, reviews: 512
  },
  {
    id: '13', sku: 'HOODIE-013', name: '오버핏 후드 집업', category: '의류',
    price: 79000, image: '🧥',
    description: '부드러운 기모 안감으로 포근하고 편안한 오버핏 데일리 후드.',
    rating: 4.4, reviews: 189
  },
  {
    id: '14', sku: 'SLACKS-014', name: '테일러드 슬랙스', category: '의류',
    price: 99000, originalPrice: 129000, image: '👖',
    description: '구김이 적고 스판이 포함되어 편안한 드레스 스타일 슬랙스.',
    rating: 4.6, reviews: 275
  },
  {
    id: '15', sku: 'WALKER-015', name: '어반 스니커즈', category: '신발',
    price: 129000, image: '👟',
    description: '어디에나 캐주얼하게 잘 어울리는 모던 디자인 스니커즈.',
    rating: 4.5, reviews: 198
  },
  {
    id: '16', sku: 'CROSSBAG-016', name: '미니 가죽 크로스백', category: '가방',
    price: 95000, image: '👝',
    description: '소지품을 효율적으로 보관할 수 있는 아담한 소가죽 크로스백.',
    rating: 4.3, reviews: 94
  },
  {
    id: '17', sku: 'SPEAKER-017', name: '블루투스 캠핑 스피커', category: '전자기기',
    price: 169000, originalPrice: 199000, image: '🔊',
    description: 'IPX7 완전 방수와 360도 입체 음향을 지원하는 무선 스피커.',
    rating: 4.8, reviews: 340
  },
  {
    id: '18', sku: 'PERFUME-018', name: '시그니처 오드퍼퓸', category: '뷰티',
    price: 135000, image: '🧴',
    description: '은은하고 고급스러운 우디 향이 하루종일 지속되는 향수.',
    rating: 4.7, reviews: 167
  },
  {
    id: '19', sku: 'TUMBLER-019', name: '진공 스테인리스 텀블러', category: '리빙',
    price: 38000, image: '🥤',
    description: '24시간 뛰어난 보온 및 보냉 성능의 500ml 텀블러.',
    rating: 4.6, reviews: 420
  },
  {
    id: '20', sku: 'YOGAMAT-020', name: '친환경 폼 요가매트', category: '스포츠',
    price: 49000, originalPrice: 65000, image: '🧘',description: '미끄럼 방지 처리와 푹신한 충격 흡수를 제공하는 요가매트.',
    rating: 4.5, reviews: 230
  },
  {
    id: '21', sku: 'KEYBOARD-021', name: '기계식 게이밍 키보드', category: '전자기기',
    price: 149000, image: '⌨️',
    description: '경쾌한 타건감과 RGB 백라이트를 지원하는 적축 게이밍 키보드.',
    rating: 4.8, reviews: 380
  },
  {
    id: '22', sku: 'CARDHOLDER-022', name: '슬림 카드 지갑', category: '액세서리',
    price: 68000, image: '💳',
    description: '포켓에 쏙 들어가는 슬림한 가죽 카드 홀더지갑.',
    rating: 4.4, reviews: 150
  },
  {
    id: '23', sku: 'COAT-023', name: '울 싱글 코트', category: '의류',
    price: 329000, originalPrice: 389000, image: '🧥',
    description: '울 80% 혼방의 실루엣이 멋스러운 겨울 싱글 코트.',
    rating: 4.9, reviews: 290
  },
  {
    id: '24', sku: 'SANDAL-024', name: '컴포트 스트랩 샌들', category: '신발',
    price: 79000, image: '👡',
    description: '장시간 착용에도 발의 피로도를 낮춰주는 쿠션 인솔 샌들.',
    rating: 4.3, reviews: 85
  },
  {
    id: '25', sku: 'LAMP-025', name: '터치 무드 테이블 램프', category: '리빙',
    price: 59000, originalPrice: 75000, image: '💡',
    description: '3단계 터치 조도 조절이 가능한 모던 인테리어 무드등.',
    rating: 4.7, reviews: 175
  },
  {
    id: '26', sku: 'DUMBBELL-026', name: '무게 조절식 덤벨 세트', category: '스포츠',
    price: 189000, image: '🏋️',
    description: '쉽고 빠른 무게 변경으로 효과적인 홈트레이닝을 돕는 아령 세트.',
    rating: 4.6, reviews: 210
  },
  {
    id: '27', sku: 'MONITOR-027', name: '4K 커브드 게이밍 모니터', category: '전자기기',
    price: 649000, originalPrice: 729000, image: '🖥️',
    description: '144Hz 주사율과 1ms 응답속도를 자랑하는 32인치 4K 커브드 게이밍 모니터입니다.',
    rating: 4.9, reviews: 410
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}
