export function PortalSidebarBackdrop({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <button
      type="button"
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden cursor-default"
      onClick={onClose}
      aria-label="Close navigation"
    />
  );
}
