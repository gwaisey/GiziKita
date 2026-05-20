import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VehicleMap from '@/src/components/VehicleMap';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import '@testing-library/jest-dom';

// Menggunakan mock global dari test/mocks/react-map-gl.tsx

// Mock next/dynamic if needed, though VehicleMap is exported dynamically, we are testing the default export if it's the raw component.
// Wait, in VehicleMap.tsx, the export default is dynamically exported?
// Let's assume we can render it directly or mock its dependencies.

const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    license_plate: 'B 1234 BGN',
    driver_name: 'Pak Andi',
    status: 'en_route',
    last_lat: -6.2088,
    last_lng: 106.8456,
    updated_at: new Date().toISOString(),
  }
];

describe('VehicleMap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'dummy-test-token';
    useVehicleStore.setState({ 
      vehicles: mockVehicles, 
      loading: false,
      selectedCity: 'Semua'
    });
  });

  it('renders without crashing and displays the map legend', () => {
    render(<VehicleMap />);
    
    // Check if map legend exists
    expect(screen.getByText('Keterangan Peta')).toBeInTheDocument();
    
    // Check if new expanded legend items exist
    expect(screen.getByText('Armada (Dalam Perjalanan)')).toBeInTheDocument();
    expect(screen.getByText('Armada (Kritis/Off Route)')).toBeInTheDocument();
  });

  it('renders SelectedVehiclePanel reactively when a vehicle is selected via store', () => {
    // We simulate a selected vehicle from the parent
    render(<VehicleMap selectedVehicle={mockVehicles[0]} />);
    
    // The panel should render the license plate
    expect(screen.getByText('B 1234 BGN')).toBeInTheDocument();
    expect(screen.getByText('Pak Andi')).toBeInTheDocument();
  });
});
