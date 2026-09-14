---
layout: page
title: LevelDB 캐시 메커니즘 분석
date: 2022-12-01
description: >
  C++ 소스 분석 · 캐시 파라미터별 읽기 성능 실측 — KSC 2022 학부생 논문 1저자
links:
  - title: leveldb-cache-analysis
    url: https://github.com/sss654654/leveldb-cache-analysis
---

<p class="hl-back" markdown="0"><a href="/projects/">← Projects</a></p>

단국대학교 시스템 소프트웨어 연구실 학부 연구생(2022.07–12).
Google LevelDB는 LSM-tree 기반으로, 읽기 성능이 캐시 두 계층에 좌우됩니다.
두 캐시가 LRU 엔진 하나를 공유하는 구조를 C++ 소스로 분석하고, 캐시 파라미터별 읽기 지연을 실측해 **KSC 2022 학부생 논문 1저자**로 게재했습니다.
{:.lead}

## 캐시 구조

<div class="hl-sub" markdown="0">읽기 경로</div>

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/leveldb-readpath.png" alt="SSTable 읽기 경로 — TableCache::Get(key)가 인덱스 캐시(key=file_number, value=인덱스 블록)를 거쳐 Bloom 필터, 블록 캐시(key=cache_id+offset, value=데이터 블록)를 순서대로 조회. 히트면 메모리에서 반환, 미스면 디스크의 SSTable 파일을 읽어 채움">
</figure>

- **인덱스 캐시** — key `file_number`, value 인덱스 블록. 히트 시 **데이터 블록 위치(offset)** 반환, 미스 시 SSTable을 열어 인덱스 블록 적재. 용량 단위는 개수(파일 수)
- **블록 캐시** — key `cache_id + offset`, value 데이터 블록. 히트 시 **값 즉시 반환**, 미스 시 SSTable에서 블록을 읽어 적재. 용량 단위는 바이트 · `cache_id`로 여러 SSTable의 같은 offset 충돌 방지

<div class="hl-sub" markdown="0">LRU 엔진</div>

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/leveldb-lru.png" alt="ShardedLRUCache — key의 상위 해시 비트로 16개 샤드 중 하나를 고르고, 샤드 하나 안에서 같은 LRUHandle이 해시테이블(버킷 체인)과 이중 연결 리스트에 동시에 걸린다. 리스트는 lru_(refs=1, evict 후보)와 in_use_(refs≥2, evict 보호) 둘로 나뉜다">
</figure>

- **16개 샤드 · 샤드별 독립 락** — 락이 하나면 모든 조회가 순차 대기, 샤드 분할 시 서로 다른 키는 동시 조회
- **노드 하나로 조회 · 순서 관리** — 같은 `LRUHandle`을 해시테이블과 이중 연결 리스트에 함께 연결, 조회 · 순서 갱신 모두 복사 없이 O(1)
- **`refs`로 use-after-free 차단** — eviction 대상은 `lru_`(refs=1)뿐, `in_use_`(refs≥2)의 사용 중 블록은 해제 안 함

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 독립 변수 | **인덱스 캐시 개수 · 블록 캐시 크기 — 한 번에 하나만** | 둘을 같이 바꾸면 어느 쪽 효과인지 분리 불가 |
| 워크로드 | **readrandom · seekrandom · readhot** | 워킹셋이 다른 셋 — 전체 key 무작위 · 전 레벨 탐색 · 1%만 반복 |
{:.hl-dec}

## 결과

환경 — EC2 t2.micro · key 16B · value 100B · fillrandom 100MB

| 변수 | readrandom | seekrandom | readhot |
|---|---|---|---|
| 인덱스 캐시 개수 0 → 10,000 | **190 → 75μs** | 275 → 110μs | — |
| 블록 캐시 크기 1KB → 1GB | **190 → 27μs** | 195 → 33μs | 115 → 65μs |
{:.hl-dec}

<div class="hl-pair" markdown="0">
<figure class="hl-diagram">
<img src="/assets/img/projects/leveldb-index-cache.png" alt="실험 1 — 인덱스 캐시 개수 0·1·10·100·1,000·10,000에 따른 readrandom·seekrandom 지연. 100개에서 바닥">
<figcaption>실험 1 — 인덱스 캐시 개수</figcaption>
</figure>
<figure class="hl-diagram">
<img src="/assets/img/projects/leveldb-block-cache.png" alt="실험 2 — 블록 캐시 크기 1KB부터 1GB까지에 따른 readrandom·seekrandom·readhot 지연. readrandom은 꾸준히, seekrandom은 100MB 이후 급락, readhot은 평탄">
<figcaption>실험 2 — 블록 캐시 크기</figcaption>
</figure>
</div>

- **인덱스 캐시는 100개에서 포화** — 실험 데이터의 SSTable이 100개 이하라 추가로 캐싱할 인덱스 블록 없음
- **블록 캐시 효과는 워킹셋에 비례** — seekrandom은 100MB 초과 시 급락, readhot은 1KB에서 이미 낮아 개선 폭 작음
- **KSC 2022 학부생 논문 1저자 게재**

## 한계

- **t2.micro 단일 인스턴스 실험** — 멀티노드 · 대용량 환경의 캐시 거동 미검증
- **16개 샤드 간 부하 균등 분배 미확인** — 논문 후속 과제로 남김

## 기술 스택

C++ · LevelDB · db_bench · AWS EC2
{:.hl-more}

[github.com/sss654654/leveldb-cache-analysis](https://github.com/sss654654/leveldb-cache-analysis) · [논문 PDF](https://github.com/sss654654/leveldb-cache-analysis/blob/main/papers/%EC%B5%9C%EC%A2%85%EB%B3%B8LevelDB_%EC%BA%90%EC%8B%9C_%EA%B5%AC%EC%A1%B0_%EB%B0%8F_%EC%84%B1%EB%8A%A5_%EB%B6%84%EC%84%9D.pdf)
{:.hl-more}

{% include pj-nav.html %}
