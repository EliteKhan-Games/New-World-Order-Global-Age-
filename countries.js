// ISO-3166 numeric IDs from world-atlas. Nordic Union and Ottoman Empire
// intentionally combine modern map shapes to match the game's alternate-history setup.
export const COUNTRIES = [
  { code: 'USA', name: 'United States', iso: ['840'], color: '#4f86d9', treasury: 250000000, population: 5000000 },
  { code: 'FRA', name: 'France', iso: ['250'], color: '#6495ed', treasury: 180000000, population: 3000000 },
  { code: 'GBR', name: 'Britain', iso: ['826'], color: '#d65b63', treasury: 190000000, population: 3200000 },
  { code: 'RUS', name: 'Russia', iso: ['643'], color: '#c36b54', treasury: 220000000, population: 4200000 },
  { code: 'CHN', name: 'China', iso: ['156'], color: '#d8a441', treasury: 210000000, population: 7000000 },
  { code: 'IND', name: 'India', iso: ['356'], color: '#d98b43', treasury: 150000000, population: 6000000 },
  { code: 'BRA', name: 'Brazil', iso: ['076'], color: '#55a77a', treasury: 130000000, population: 2500000 },
  { code: 'ARG', name: 'Argentina', iso: ['032'], color: '#65a9c8', treasury: 95000000, population: 1200000 },
  { code: 'ZAF', name: 'South Africa', iso: ['710'], color: '#8dba65', treasury: 105000000, population: 900000 },
  { code: 'EGY', name: 'Egypt', iso: ['818'], color: '#b99a63', treasury: 90000000, population: 1100000 },
  { code: 'POL', name: 'Poland', iso: ['616'], color: '#c98c9e', treasury: 100000000, population: 1000000 },
  { code: 'UKR', name: 'Ukraine', iso: ['804'], color: '#e2c45a', treasury: 105000000, population: 1100000 },
  { code: 'DEU', name: 'Germany', iso: ['276'], color: '#9299a6', treasury: 170000000, population: 2200000 },
  { code: 'NORD', name: 'Nordic Union', iso: ['578','752','208','246','352'], color: '#63a7a0', treasury: 145000000, population: 1400000 },
  { code: 'PER', name: 'Persia', iso: ['364'], color: '#a88bc5', treasury: 85000000, population: 1000000 },
  { code: 'JPN', name: 'Japan', iso: ['392'], color: '#d77b83', treasury: 160000000, population: 1800000 },
  { code: 'ESP', name: 'Spain', iso: ['724'], color: '#d5a04b', treasury: 115000000, population: 1300000 },
  { code: 'OTT', name: 'Ottoman Empire', iso: ['792'], color: '#bd765c', treasury: 110000000, population: 1500000 },
  { code: 'MEX', name: 'Mexico', iso: ['484'], color: '#5a9b78', treasury: 105000000, population: 1700000 },
  { code: 'AUS', name: 'Australia', iso: ['036'], color: '#b28d58', treasury: 125000000, population: 800000 }
];

export const COUNTRY_BY_ISO = Object.fromEntries(COUNTRIES.flatMap(c => c.iso.map(iso => [iso, c])));
export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
