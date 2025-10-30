export function Inter(options?: { subsets?: string[]; display?: string; variable?: string }) {
  return {
    className: 'font-inter',
    variable: options?.variable || '--font-inter',
  };
}