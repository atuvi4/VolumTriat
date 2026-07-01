import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from './Icon';
import type { IconName } from '../types';

type Variant = 'primary' | 'ghost' | 'line' | 'toggle';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
  block?: boolean;
  active?: boolean;
  size?: 'md' | 'sm';
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors select-none disabled:opacity-55 disabled:cursor-default';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white border border-accent shadow-[0_4px_12px_rgba(14,122,95,.22)] hover:bg-accent-strong hover:border-accent-strong',
  ghost: 'bg-surface2 text-ink border border-line2 hover:border-faint',
  line: 'bg-white/10 text-white border border-white/25 hover:bg-white/20',
  toggle: 'bg-info text-white border border-info',
};

export default function Button({
  variant = 'ghost',
  icon,
  block,
  active,
  size = 'md',
  className = '',
  children,
  ...rest
}: Props) {
  const v = active ? variants.toggle : variants[variant];
  const pad = size === 'sm' ? 'px-3.5 py-2 text-[13px]' : 'px-4 py-3 text-[14.5px]';
  return (
    <button className={`${base} ${v} ${pad} ${block ? 'flex-1 min-w-[130px]' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 17} />}
      {children}
    </button>
  );
}
