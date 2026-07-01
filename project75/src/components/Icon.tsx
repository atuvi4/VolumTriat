import type { IconName } from '../types';

const PATHS: Record<IconName, React.ReactNode> = {
  home: (<><path d="M4 11.5 12 4.5l8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></>),
  nutri: (<><path d="M6 3v7a2 2 0 0 0 4 0V3" /><path d="M8 10v11" /><path d="M18 3c-1.7 1-3 3-3 6v3h3" /><path d="M18 12v9" /></>),
  train: (<path d="M6.5 8v8M4 9.5v5M17.5 8v8M20 9.5v5M6.5 12h11" />),
  evo: (<><path d="M3 17 9 11l4 4 8-8" /><path d="M17 7h4v4" /></>),
  coach: (<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />),
  settings: (<><path d="M4 7h9M17 7h3" /><circle cx="15" cy="7" r="2" /><path d="M4 12h3M11 12h9" /><circle cx="9" cy="12" r="2" /><path d="M4 17h8M16 17h4" /><circle cx="14" cy="17" r="2" /></>),
  flame: (<path d="M12 2c1 3 4 4.4 4 8a4 4 0 1 1-8 0c0-2 1-3.2 2-4 0 1 .6 2 1.6 2C11 8 11 5 12 2Z" />),
  check: (<path d="m5 12.5 4.5 4.5L19 7.5" />),
  swap: (<><path d="M17 3l4 4-4 4" /><path d="M21 7H9a4 4 0 0 0-4 4" /><path d="M7 21l-4-4 4-4" /><path d="M3 17h12a4 4 0 0 0 4-4" /></>),
  x: (<path d="M6 6l12 12M18 6 6 18" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  cup: (<><path d="M6 3h12l-1.4 15.6A2 2 0 0 1 14.6 20.5H9.4a2 2 0 0 1-2-1.9L6 3Z" /><path d="M6.6 8.5h10.8" /></>),
  alert: (<><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4.5M12 18h.01" /></>),
  moon: (<path d="M20 14A8 8 0 0 1 10 4a7 7 0 1 0 10 10Z" />),
  chev: (<path d="m9 6 6 6-6 6" />),
  target: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>),
  activity: (<path d="M3 12h4l3 8 4-16 3 8h4" />),
  scale: (<><path d="M9 5h6" /><path d="M12 5v3" /><path d="M5.5 8h13l1.2 10a2 2 0 0 1-2 2.2H6.3a2 2 0 0 1-2-2.2L5.5 8Z" /><path d="M9.5 12.5h5" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  image: (<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m5 18 5-5 4 3 3-2 3 3" /></>),
  checkCircle: (<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  store: (<><path d="M4 9 5 4h14l1 5" /><path d="M4 9v10h16V9" /><path d="M4 9a2.5 2.5 0 0 0 4 0 2.5 2.5 0 0 0 4 0 2.5 2.5 0 0 0 4 0 2.5 2.5 0 0 0 4 0" /></>),
  edit: (<><path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3Z" /><path d="M14 7l3 3" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></>),
  database: (<><ellipse cx="12" cy="5.5" rx="7" ry="2.8" /><path d="M5 5.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" /><path d="M5 11.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" /></>),
};

interface Props {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export default function Icon({ name, className = '', size = 20, strokeWidth = 1.7 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
