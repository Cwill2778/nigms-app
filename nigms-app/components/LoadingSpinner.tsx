interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full ${sizeMap[size]}`}
      style={{
        borderColor: "var(--color-steel-mid)",
        borderTopColor: "var(--color-accent-orange)",
      }}
    />
  );
}
