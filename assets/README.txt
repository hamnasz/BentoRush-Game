Bento Rush — artwork notes
==========================

Sheets are horizontal strips of equal cells. The game measures each cell from the PNG
itself (image width / number of cells x image height), so any resolution works.

assets/sakura/
  walk_right.png   4 cells, right-facing walk cycle (mirrored in game for left).
                   Derived from source/Pink-Haired_Chibi_Schoolgirl_Walk_Cycle.png:
                   ground line removed, frames framed so her feet touch the cell bottom.
  back.png         1 cell, back view (used while walking up until walk_up.png exists).

  Optional — not supplied yet. Drop a 4-cell PNG with this exact name here and the
  game uses it automatically (feet at the bottom-centre of each cell, same framing
  as walk_right.png):
    carry_walk_right.png   walking right while carrying food
    walk_up.png            walking away from the camera
    walk_down.png          walking toward the camera
  For a carry sheet, set its per-frame hand points in index.html (SAKURA.carryWalkRight.hands);
  until then the snack is held at chest height like hold.png.

assets/customers/
  <name>.png         4 cells in this order: wait, worried, happy, sad.
  <name>_hands.png   same 4 cells, only the fists — drawn on top of the tabletop.
  Guests: boy (mint hoodie), courier (yellow bike cap), grandma (lavender cardigan).
  The grandma sheet had a faint transparent haze around the figures; it was removed.

assets/source/
  The four sheets exactly as supplied (not used by the game directly).
