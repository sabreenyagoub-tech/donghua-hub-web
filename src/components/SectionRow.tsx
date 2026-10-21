import Link from 'next/link';
import type { Donghua } from '@/lib/types';
import DonghuaCard from './DonghuaCard';
import { ChevronLeft } from 'lucide-react';

export default function SectionRow({ title, items, href }: { title: string; items: Donghua[]; href?: string }) {
  if (!items?.length) return null;
  return (
    <section className="mt-10 animate-fadeUp">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          <span className="h-5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
          {title}
        </h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
            عرض الكل <ChevronLeft size={16} />
          </Link>
        )}
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {items.map(d => <DonghuaCard key={d.id} d={d} />)}
      </div>
    </section>
  );
}
