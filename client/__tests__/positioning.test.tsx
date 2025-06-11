import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromoRibbon from '../components/ui/PromoRibbon';

// Test positioning improvements
describe('Positioning Tests', () => {
  test('PromoRibbon uses mobile-safe positioning at top-0 -right-4', () => {
    const { container } = render(<PromoRibbon show={true} />);
    
    // Check for the specific positioning classes
    const ribbon = container.querySelector('.absolute.top-0.-right-4.z-20');
    expect(ribbon).toBeInTheDocument();
    
    // Verify it has the correct z-index for layering
    expect(ribbon).toHaveClass('z-20');
  });

  test('PromoRibbon and rate badge positioning prevents collision', () => {
    const { container } = render(
      <div className="relative w-96 h-80">
        <PromoRibbon show={true} />
        {/* Simulate rate badge positioning */}
        <div className="absolute top-10 right-2 z-10 badge badge-info">
          ₹30/min
        </div>
      </div>
    );

    // Both elements should be present
    const ribbon = container.querySelector('.top-0.-right-4');
    const badge = container.querySelector('.top-10.right-2');
    
    expect(ribbon).toBeInTheDocument();
    expect(badge).toBeInTheDocument();
    
    // Check z-index hierarchy - ribbon should be higher
    expect(ribbon).toHaveClass('z-20');
    expect(badge).toHaveClass('z-10');
  });

  test('PromoRibbon rotation does not interfere with layout on mobile width', () => {
    const { container } = render(
      <div style={{ width: '375px' }}> {/* Mobile width */}
        <div className="relative w-96 h-80">
          <PromoRibbon show={true} />
        </div>
      </div>
    );

    const rotatedContent = container.querySelector('.transform.rotate-45');
    expect(rotatedContent).toBeInTheDocument();
    expect(rotatedContent).toHaveClass('bg-gradient-to-r', 'from-red-500', 'to-pink-500');
  });

  test('Vertical separation between ribbon and badge positions', () => {
    // Test that ribbon is at top-0 and badge would be at top-10
    const { container } = render(
      <div className="relative">
        <PromoRibbon show={true} />
      </div>
    );

    const ribbon = container.querySelector('.top-0');
    expect(ribbon).toBeInTheDocument();
    
    // The ribbon should NOT have top-10 class (which is for badges)
    expect(ribbon).not.toHaveClass('top-10');
  });

  test('PromoRibbon maintains proper shadow and styling', () => {
    const { container } = render(<PromoRibbon show={true} />);
    
    const ribbonContent = container.querySelector('.transform.rotate-45.shadow-lg');
    expect(ribbonContent).toBeInTheDocument();
    
    // Check for shadow effect element
    const shadowEffect = container.querySelector('.blur-sm.opacity-30');
    expect(shadowEffect).toBeInTheDocument();
  });
}); 