import React from "react";
import { useT } from "../i18n";
import { commonMessages } from "../i18n/messages/common";

/** A pulsing placeholder block. Size and shape come from `className`. */
export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = "",
  style,
}) => <div aria-hidden style={style} className={`animate-pulse rounded-md bg-ink-85 dark:bg-ink-805 ${className}`} />;

const card =
  "rounded-xl border border-ink-120 bg-ink-25 dark:border-ink-780 dark:bg-ink-850";

export const SkeletonCard: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className = "",
  children,
}) => <div className={`${card} ${className}`}>{children}</div>;

/** Title + subtitle placeholder matching the app's page headers. */
export const PageHeaderSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-9 w-64 max-w-full" />
    <Skeleton className="h-4 w-80 max-w-full" />
  </div>
);

export const StatTilesSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} className="p-4 sm:p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-5 h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-28" />
      </SkeletonCard>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 4, className = "" }) => (
  <div className={`divide-y divide-ink-70 dark:divide-ink-780 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-3 w-14" />
      </div>
    ))}
  </div>
);

/** Generic page body: header, a row of tiles and two content panels. */
export const PageSkeleton: React.FC<{ tiles?: number }> = ({ tiles = 3 }) => {
  const t = useT(commonMessages);
  return (
  <div className="min-h-screen bg-ink-30 dark:bg-ink-875" aria-busy="true" aria-label={t("loading")}>
    <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      <PageHeaderSkeleton />
      {tiles > 0 && (
        <div className={`grid grid-cols-1 gap-4 ${tiles === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
          {Array.from({ length: tiles }).map((_, i) => (
            <SkeletonCard key={i} className="p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-5 h-8 w-20" />
            </SkeletonCard>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <SkeletonCard key={i}>
            <div className="space-y-2 px-5 pt-5 pb-4 sm:px-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <ListSkeleton rows={4} className="border-t border-ink-70 dark:border-ink-780" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  </div>
  );
};

/** Settings-style skeleton: a narrow column of form sections. */
export const FormPageSkeleton: React.FC = () => {
  const t = useT(commonMessages);
  return (
  <div className="min-h-screen bg-ink-30 dark:bg-ink-875" aria-busy="true" aria-label={t("loading")}>
    <div className="w-full max-w-[1000px] space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-16">
      <Skeleton className="h-10 w-40" />
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i}>
          <div className="border-b border-ink-70 px-6 py-4 dark:border-ink-780">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-4 p-6">
            {i === 0 && (
              <div className="flex items-center gap-5">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-52" />
                </div>
              </div>
            )}
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-2/3 rounded-lg" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  </div>
  );
};
