export default function MotionBackground() {
  return (
    <div className="motion-bg" aria-hidden="true">
      <div className="motion-bg__glow motion-bg__glow--gold" />
      <div className="motion-bg__glow motion-bg__glow--warm" />
      <div className="motion-bg__glow motion-bg__glow--deep" />
      <div className="motion-bg__dots" />
    </div>
  );
}
