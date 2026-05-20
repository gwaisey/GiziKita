import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';
import { INDONESIA_514_REGIONS } from '../data/indonesia_regions.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function verify() {
  console.log("--- ULTIMATE 514-REGION LOGISTICS AUDIT REPORT ---");
  
  const { data: stations } = await supabase.from('sppg_units').select('city, name');
  const { data: vehicles } = await supabase.from('vehicles').select('license_plate');
  
  const regionsWithStations = new Map<string, number>();
  stations?.forEach(s => {
    regionsWithStations.set(s.city, (regionsWithStations.get(s.city) || 0) + 1);
  });
  
  const missingRegions = INDONESIA_514_REGIONS.filter(c => !regionsWithStations.has(c.name));
  const singleStationRegions = INDONESIA_514_REGIONS.filter(c => regionsWithStations.get(c.name) === 1);
  
  console.log(`Target Regions: ${INDONESIA_514_REGIONS.length}`);
  console.log(`Regions with >=2 Stations: ${INDONESIA_514_REGIONS.length - missingRegions.length - singleStationRegions.length}`);
  console.log(`Total SPPG Units: ${stations?.length || 0}`);
  console.log(`Total Vehicles: ${vehicles?.length || 0}`);
  
  if (missingRegions.length === 0 && singleStationRegions.length === 0) {
    console.log("✅ SUCCESS: All 514 regions have >1 logistics coverage.");
  } else {
    if (missingRegions.length > 0) {
      console.log(`❌ FAILURE: ${missingRegions.length} regions are missing entirely.`);
    }
    if (singleStationRegions.length > 0) {
      console.log(`⚠️ WARNING: ${singleStationRegions.length} regions have only 1 station.`);
    }
  }
  
  console.log("\n--- REMOTE REGION SPOT CHECK ---");
  const spotChecks = ['Simeulue', 'Aceh Singkil', 'Asmat', 'Merauke', 'Mappi', 'Morowali'];
  spotChecks.forEach(region => {
    const count = regionsWithStations.get(region) || 0;
    console.log(`${region}: ${count} SPPG Hubs found.`);
  });
}

verify();
