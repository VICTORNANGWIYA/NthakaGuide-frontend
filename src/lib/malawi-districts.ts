export interface District {
  name: string;
  region: "Northern" | "Central" | "Southern";


}

export const MALAWI_DISTRICTS: District[] = [
  // Northern Region
  { name: "Chitipa", region: "Northern"},
  { name: "Karonga", region: "Northern"},
  { name: "Likoma", region: "Northern"},
  { name: "Mzimba", region: "Northern"},
  { name: "Nkhata Bay", region: "Northern" },
  { name: "Rumphi", region: "Northern"},
  // Central Region
  { name: "Dedza", region: "Central"},
  { name: "Dowa", region: "Central"},
  { name: "Kasungu", region: "Central"},
  { name: "Lilongwe", region: "Central"},
  { name: "Mchinji", region: "Central"},
  { name: "Nkhotakota", region: "Central"},
  { name: "Ntcheu", region: "Central"},
  { name: "Ntchisi", region: "Central"},
  { name: "Salima", region: "Central"},
  // Southern Region
  { name: "Balaka", region: "Southern"},
  { name: "Blantyre", region: "Southern" },
  { name: "Chikwawa", region: "Southern"},
  { name: "Chiradzulu", region: "Southern"},
  { name: "Machinga", region: "Southern"},
  { name: "Mangochi", region: "Southern"},
  { name: "Mulanje", region: "Southern"},
  { name: "Mwanza", region: "Southern"},
  { name: "Neno", region: "Southern" },
  { name: "Nsanje", region: "Southern"},
  { name: "Phalombe", region: "Southern"},
  { name: "Thyolo", region: "Southern" },
  { name: "Zomba", region: "Southern"},
];

export function getDistrictByName(name: string): District | undefined {
  return MALAWI_DISTRICTS.find(d => d.name === name);
}
