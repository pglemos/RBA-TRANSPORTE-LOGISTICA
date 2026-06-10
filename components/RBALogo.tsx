import React from 'react';

type RBALogoProps = {
  className?: string;
};

export default function RBALogo({ className = '' }: RBALogoProps) {
  return (
    <div
      role="img"
      aria-label="RBA Transporte & Logística"
      className={`overflow-hidden bg-contain bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: "url('/rba-logo-transparent.png')" }}
    />
  );
}
