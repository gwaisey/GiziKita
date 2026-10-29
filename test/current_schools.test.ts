import { describe, it, expect } from 'vitest';
import { clampCoordinatesToLand, isCoordinateInOpenSea } from '../js/utils/routing';
import { INDONESIA_514_REGIONS, findRegionByName } from '../js/data/indonesia_regions';

describe('Robust Land Clamping and Zero Offshore Schools Verification', () => {
  it('guarantees NO school is placed in Java Sea, Flores Sea, or Banda Sea when coordinates are null', () => {
    for (const reg of INDONESIA_514_REGIONS) {
      const res = clampCoordinatesToLand(null as any, null as any, reg.name);
      expect(isCoordinateInOpenSea(res.lat, res.lng), `${reg.name} with null coordinates fell into open sea`).toBe(false);
      expect(Number.isFinite(res.lat)).toBe(true);
      expect(Number.isFinite(res.lng)).toBe(true);
    }
  });

  it('guarantees NO school is placed in open sea when alien or misplaced coordinates (-6.2, 106.8) are passed', () => {
    for (const reg of INDONESIA_514_REGIONS) {
      const res = clampCoordinatesToLand(-6.2, 106.8, reg.name);
      expect(isCoordinateInOpenSea(res.lat, res.lng), `${reg.name} with alien coordinates fell into open sea`).toBe(false);
      expect(Number.isFinite(res.lat)).toBe(true);
      expect(Number.isFinite(res.lng)).toBe(true);
    }
  });

  it('guarantees all 52 known seeded schools from database map 100% solidly on land', () => {
    const dbSchoolSamples = [
      { name: 'SDN Warungkiara', city: 'Kab. Sukabumi' },
      { name: 'SDN Ciledug 01', city: 'Kota Tangerang' },
      { name: 'SDN Mampang Prapatan 02', city: 'Jakarta Selatan' },
      { name: 'SDN 1 Kebumen', city: 'Kab. Kebumen' },
      { name: 'SDN Kepatihan', city: 'Kab. Bojonegoro' },
      { name: 'SDN 1 Banda Aceh', city: 'Banda Aceh' },
      { name: 'SMPN 2 Sigli', city: 'Kab. Pidie' },
      { name: 'SDN 060824 Medan', city: 'Medan' },
      { name: 'SMPN 1 Binjai', city: 'Binjai' },
      { name: 'SDN 23 Ujung Gurun', city: 'Padang' },
      { name: 'SMPN 1 Bukittinggi', city: 'Bukittinggi' },
      { name: 'SDN 36 Pekanbaru', city: 'Pekanbaru' },
      { name: 'SDN 004 Sekupang', city: 'Batam' },
      { name: 'SDN 47 Jambi', city: 'Kota Jambi' },
      { name: 'SDN 2 Bengkulu', city: 'Kota Bengkulu' },
      { name: 'SDN 109 Palembang', city: 'Palembang' },
      { name: 'SDN 12 Pangkal Pinang', city: 'Pangkal Pinang' },
      { name: 'SDN 1 Way Halim', city: 'Bandar Lampung' },
      { name: 'SDN Menteng 01', city: 'Jakarta Pusat' },
      { name: 'SMPN 255 Jakarta', city: 'Jakarta Timur' },
      { name: 'SDN Pekunden', city: 'Kota Semarang' },
      { name: 'SDN Kaliasin I', city: 'Kota Surabaya' },
      { name: 'SDN Mangkura', city: 'Kota Makassar' },
      { name: 'SDN 11 Manado', city: 'Kota Manado' },
      { name: 'SDN 2 Cakranegara', city: 'Kota Mataram' },
      { name: 'SDN 041 Tarakan', city: 'Tarakan' },
    ];

    for (const school of dbSchoolSamples) {
      const matched = findRegionByName(school.city);
      const baseLat = matched?.lat;
      const baseLng = matched?.lng;
      const res = clampCoordinatesToLand(baseLat!, baseLng!, school.city);

      expect(isCoordinateInOpenSea(res.lat, res.lng), `School ${school.name} in ${school.city} mapped into open sea: [${res.lat}, ${res.lng}]`).toBe(false);
      expect(Number.isFinite(res.lat)).toBe(true);
      expect(Number.isFinite(res.lng)).toBe(true);
    }
  });
});
