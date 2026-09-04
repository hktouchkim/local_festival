# 지역축제 프로젝트 진행 현황 및 집 작업 가이드

본 문서는 회사 컴퓨터에서 진행된 한국경제 '지역축제' 서비스 개발 내역 및 집 컴퓨터에서 원활히 작업을 이어가기 위한 핵심 설정 정보를 정리함.

---

## 1. 프로젝트 핵심 정보

- **서비스 대표 URL**: `https://local-festival-hktouchkim.vercel.app`
- **GitHub 원격 저장소**: `https://github.com/hktouchkim/local_festival.git`
- **클라우드 데이터베이스 (Neon PostgreSQL)**:
  - 현재 적재 데이터: 한국관광공사 2026년 실제 축제 **총 678건** 완벽 적재 완료 (`festivals` 테이블).
- **카카오맵 설정**:
  - JavaScript 키: `eb3a51361a63acc8e8877f7307febc8a`
  - 허용 도메인: `https://local-festival-hktouchkim.vercel.app` (등록 및 카카오맵 제품 활성화 ON 완료)

---

## 2. 지금까지 완료된 주요 작업 내역

1. **상단 헤더(Header) 개편**:
   - 한경 트래블 공식 벡터 로고 적용 (`https://hkstatic.hankyung.com/resource/common/img/logo/logo-travel.svg`, 규격 228x35).
   - 탑바와 서브 GNB 사이 가로 구분선 제거.
   - 서브 GNB 메뉴 가운데 정렬(`justify-center`) 및 '지역축제' 탭 활성화.
2. **실제 카카오 정품 지도(Kakao Maps SDK) 연동**:
   - 한반도 정중앙 좌표(`35.9, 127.8`) 및 전국 뷰 줌 레벨 최적화로 초기 접속 시 서울부터 제주도까지 한눈에 표시.
   - 초기 로딩 시 첫 번째 축제로 지도가 자동 줌인되는 현상 배제 (전국 뷰 유지).
   - 마커 클릭 시 해당 위치 줌인 및 한경픽 커스텀 말풍선(CustomOverlay) 노출.
3. **축제 데이터 전수 수신 및 노출**:
   - 한국관광공사 TourAPI 연동으로 2026년 축제 678건 수신 및 클라우드 DB 적재 완료.
   - 기본 기간 탭을 `ALL(전체)`로 지정하여 1년 내내 개최되는 축제들이 풍성하게 노출되도록 개선.
4. **Vercel 퍼블릭 배포 설정**:
   - Vercel Authentication 보호 해제하여 로그인 없이 누구나 접속 가능한 상태로 배포.

---

## 3. 집 컴퓨터에서 안티그래비티로 이어서 작업하는 방법

### 1단계: 깃 저장소 다운로드
집 컴퓨터 터미널에서 실행:
```bash
git clone https://github.com/hktouchkim/local_festival.git
cd local_festival
```

### 2단계: 안티그래비티 실행 후 프롬프트 입력
다운로드한 `local_festival` 폴더를 안티그래비티로 열고 아래 내용을 그대로 채팅창에 입력함:

> **"회사에서 작업하던 local_festival 프로젝트야. `PROJECT_SUMMARY.md` 파일 확인해서 진행 현황 파악해주고, 필요한 패키지(`npm install`) 설치해줘. 상단 헤더랑 카카오맵 UI 추가 수정 작업 이어서 진행하자."**

위 한 줄만 입력하면 집 안티그래비티가 이전 작업 내역과 의도를 100% 동일하게 파악하여 작업을 이어갈 수 있음.
