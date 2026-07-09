import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from './Icon';
import type { IconName } from '../types';

type Variant = 'primary' | 'ghost' | 'line' | 'toggle' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
  block?: boolean;
  active?: boolean;
  size?: 'md' | 'sm';
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-[background-color,border-color,transform] duration-150 select-none active:scale-[.98] disabled:opacity-55 disabled:cursor-default disabled:active:scale-100';

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-[#10916F] to-accent-strong text-white border border-accent-strong shadow-[0_4px_12px_rgba(14,122,95,.22)] hover:from-accent-strong hover:to-accent-strong',
  ghost: 'bg-surface2 text-ink border border-line2 hover:border-faint',
  line: 'bg-white/10 text-white border border-white/25 hover:bg-white/20',
  toggle: 'bg-info text-white border border-info',
  danger: 'bg-surface2 text-danger border border-line2 hover:border-danger-line hover:bg-danger-soft',
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
  const pad = size === 'sm' ? 'min-h-[38px] px-3.5 py-2 text-[13px]' : 'min-h-[46px] px-4 py-3 text-[14.5px]';
  return (
    <button className={`${base} ${v} ${pad} ${block ? 'flex-1 min-w-[130px]' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 17} />}
      {children}
    </button>
  );
}
