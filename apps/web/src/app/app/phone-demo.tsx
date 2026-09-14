import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  EllipsisVertical,
  Glasses,
  Plus,
  Search,
  Share,
  Star,
} from 'lucide-react';

export type DemoScene =
  | 'ios-share-bottom'
  | 'ios-share-top'
  | 'ios-sheet'
  | 'ios-add'
  | 'android-dots'
  | 'android-menu'
  | 'android-install'
  | 'home';

/** The pulsing ring that shows where the finger goes. `late` waits for the scene to settle. */
function Tap({ left, top, late = false }: { left: string; top: string; late?: boolean }) {
  return <span className={`demo-tap ${late ? 'demo-tap-late' : ''}`} style={{ left, top }} />;
}

/** A page behind the browser chrome: enough to read as "a website", nothing to read. */
function FakePage() {
  return (
    <div className="absolute inset-x-0 top-0 flex flex-col gap-2 p-3 pt-6">
      <div className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
        <img src="/icons/icon-192.png" alt="" className="h-4 w-4 rounded-[4px]" />
        <span className="h-2 w-16 rounded-full bg-stone2-900/80" />
      </div>
      <span className="mt-2 h-4 w-3/4 rounded bg-stone2-900" />
      <span className="h-2 w-full rounded-full bg-stone2-900/15" />
      <span className="h-2 w-5/6 rounded-full bg-stone2-900/15" />
      <span className="mt-1 aspect-[4/3] w-full rounded-[6px] bg-neon-500/40" />
      <span className="h-2 w-2/3 rounded-full bg-stone2-900/15" />
    </div>
  );
}

