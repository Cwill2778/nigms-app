import './LoadingSkeleton.css';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="skeleton-line" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton className="skeleton-card-img" />
      <div className="skeleton-card-content">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
