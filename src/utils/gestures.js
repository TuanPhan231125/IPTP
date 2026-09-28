export function isPlayerDismissSwipe(start, end, viewportHeight = 0) {
 if (!start || !end || start.y > viewportHeight * 0.55) return false;
 const vertical = end.y - start.y;
 const horizontal = Math.abs(end.x - start.x);
 return vertical >= 110 && vertical > horizontal * 1.5;
}
