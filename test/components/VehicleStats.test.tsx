import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VehicleStats from '@/src/components/VehicleStats';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import '@testing-library/jest-dom';

const mockFleet: Vehicle[] = [
  {
    id: 'v1',
    license_plate: 'B 1001 BGN',
    driver_name: 'Pak Budi',
    status: 'en_route',
    city: 'Jakarta Pusat',
    destination_school_name: 'SDN Menteng 01',
    last_lat: -6.2,
    last_lng: 106.8,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v2',
    license_plate: 'B 2002 BGN',
    driver_name: 'Pak Joko',
    status: 'unloading',
    city: 'Jakarta Pusat',
    destination_school_name: 'SDN Cikini 02',
    last_lat: -6.21,
    last_lng: 106.82,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v3',
    license_plate: 'B 3003 BGN',
    driver_name: 'Pak Slamet',
    status: 'idle',
    city: 'Jakarta Pusat',
    destination_school_name: null,
    last_lat: -6.19,
    last_lng: 106.81,
    updated_at: new Date().toISOString(),
  }
];

describe('VehicleStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVehicleStore.setState({
      vehicles: mockFleet,
      selectedCity: 'Semua',
      selectedCategory: 'all'
    });
  });

  it('renders all stat cards with correct numbers', () => {
    render(<VehicleStats />);

    expect(screen.getByText('Total Armada')).toBeInTheDocument();
    expect(screen.getByText('Sedang Jalan')).toBeInTheDocument();
    expect(screen.getByText('Siaga / Idle')).toBeInTheDocument();
    expect(screen.getByText('Menurunkan')).toBeInTheDocument();

    expect(screen.getByText('3')).toBeInTheDocument(); // total
  });

  it('opens detailed vehicle modal when clicking Sedang Jalan card', () => {
    const handleSelect = vi.fn();
    render(<VehicleStats onVehicleSelect={handleSelect} />);

    // Click on "Sedang Jalan" card
    const movingCard = screen.getByText('Sedang Jalan').closest('.stat-card');
    expect(movingCard).toBeInTheDocument();
    fireEvent.click(movingCard!);

    // Modal title should appear
    expect(screen.getByText('Armada Sedang Jalan')).toBeInTheDocument();
    // Vehicle details should be listed in the modal
    expect(screen.getByText('B 1001 BGN')).toBeInTheDocument();
    expect(screen.getByText('Pak Budi')).toBeInTheDocument();
    expect(screen.getByText('SDN Menteng 01')).toBeInTheDocument();

    // Click "Lacak Rute di Peta"
    const trackBtn = screen.getByText(/Lacak Rute di Peta/i);
    fireEvent.click(trackBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockFleet[0]);
  });

  it('opens detailed vehicle modal when clicking Menurunkan card', () => {
    render(<VehicleStats />);

    // Click on "Menurunkan" card
    const unloadingCard = screen.getByText('Menurunkan').closest('.stat-card');
    fireEvent.click(unloadingCard!);

    expect(screen.getByText('Armada Menurunkan Makanan')).toBeInTheDocument();
    expect(screen.getByText('B 2002 BGN')).toBeInTheDocument();
    expect(screen.getByText('Pak Joko')).toBeInTheDocument();
    expect(screen.getByText('SDN Cikini 02')).toBeInTheDocument();
  });
});
