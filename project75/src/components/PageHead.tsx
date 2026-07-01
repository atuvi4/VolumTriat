import type { ReactNode } from 'react';

export default function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 pt-[18px] pb-1.5">
      <div>
        <h1 className="text-[26px] font-extrabold m-0">{title}</h1>
        {sub && <p className="text-muted text-[13.5px] font-medium mt-0.5 m-0">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
