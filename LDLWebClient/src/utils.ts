export const numberWithCommas = (v: number) =>
  v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
