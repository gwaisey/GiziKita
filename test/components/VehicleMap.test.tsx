import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VehicleMap from '@/src/components/VehicleMap';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

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
    renderWithQueryClient(<VehicleMap />);
    
    // Check if map legend exists
    expect(screen.getByText('Keterangan Peta')).toBeInTheDocument();
    
    // Check if new expanded legend items exist
    expect(screen.getByText('Armada (Dalam Perjalanan)')).toBeInTheDocument();
    expect(screen.getByText('Armada (Kritis/Off Route)')).toBeInTheDocument();
  });

  it('renders SelectedVehiclePanel reactively when a vehicle is selected via store', () => {
    // We simulate a selected vehicle from the parent
    renderWithQueryClient(<VehicleMap selectedVehicle={mockVehicles[0]} />);
    
    // The panel should render the license plate
    expect(screen.getByText('B 1234 BGN')).toBeInTheDocument();
    expect(screen.getByText('Pak Andi')).toBeInTheDocument();
  });

  it('renders destination school marker and badge when vehicle with destination is selected', () => {
    const vehicleWithSchool: Vehicle = {
      ...mockVehicles[0],
      destination_lat: -6.22,
      destination_lng: 106.86,
      destination_school_name: 'SDN Menteng 01 Pagi',
    };

    renderWithQueryClient(<VehicleMap selectedVehicle={vehicleWithSchool} />);

    // Verify school destination badge and panel info are rendered
    const elements = screen.getAllByText('SDN Menteng 01 Pagi');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTitle('SDN Menteng 01 Pagi')).toBeInTheDocument();
  });

  it('auto-recovers and renders destination school marker even if destination_lat and destination_lng are null in vehicle data', () => {
    const vehicleWithNullDest: Vehicle = {
      ...mockVehicles[0],
      city: 'Jakarta Pusat',
      destination_lat: null,
      destination_lng: null,
      destination_school_name: null,
    };

    renderWithQueryClient(<VehicleMap selectedVehicle={vehicleWithNullDest} />);

    // Should auto-resolve to a valid school marker with title containing Sekolah
    const marker = screen.getByTitle(/Sekolah Penerima/i);
    expect(marker).toBeInTheDocument();
  });
});
