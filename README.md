# Neon Foosball

By Justin Parkinson and Joshua Parkinson.

**Play it:** https://a44kaliburll.github.io/neon-foosball/

Open index.html in a modern browser. Internet access is needed for Three.js and the optional fonts.

For a local preview, run `python -m http.server 8765 --bind 127.0.0.1` in this folder, then visit http://127.0.0.1:8765.

## How to play

- Move the mouse over the table, drag on the table, or hold Left/Right (A/D) to slide.
- Hold Space or the Strike button to charge. Release just before contact for a stronger shot. The timing window is about a third of a second.
- Slow balls engage magnetic foot control. The ball follows with attraction and momentum rather than locking to a fixed position. Friendly catches switch to that rod. Fast shots still rebound unless deliberately trapped.
- Aim through contact: the ball keeps its left/right position on the foot when trapped. Sliding rolls it across the face. Left-edge contact cuts left, right-edge contact cuts right, and rod movement at release adds slice. A lime arrow previews the shot direction; charge changes power, not aim. Pass uses the same direction as the aim arrow, at a softer speed.
- Magnetic control attracts the ball around the whole foot. Dragging moves the attraction point around a full circle; the ball follows with spring lag and momentum. Keep dragging to bring it behind the foot. Passes and shots use the actual ball-to-foot direction, including backward and sideways.
- Press F or Pass for a soft pass along your aim arrow, combining foot contact and rod movement. Passes can be intercepted; receiving teammates trap on contact. Press Shift or Trap just before a fast ball reaches your active rod for a deliberate catch. The trap window lasts 0.4 seconds.
- Press 1, 2, or 3 to select goalie, defense, or attack. The Switch Rod button cycles positions.
- Build energy through touches, timed shots, and goals. At 100%, press E or Neon Blast, then make contact within 1.4 seconds.
- Press Escape/P to pause. Switching away automatically pauses the match.
- First to five wins. Wins and best timed-shot count are saved in this browser.

## Project

The supplied 3D table and effects are preserved in index.html, with arcade mechanics and styling in arcade.js and arcade.css. ui.html is the lobby/HUD template. build.py regenerates index.html from original.html and ui.html; editing the generated engine directly requires also updating the builder to retain those edits. Run `node test-game.cjs` for the gameplay regression checks.

Difficulty and shot timing are tuning starting points. Player testing is still needed to judge long-term balance and replay appeal.

