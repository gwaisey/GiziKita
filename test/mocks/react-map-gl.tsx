
export default function MapGL({ children }: any) {
  return <div data-testid="mock-map">{children}</div>;
}

export function NavigationControl() { return <div data-testid="nav-control" />; }
export function FullscreenControl() { return <div data-testid="fullscreen-control" />; }
export function Source({ children }: any) { return <div data-testid="source">{children}</div>; }
export function Layer() { return <div data-testid="layer" />; }
export function Marker({ children }: any) { return <div data-testid="marker">{children}</div>; }

export type MapRef = any;
