"use client";

type AppContainerProps = {
  children: React.ReactNode;
  /** Add bottom padding so content is not hidden behind bottom nav */
  withBottomNav?: boolean;
  className?: string;
};

export default function AppContainer({
  children,
  withBottomNav = true,
  className = "",
}: AppContainerProps) {
  return (
    <div
      className={`app-container ${withBottomNav ? "app-bottom-nav-pad" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
