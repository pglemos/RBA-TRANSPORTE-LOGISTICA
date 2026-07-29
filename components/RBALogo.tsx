import Image from 'next/image';

type RBALogoProps = {
  className?: string;
};

export default function RBALogo({ className = '' }: RBALogoProps) {
  return (
    <Image
      src="/rba-logo-transparent.png"
      alt="RBA Transporte & Logística"
      width={1200}
      height={205}
      unoptimized
      className={`block object-contain ${className}`}
    />
  );
}