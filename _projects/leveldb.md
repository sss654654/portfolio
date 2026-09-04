---
layout: page
title: LevelDB 캐시 메커니즘 분석
date: 2022-12-01
description: >
  C++ 소스를 읽고 캐시 파라미터가 읽기 성능에 미치는 영향을 실측했습니다 — KSC 2022 학부생 논문 1저자
links:
  - title: leveldb-cache-analysis
    url: https://github.com/sss654654/leveldb-cache-analysis
---

<p class="hl-back" markdown="0"><a href="/projects/">← 프로젝트</a></p>

단국대학교 시스템 소프트웨어 연구실 학부 연구생(2022.07–12).
LSM-tree 기반이라 읽기를 캐시 두 계층에 기대는 Google LevelDB에서, 두 캐시가 LRU 엔진 하나를 공유하는 구조를 C++ 소스로 분석하고
캐시 파라미터가 읽기 지연에 미치는 영향을 실측해 **KSC 2022 학부생 논문 1저자**로 게재했습니다.
{:.lead}

## 캐시 구조

<div class="hl-sub" markdown="0">읽기 경로</div>

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/leveldb-readpath.png" alt="SSTable 읽기 경로 — TableCache::Get(key)가 인덱스 캐시(key=file_number, value=인덱스 블록)를 거쳐 Bloom 필터, 블록 캐시(key=cache_id+offset, value=데이터 블록)를 순서대로 조회. 히트면 메모리에서 반환, 미스면 디스크의 SSTable 파일을 읽어 채움">
</figure>

- **인덱스 캐시** — key `file_number`, value 인덱스 블록. 히트면 **데이터 블록의 위치(offset)**를 돌려주고, 미스면 SSTable을 열어 인덱스 블록을 올립니다. 용량은 개수(파일 수)로 셉니다
- **블록 캐시** — key `cache_id + offset`, value 데이터 블록. 히트면 **값을 바로 꺼내고**, 미스면 SSTable에서 그 블록을 읽어와 채웁니다. 용량은 바이트로 셉니다 · `cache_id`가 붙어 여러 SSTable이 같은 offset을 써도 충돌하지 않습니다

<div class="hl-sub" markdown="0">LRU 엔진</div>

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/leveldb-lru.png" alt="ShardedLRUCache — key의 상위 해시 비트로 16개 샤드 중 하나를 고르고, 샤드 하나 안에서 같은 LRUHandle이 해시테이블(버킷 체인)과 이중 연결 리스트에 동시에 걸린다. 리스트는 lru_(refs=1, evict 후보)와 in_use_(refs≥2, evict 보호) 둘로 나뉜다">
</figure>

- **16개 샤드에 독립 락** — 락이 하나면 모든 조회가 순차 대기하는데, 샤드를 쪼개면 서로 다른 키는 동시에 조회됩니다
- **한 노드로 조회와 순서를 함께** — 같은 `LRUHandle`이 해시테이블과 이중 연결 리스트에 동시에 걸려, 조회도 순서 갱신도 복사 없이 O(1)입니다
- **`refs`로 use-after-free 차단** — eviction은 `lru_`(refs=1)만 훑고 `in_use_`(refs≥2)는 건드리지 않아, 쓰는 중인 블록은 해제되지 않습니다

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 독립 변수 | **인덱스 캐시 개수 · 블록 캐시 크기 — 한 번에 하나만** | 둘을 같이 바꾸면 어느 쪽 효과인지 분리 불가 |
| 워크로드 | **readrandom · seekrandom · readhot** | 워킹셋이 다른 셋 — 전체 key 무작위 · 전 레벨 탐색 · 1%만 반복 |
{:.hl-dec}

## 결과

환경은 EC2 t2.micro · key 16B · value 100B · fillrandom 100MB.

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

- **인덱스 캐시는 100개에서 포화합니다** — 이 실험의 SSTable이 100개 이하라 더 캐싱할 인덱스 블록이 없습니다
- **블록 캐시는 워킹셋에 비례합니다** — seekrandom은 100MB를 넘어야 급락하고, readhot은 1KB에서 이미 낮아 개선 폭이 작습니다
- **KSC 2022 학부생 논문 1저자로 게재했습니다**

## 한계

- **t2.micro 단일 인스턴스 실험입니다** — 멀티노드·대용량 환경의 캐시 거동은 검증하지 못했습니다
- **16개 샤드 사이 부하가 고르게 나뉘는지는 확인하지 못했습니다** — 논문 결론의 후속 과제로 남겼습니다

## 기술 스택

C++ · LevelDB · db_bench · AWS EC2
{:.hl-more}

[github.com/sss654654/leveldb-cache-analysis](https://github.com/sss654654/leveldb-cache-analysis) · [논문 PDF](https://github.com/sss654654/leveldb-cache-analysis/blob/main/papers/%EC%B5%9C%EC%A2%85%EB%B3%B8LevelDB_%EC%BA%90%EC%8B%9C_%EA%B5%AC%EC%A1%B0_%EB%B0%8F_%EC%84%B1%EB%8A%A5_%EB%B6%84%EC%84%9D.pdf)
{:.hl-more}

{% include pj-nav.html %}
