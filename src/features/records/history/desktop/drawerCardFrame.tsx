import type { RenderCardFrame } from "../historyCardFrame";

// כרטיס על משטח לבן (המגירה) מקבל מסגרת (design.md). המסגרת על העוטף, כדי שהכרטיס יישאר זהה למובייל
export const renderDrawerCardFrame: RenderCardFrame = (card) => (
  <div className="rounded-card border border-divider">{card}</div>
);
