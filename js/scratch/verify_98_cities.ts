import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';
import { INDONESIA_98_CITIES } from '../data/indonesia_regions.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function verify() {
  console.log("--- NATIONWIDE 98-CITY LOGISTICS VERIFICATION REPORT ---");
  
  const { data: stations } = await supabase.from('sppg_units').select('city, name');
  const { data: vehicles } = await supabase.from('vehicles').select('license_plate');
  
  const foundCities = new Set(stations?.map(s => s.city));
  const missingCities = INDONESIA_98_CITIES.filter(c => !foundCities.has(c.name));
  
  console.log(`Total Cities in List: ${INDONESIA_98_CITIES.length}`);
  console.log(`Total Cities with SPPG Units: ${foundCities.size}`);
  console.log(`Total SPPG Units Nationwide: ${stations?.length || 0}`);
  console.log(`Total Active Vehicles: ${vehicles?.length || 0}`);
  
  if (missingCities.length === 0) {
    console.log("✅ SUCCESS: All 98 cities have 100% logistics coverage.");
  } else {
    console.log(`❌ FAILURE: ${missingCities.length} cities are missing coverage.`);
    missingCities.forEach(c => console.log(`   - Missing: ${c.name}`));
  }
  
  console.log("\n--- REGIONAL SPOT CHECK ---");
  const spotChecks = ['Sabang', 'Surakarta', 'Jayapura', 'Banjarmasin', 'Batam', 'Tual'];
  spotChecks.forEach(city => {
    const cityStations = stations?.filter(s => s.city === city);
    console.log(`${city}: ${cityStations?.length || 0} SPPG Units found.`);
  });
}

verify();