function SheetRow({
  icon: Icon,
  label,
  hot = false,
}: {
  icon: typeof Copy;
  label: string;
  hot?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[10.5px] font-semibold text-stone2-900 ${
        hot ? 'demo-hot bg-neon-500' : 'bg-stone2-900/[0.05]'
      }`}
    >
      {label}
      <Icon size={12} strokeWidth={2.2} />
    </div>
  );
}

function IosToolbar({ hot }: { hot: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-stone2-900/15 bg-white/95 px-3 pb-3 pt-2">
      <div className="mb-2 h-5 rounded-full bg-stone2-900/[0.07] text-center text-[8px] leading-5 text-stone2-600">
        aroundthebean.ca
      </div>
      <div className="flex items-center justify-between px-1 text-stone2-900">
        <ChevronLeft size={14} />
        <ChevronRight size={14} className="opacity-30" />
        <span className={`rounded-[6px] p-1 ${hot ? 'demo-hot bg-neon-500' : ''}`}>
          <Share size={14} strokeWidth={2.4} />
        </span>
        <BookOpen size={14} />
        <Copy size={14} />
      </div>
    </div>
  );
}

/** Home screen: a grid of apps, ours arriving last. */
function HomeScreen() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#E7EFC6,#A9C23F)] p-4 pt-8">
      <div className="grid grid-cols-4 gap-x-2.5 gap-y-3">
        {Array.from({ length: 11 }, (_, k) => (
          <span key={k} className="flex flex-col items-center gap-1">
            <span className="aspect-square w-full rounded-[10px] bg-white/60" />
            <span className="h-1 w-3/4 rounded-full bg-white/60" />
          </span>
        ))}
        <span className="demo-pop flex flex-col items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="aspect-square w-full rounded-[10px] border border-stone2-900"
          />
          <span className="text-[7px] font-bold leading-none text-stone2-900">Around Bean</span>
        </span>
      </div>
    </div>
  );
}

/**
 * A drawn phone acting out one step, on a loop.
 *
 * People copy a gesture they can see far better than one they read about.
 * Plain HTML and CSS keyframes, no video to download; with reduced motion the
 * scene holds its final frame, which still shows where to tap.
 */
export function PhoneDemo({ scene }: { scene: DemoScene }) {
  return (
    <div
      aria-hidden="true"
      className="phone-demo relative mx-auto aspect-[9/16] w-[200px] max-w-full overflow-hidden rounded-[30px] border-[3px] border-stone2-900 bg-white shadow-[4px_4px_0_#0A0A0A]"
    >
      {scene === 'home' ? <HomeScreen /> : <FakePage />}

      {scene === 'ios-share-bottom' && (
        <>
          <IosToolbar hot />
          <Tap left="50%" top="92%" />
        </>
      )}

      {scene === 'ios-share-top' && (
        <>
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-stone2-900/15 bg-white px-2.5 pb-2 pt-4">
            <span className="h-5 flex-1 rounded-full bg-stone2-900/[0.07]" />
            <span className="demo-hot rounded-[6px] bg-neon-500 p-1">
              <Share size={13} strokeWidth={2.4} />
            </span>
          </div>
          <Tap left="87%" top="7%" />
        </>
      )}

      {scene === 'ios-sheet' && (
        <>
          <div className="demo-sheet absolute inset-x-0 bottom-0 h-[80%] overflow-hidden rounded-t-[18px] border-t-2 border-stone2-900 bg-white px-2.5 pt-3">
            <div className="demo-scroll flex flex-col gap-1.5">
              <div className="mb-1 flex justify-between px-1">
                {[0, 1, 2, 3].map((k) => (
                  <span key={k} className="h-7 w-7 rounded-full bg-stone2-900/10" />
                ))}
              </div>
              <SheetRow icon={Copy} label="Copy" />
              <SheetRow icon={Glasses} label="Add to Reading List" />
              <SheetRow icon={BookOpen} label="Add Bookmark" />
              <SheetRow icon={Star} label="Add to Favourites" />
              <SheetRow icon={Search} label="Find on Page" />
              <SheetRow icon={Plus} label="Add to Home Screen" hot />
              <SheetRow icon={BookOpen} label="Markup" />
            </div>
          </div>
          <Tap left="50%" top="66%" late />
        </>
      )}

      {scene === 'ios-add' && (
        <div className="absolute inset-0 bg-[#F2F2F0] px-3 pt-5">
          <div className="flex items-center justify-between text-[9.5px] font-semibold">
            <span className="text-stone2-600">Cancel</span>
            <span className="text-stone2-900">Add to Home Screen</span>
            <span className="demo-hot rounded-[5px] bg-neon-500 px-1.5 py-0.5 text-stone2-900">
              Add
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2.5 rounded-[10px] bg-white p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
            <img
              src="/icons/icon-192.png"
              alt=""
              className="h-10 w-10 rounded-[9px] border border-stone2-900"
            />
            <div className="min-w-0 flex-1">
              <p className="border-b border-stone2-900/15 pb-1 text-[10.5px] font-semibold text-stone2-900">
                Around Bean
              </p>
              <p className="pt-1 text-[8px] text-stone2-400">aroundthebean.ca</p>
            </div>
          </div>
          <Tap left="86%" top="6.5%" />
        </div>
      )}

      {scene === 'android-dots' && (
        <>
          <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 border-b border-stone2-900/15 bg-white px-2.5 pb-2 pt-4">
            <span className="h-5 flex-1 rounded-full bg-stone2-900/[0.07]" />
            <span className="demo-hot rounded-[6px] bg-neon-500 p-0.5">
              <EllipsisVertical size={14} strokeWidth={2.6} />
            </span>
          </div>
          <Tap left="90%" top="7%" />
        </>
      )}

      {scene === 'android-menu' && (
        <>
          <div className="demo-drop absolute right-2 top-3 flex w-[70%] flex-col gap-1 rounded-[10px] border-2 border-stone2-900 bg-white p-1.5 shadow-[3px_3px_0_#0A0A0A]">
            <SheetRow icon={Plus} label="New tab" />
            <SheetRow icon={Star} label="Bookmarks" />
            <SheetRow icon={Copy} label="Share" />
            <SheetRow icon={Plus} label="Install app" hot />
          </div>
          <Tap left="62%" top="34%" late />
        </>
      )}

      {scene === 'android-install' && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone2-900/40 p-3">
          <div className="demo-drop w-full rounded-[14px] border-2 border-stone2-900 bg-white p-3">
            <p className="text-[11px] font-bold text-stone2-900">Install app</p>
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- static app icon */}
              <img
                src="/icons/icon-192.png"
                alt=""
                className="h-8 w-8 rounded-[8px] border border-stone2-900"
              />
              <span className="text-[10px] font-semibold text-stone2-900">Around Bean</span>
            </div>
            <div className="mt-3 flex justify-end gap-2 text-[10px] font-semibold">
              <span className="px-1.5 py-1 text-stone2-600">Cancel</span>
              <span className="demo-hot rounded-[5px] bg-neon-500 px-2 py-1 text-stone2-900">
                Install
              </span>
            </div>
          </div>
          <Tap left="82%" top="60%" late />
        </div>
      )}

      {scene === 'home' && <Tap left="87%" top="44%" late />}
    </div>
  );
}
