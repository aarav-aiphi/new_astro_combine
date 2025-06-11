import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromoRibbon from '../components/ui/PromoRibbon';

// Simple component tests
describe('Component Tests', () => {
  test('PromoRibbon renders when show is true', () => {
    render(<PromoRibbon show={true} />);
    expect(screen.getByText('FIRST SESSION 50% OFF')).toBeInTheDocument();
  });

  test('PromoRibbon does not render when show is false', () => {
    render(<PromoRibbon show={false} />);
    expect(screen.queryByText('FIRST SESSION 50% OFF')).not.toBeInTheDocument();
  });

  test('PromoRibbon has correct positioning classes', () => {
    const { container } = render(<PromoRibbon show={true} />);
    const promoElement = container.querySelector('.absolute.top-0.-right-4.z-20');
    expect(promoElement).toBeInTheDocument();
  });

  test('PromoRibbon has rotated content', () => {
    const { container } = render(<PromoRibbon show={true} />);
    const rotatedElement = container.querySelector('.transform.rotate-45');
    expect(rotatedElement).toBeInTheDocument();
    expect(rotatedElement).toHaveClass('bg-gradient-to-r');
  });

  test('PromoRibbon maintains proper CSS classes for styling', () => {
    const { container } = render(<PromoRibbon show={true} />);
    const ribbonContent = container.querySelector('.from-red-500.to-pink-500');
    expect(ribbonContent).toBeInTheDocument();
    expect(ribbonContent).toHaveClass('text-white', 'text-xs', 'font-bold');
  });
}); 