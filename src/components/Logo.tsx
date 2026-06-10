export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-contato.png"
      alt="Contato"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
    />
  );
}
