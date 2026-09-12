# Photos

Drop real photographs here, then set the `src` on the matching `<Photo />`
slot. Until then each slot renders a labelled glass plate at the right aspect
ratio, so the layout is already final.

## Slots the site expects

| File name           | Where            | Aspect | Served at   |
| ------------------- | ---------------- | ------ | ----------- |
| `interior-hero.jpg` | Home hero        | 4:5    | up to 720w  |
| `interior.jpg`      | Home, The space  | 3:4    | up to 400w  |
| `coffee-bar.jpg`    | Home, The space  | 1:1    | up to 340w  |
| `corner-table.jpg`  | Home, The space  | 1:1    | up to 340w  |
| `terrace.jpg`       | Home, The space  | 16:9   | up to 720w  |
| `morning-rush.jpg`  | Home, gallery    | 2:1    | up to 720w  |
| `espresso-pull.jpg` | Home, gallery    | 1:1    | up to 340w  |
| `menu-board.jpg`    | Home, gallery    | 1:1    | up to 340w  |
| `terrace-wide.jpg`  | Home, gallery    | 1:1    | up to 340w  |
| `armchairs.jpg`     | Home, gallery    | 1:1    | up to 340w  |
| `bean-shelf.jpg`    | Home, gallery    | 4:1    | up to 1200w |
| `family.jpg`        | Home, the family | 4:3    | up to 560w  |

## Before you add a file

- **Export at 2x the served width.** A slot served at 340w wants a 680px file.
  Anything larger is bytes the visitor pays for and never sees.
- **Use WebP or AVIF** where you can. Next.js will convert on the fly, but
  starting smaller is still cheaper.
- **Write the `alt` text** when you set the `src`. It describes what is in the
  photo for anyone using a screen reader, so "Barista pulling a shot at the
  wood counter", not "coffee".

## Licensing

Only use photographs the café owns or has written permission to use. Images
pulled from a search engine belong to whoever shot them, and a public site is
exactly where that becomes a problem. The cheapest fix is almost always an
hour with a phone camera on a bright morning.
