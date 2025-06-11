// Mock for lucide-react icons
export const X = ({ className, ...props }) => (
  <svg className={className} {...props} data-testid="x-icon">
    <rect width="18" height="18" />
  </svg>
);

export default {
  X,
}; 