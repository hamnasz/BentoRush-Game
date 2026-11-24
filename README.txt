Sakura's Sweet Shop
===================

Double-click index.html to play (Chrome, Edge or Firefox). Your shop saves itself
in the browser every few seconds and whenever you close the tab. Pause > "Start a new
bakery" erases it.

Controls: WASD / arrow keys walk · E or Space use · hold E beside a price tag to buy
or hire · P pause · M sound.

There is no timer, no patience bar and no game over. Guests wait happily for as long
as you like, and finished batches wait in their machines until someone collects them.


Prices
------
Cupcake 5 · Cotton candy 8 · Croissant 12 · Cake slice 15
Cotton-candy spinner 25 · Pastry roller 60 · Cake-decorating station 120
Helpers: the 1st costs 25, the 2nd 50, the 3rd 90 (pick any role first).


Replacing the drawn art with your own PNGs
------------------------------------------
Everything without a PNG is drawn in code. Drop a transparent PNG with one of these
exact names into the assets folder and the game uses it on the next reload; delete it
to go back. Missing files only show as "file not found" lines in the browser console,
which are harmless.

Sizes are the box the art is fitted into, in game pixels. Making PNGs about 3x larger
keeps them sharp. Anything standing on the floor should have its feet / base at the
bottom-centre of the image.

Sakura (4-cell sheets = four equal frames side by side, like walk_right.png)
  assets/sakura/walk_up.png            walking away from the camera (back view)
  assets/sakura/walk_down.png          walking toward the camera (front view)
  assets/sakura/carry_walk_right.png   walking right while holding a tray in both hands

Helpers (drawn 146 px tall)
  assets/staff/assistant_idle.png      Momo, the display assistant, standing
  assets/staff/assistant_walk_right.png   4 cells, facing right
  assets/staff/baker_idle.png          Kuri, the baker (chef hat)
  assets/staff/baker_walk_right.png    4 cells
  assets/staff/server_idle.png         Lulu, the server
  assets/staff/server_walk_right.png   4 cells

Machines (a progress ring and "Ready!" badge are still drawn on top)
  assets/machines/oven.png                  150 x 160   rose-pink countertop oven on a cream cabinet
  assets/machines/cotton_candy_spinner.png  150 x 170   striped cart with a glass dome
  assets/machines/pastry_roller.png         100 x 100   cream-and-gold roller (sits on the counter)
  assets/machines/cake_station.png          160 x 150   lavender table with a turntable

Desserts (square, used in hands, on shelves and in order bubbles)
  assets/desserts/cupcake.png   cotton_candy.png   croissant.png   cake_slice.png
  assets/desserts/whole_cake.png   sponge.png   croissant_dough.png   batter_bowl.png

Note: a machine PNG replaces the drawn machine completely, so the batch you see
through the oven window or inside the candy dome comes from the drawn version only.

Guests
  assets/customers/<name>.png         4 cells: waiting, worried, happy, sad
  assets/customers/<name>_hands.png   the same 4 cells with only the fists
  The hands layer lets the fists rest on the tabletop. New guests need that layer
  plus one line in js/people.js (the GUESTS list).

assets/source/ holds the original sheets the game art was cut from.


Files
-----
index.html     page, menus and HUD
js/engine.js   canvas, sounds, particles
js/art.js      all drawn artwork and the PNG replacement slots
js/shop.js     recipes, prices, machines, shared actions, pathfinding, saving
js/people.js   guests, Sakura, and the helpers' work routines
js/main.js     prompts, tutorial, HUD and the game loop
