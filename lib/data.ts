export interface Festival {
  id: string | number;
  contentid?: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  addr1: string;
  addr2?: string;
  mapx: number; // 경도 (126.x ~ 129.x)
  mapy: number; // 위도 (33.x ~ 38.x)
  firstimage?: string;
  overview?: string;
  playtime?: string;
  usetime?: string;
  sponsor1?: string;
  sponsor2?: string;
  tel?: string;
  homepage?: string;
  status: 'PUBLISHED' | 'HIDDEN';
  source: 'API' | 'MANUAL';
  created_at?: string;
}

export const INITIAL_FESTIVALS: Festival[] = [
  {
    id: 1,
    contentid: "fest_01",
    title: "2026 서울세계불꽃축제",
    start_date: "2026-09-01",
    end_date: "2026-09-05",
    addr1: "서울특별시 영등포구 63로 50",
    addr2: "여의도 한강공원 일대",
    mapx: 126.9366,
    mapy: 37.5284,
    firstimage: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=60",
    overview: "가을 밤하늘을 화려하게 수놓는 대한민국 최고의 불꽃 축제. 국내외 최정상 불꽃 연출팀이 참가하여 한강의 야경과 어우러지는 환상적인 음악과 레이저 쇼를 선보입니다.",
    playtime: "19:00 ~ 21:30",
    usetime: "무료 (일부 지정석 유료)",
    sponsor1: "한화그룹",
    sponsor2: "SBS",
    tel: "02-510-8800",
    homepage: "https://www.hanwhafireworks.com",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 2,
    contentid: "fest_02",
    title: "수원화성문화제",
    start_date: "2026-09-02",
    end_date: "2026-09-10",
    addr1: "경기도 수원시 팔달구 정조로 825",
    addr2: "화성행궁 및 수원화성 일원",
    mapx: 127.0142,
    mapy: 37.2832,
    firstimage: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&auto=format&fit=crop&q=60",
    overview: "유네스코 세계문화유산 수원화성을 배경으로 정조대왕의 애민정신과 효심을 기리는 전통 역사문화 축제입니다. 정조대왕 능행차 공동재현 등 웅장한 볼거리가 가득합니다.",
    playtime: "10:00 ~ 21:00",
    usetime: "무료",
    sponsor1: "수원시",
    sponsor2: "수원문화재단",
    tel: "031-290-3632",
    homepage: "https://www.swcf.or.kr",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 3,
    contentid: "fest_03",
    title: "부산 자갈치축제",
    start_date: "2026-08-25",
    end_date: "2026-09-06",
    addr1: "부산광역시 중구 자갈치해안로 52",
    addr2: "자갈치시장 및 남포동 유라리광장 일원",
    mapx: 129.0305,
    mapy: 35.0967,
    firstimage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=60",
    overview: "오이소! 보이소! 사이소! 전국 최대 수산물 축제. 싱싱한 활어회와 해산물 먹거리 장터, 물고기 잡기 체험, 수산물 깜짝 경매 등 풍성한 체험이 준비되어 있습니다.",
    playtime: "11:00 ~ 22:00",
    usetime: "체험 프로그램별 상이",
    sponsor1: "(사)부산자갈치문화관광축제위원회",
    tel: "051-243-9363",
    homepage: "http://www.ijagalchi.kr",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 4,
    contentid: "fest_04",
    title: "안동국제탈춤페스티벌",
    start_date: "2026-09-15",
    end_date: "2026-09-24",
    addr1: "경상북도 안동시 육사로 239",
    addr2: "탈춤공원 및 원도심 일원",
    mapx: 128.7298,
    mapy: 36.5684,
    firstimage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60",
    overview: "하회별신굿탈놀이를 비롯한 한국 고유의 탈춤과 전 세계 10여 개국의 세계 탈춤을 한자리에서 만나는 대한민국 명예대표 문화관광축제입니다.",
    playtime: "10:00 ~ 22:00",
    usetime: "탈춤공연장 입장료 7,000원",
    sponsor1: "안동시",
    sponsor2: "한국정신문화재단",
    tel: "054-840-3424",
    homepage: "http://www.maskdance.com",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 5,
    contentid: "fest_05",
    title: "강릉 커피축제",
    start_date: "2026-09-04",
    end_date: "2026-09-07",
    addr1: "강원특별자치도 강릉시 난설헌로 131",
    addr2: "강릉 스피드스케이팅 경기장 및 안목해변",
    mapx: 128.9168,
    mapy: 37.7915,
    firstimage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=60",
    overview: "커피 도시 강릉에서 열리는 향긋한 가을 축제. 100인의 바리스타가 내리는 핸드드립 커피 시음회와 커피 로스팅 체험, 커피 어워드가 열립니다.",
    playtime: "10:00 ~ 18:00",
    usetime: "무료 (체험료 별도)",
    sponsor1: "강릉시",
    sponsor2: "강릉문화재단",
    tel: "033-647-6802",
    homepage: "http://www.coffeefestival.net",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 6,
    contentid: "fest_06",
    title: "전주 세계소리축제",
    start_date: "2026-09-03",
    end_date: "2026-09-07",
    addr1: "전북특별자치도 전주시 덕진구 소리로 31",
    addr2: "한국소리문화의전당 일원",
    mapx: 127.1294,
    mapy: 35.8569,
    firstimage: "", // 대표 이미지 없는 축제 테스트 케이스
    overview: "판소리와 국악을 중심으로 전 세계 전통음악과 월드뮤직이 어우러지는 글로벌 음악 축제입니다. 맛과 멋의 고장 전주에서 펼쳐집니다.",
    playtime: "공연별 상이 (14:00 ~ 21:00)",
    usetime: "야외 무료 / 실내 유료",
    sponsor1: "전북특별자치도",
    sponsor2: "전주세계소리축제조직위원회",
    tel: "063-232-8398",
    homepage: "http://www.sorifestival.com",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 7,
    contentid: "fest_07",
    title: "제주 들불축제",
    start_date: "2026-09-18",
    end_date: "2026-09-20",
    addr1: "제주특별자치도 제주시 애월읍 평화로 1529",
    addr2: "새별오름 일대",
    mapx: 126.3582,
    mapy: 33.3665,
    firstimage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60",
    overview: "제주의 옛 목축문화인 들불놓기(방애)를 현대적으로 재해석한 축제. 오름 전체를 붉게 물들이는 장엄한 미디어 파사드와 불꽃쇼가 진행됩니다.",
    playtime: "10:00 ~ 21:00",
    usetime: "무료",
    sponsor1: "제주시",
    sponsor2: "제주시관광축제추진협의회",
    tel: "064-728-2751",
    homepage: "https://www.jejusi.go.kr/buriburi/main.do",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 8,
    contentid: "fest_08",
    title: "진주 남강유등축제",
    start_date: "2026-10-05",
    end_date: "2026-10-18",
    addr1: "경상남도 진주시 남강로 626",
    addr2: "진주성 및 남강 일원",
    mapx: 128.0841,
    mapy: 35.1878,
    firstimage: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=60",
    overview: "임진왜란 진주성 전투에서 비롯된 유등 띄우기 풍습을 계승한 축제. 수만 개의 유등이 남강 물결 위에 아름다운 빛을 밝힙니다.",
    playtime: "18:00 ~ 24:00",
    usetime: "입장료 무료 (체험료 별도)",
    sponsor1: "진주시, 진주문화예술재단",
    tel: "055-755-9111",
    homepage: "http://www.yudeung.com",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 9,
    contentid: "fest_09",
    title: "보령 머드축제",
    start_date: "2026-07-20",
    end_date: "2026-08-04",
    addr1: "충청남도 보령시 대해로 897-15",
    addr2: "대천해수욕장 머드광장 일원",
    mapx: 126.5132,
    mapy: 36.3056,
    firstimage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=60",
    overview: "전 세계인이 함께 즐기는 대한민국 대표 여름 축제. 머드 슬라이드, 머드탕, K-POP 콘서트 등 다채로운 프로그램으로 가득합니다.",
    playtime: "10:00 ~ 18:00",
    usetime: "일반존 10,000원",
    sponsor1: "보령시",
    sponsor2: "보령축제관광재단",
    tel: "041-930-0891",
    homepage: "http://www.mudfestival.or.kr",
    status: "PUBLISHED",
    source: "API"
  },
  {
    id: 10,
    contentid: "fest_10",
    title: "한경 단독 기획: 2026 로컬 푸드 & 와인 페스타",
    start_date: "2026-09-05",
    end_date: "2026-09-06",
    addr1: "서울특별시 중구 청파로 463",
    addr2: "한국경제신문사 광장 및 루프탑",
    mapx: 126.9678,
    mapy: 37.5583,
    firstimage: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=60",
    overview: "한국경제신문이 주관하는 전국 팔도 특산물과 로컬 와이너리 만남의 장. 최고급 페어링 코스와 버스킹 공연이 함께합니다.",
    playtime: "13:00 ~ 21:00",
    usetime: "무료 (와인 시음권 패키지 15,000원)",
    sponsor1: "한국경제신문",
    sponsor2: "한경 트래블",
    tel: "02-360-4114",
    homepage: "https://www.hankyung.com/travel",
    status: "PUBLISHED",
    source: "MANUAL" // 관리자 수동등록 케이스
  }
];
