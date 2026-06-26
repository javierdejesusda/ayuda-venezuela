// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PhotoCarousel } from '@/components/photo-carousel';

const FOTOS = [
  'https://x.supabase.co/storage/v1/object/public/fotos/a.jpg',
  'https://x.supabase.co/storage/v1/object/public/fotos/b.jpg',
  'https://x.supabase.co/storage/v1/object/public/fotos/c.jpg',
  'https://x.supabase.co/storage/v1/object/public/fotos/d.jpg',
  'https://x.supabase.co/storage/v1/object/public/fotos/e.jpg',
];

afterEach(() => cleanup());

describe('PhotoCarousel', () => {
  it('renders nothing when given 0 photos', () => {
    const { container } = render(<PhotoCarousel fotos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the image with no controls when given 1 photo', () => {
    render(<PhotoCarousel fotos={[FOTOS[0]]} />);
    expect(screen.queryByRole('button', { name: 'Foto anterior' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Foto siguiente' })).toBeNull();
    expect(document.querySelector('img')).not.toBeNull();
  });

  it('shows indicator "Foto 2 de 5" after clicking next once with 5 photos', () => {
    render(<PhotoCarousel fotos={FOTOS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('Foto 2 de 5')).toBeInTheDocument();
  });

  it('wraps from last index to 0 when next is clicked at the end', () => {
    render(<PhotoCarousel fotos={FOTOS.slice(0, 3)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('Foto 3 de 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('Foto 1 de 3')).toBeInTheDocument();
  });

  it('wraps from index 0 to last when prev is clicked at the start', () => {
    render(<PhotoCarousel fotos={FOTOS.slice(0, 3)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
    expect(screen.getByText('Foto 3 de 3')).toBeInTheDocument();
  });

  it('exposes accessible names on prev and next controls', () => {
    render(<PhotoCarousel fotos={FOTOS} />);
    expect(screen.getByRole('button', { name: 'Foto anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Foto siguiente' })).toBeInTheDocument();
  });

  it('uses "Foto del reporte" as the image alt text', () => {
    render(<PhotoCarousel fotos={FOTOS} />);
    expect(document.querySelector('img')?.getAttribute('alt')).toBe('Foto del reporte');
  });

  it('shows indicator "Foto 1 de n" at initial render', () => {
    render(<PhotoCarousel fotos={FOTOS} />);
    expect(screen.getByText('Foto 1 de 5')).toBeInTheDocument();
  });
});
