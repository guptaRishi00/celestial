/**
 * Type augmentations for swisseph-wasm.
 *
 * The published type definitions are incomplete — they omit several functions
 * that exist at runtime (houses_ex, houses_ex2, etc.) and the return type for
 * `houses` is wrong (the actual implementation returns an object, not a number).
 * This module declaration merges in the missing pieces.
 */
declare module "swisseph-wasm" {
  interface HousesResult {
    /** 13-element Float64Array: cusps[0] is unused, cusps[1..12] are house cusps. */
    cusps: Float64Array;
    /** 10-element Float64Array: ascmc[0]=Ascendant, ascmc[1]=MC, etc. */
    ascmc: Float64Array;
  }

  export default interface SwissEph {
    /** Calculate house cusps with extended flags (swe_houses_ex). */
    houses_ex(jd: number, iflag: number, latitude: number, longitude: number, hsys: string): HousesResult;

    /** Calculate house cusps with extended flags v2 (swe_houses_ex2). */
    houses_ex2(jd: number, iflag: number, latitude: number, longitude: number, hsys: string): HousesResult;

    /** Override: the actual return type is an object, not a number. */
    houses(jd: number, latitude: number, longitude: number, hsys: string): HousesResult;

    /** Calculate house cusps from ARMC (swe_houses_armc). */
    houses_armc(armc: number, geoLat: number, eps: number, hsys: string): HousesResult;

    /** Calculate house cusps from ARMC v2 (swe_houses_armc_ex2). */
    houses_armc_ex2(armc: number, geoLat: number, eps: number, hsys: string): HousesResult;
  }
}
