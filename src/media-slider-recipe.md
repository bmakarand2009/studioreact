## Media Slider Sidebar Recipe

### Context & Goal
- Mirror the Angular `MediaSliderComponent` behaviour inside the React + Tailwind admin app (`studioreact`).
- Provide a reusable sidebar experience that communicates with the shell layout so the main content shrinks and the navigation menu folds while the slider is open.
- Reuse the existing `/edmedia` media endpoints, Cloudinary helpers, and business rules surfaced by `UploadService`.

### Core Requirements
- **APIs & Services**
  - `GET /edmedia/pmedia` → fetch media assets. Map each `{ _id, imgUrl }` to `{ id, displayUrl, originalUrl }` using `AppUtilsService.buildCloudinaryImageUrl(AppLoadService._cloudName, imgUrl, 0, 0, false)`.
  - `DELETE /edmedia/asset/{id}` → remove an asset after confirmation.
  - `POST /edmedia/pmedia/image` → register the Cloudinary upload when `moduleName = 'tasset'`.
  - Wrap these calls in `useMediaSliderService()` to centralise API access, upload state, and toast handling.
- **Shared Sidebar Controller**
  - Create `src/services/sidebarControllerService.ts` exporting `sidebarController` and `useSidebarController()`.
  - Track named sidebars (`mediaSlider`, `filters`, etc.) with `open(name)`, `close(name)`, `toggle(name)`, and `subscribe(name, listener)`.
  - Broadcast layout events (`window.dispatchEvent(new CustomEvent('sidebar:layout-change', { detail: { name, open } }))`) so the shell can respond uniformly.

```typescript
export type SidebarPayload = { name: string; open: boolean };

class SidebarController {
  private listeners = new Map<string, Set<(payload: SidebarPayload) => void>>();
  private states = new Map<string, boolean>();

  open(name: string) {
    this.setState(name, true);
  }
  close(name: string) {
    this.setState(name, false);
  }
  toggle(name: string) {
    const next = !this.states.get(name);
    this.setState(name, next);
  }
  subscribe(name: string, fn: (payload: SidebarPayload) => void) {
    const set = this.listeners.get(name) ?? new Set();
    set.add(fn);
    this.listeners.set(name, set);
    fn({ name, open: this.states.get(name) ?? false });
    return () => set.delete(fn);
  }
  private setState(name: string, open: boolean) {
    this.states.set(name, open);
    this.listeners.get(name)?.forEach(fn => fn({ name, open }));
    this.broadcastLayout(name, open);
  }
  private broadcastLayout(name: string, open: boolean) {
    window.dispatchEvent(new CustomEvent('sidebar:layout-change', { detail: { name, open } }));
  }
}

export const sidebarController = new SidebarController();
export const useSidebarController = () => sidebarController;
```

- In `AppShell`, listen to `sidebar:layout-change` and apply Tailwind class toggles:
  - When `{ name: 'mediaSlider', open: true }`: add `lg:pl-[420px]` (or custom CSS variable) to main content, set navigation to folded (`data-sidebar-mode="folded"`).
  - When closed: revert to default layout spacing and restore previous pin state.

### Component Blueprint

#### `MediaSliderLauncher`
- Button used across forms (e.g., course editor) that calls `sidebarController.open('mediaSlider')`.
- Disable when `isUploading` is true (subscribe to `useMediaSliderService`).

#### `MediaSliderPanel`
- Mounted under `AppShell` so it can overlay content.
- Conditionals based on controller subscription; fetch assets on open.
- Tailwind structure:
  - Wrapper: `fixed inset-y-0 right-0 z-40 w-full max-w-[420px] bg-white shadow-xl border-l border-slate-200 flex flex-col overflow-y-auto transition-transform dark:bg-slate-900 dark:border-slate-700`.
  - Backdrop: `fixed inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden` (allow click to close on mobile).
  - Close button: `absolute top-4 right-4 h-10 w-10 grid place-content-center rounded-full hover:bg-slate-100`.
- Render upload card (`moduleName="tasset"`) + gallery grid replicating Angular row grouping logic (2–4 columns per row). Use `style={{ gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))` }}` with Tailwind gap utilities.
- On select, emit `onSelect(originalUrl)` to parent, close via controller.

#### Grouping Logic
- Port Angular’s `groupImagesIntoRows()`:
  - Single image → one-column row.
  - Otherwise iterate with `rowConfig = [2,3,4]`, splicing from remaining list to create rows, appending lone leftovers to previous row.
  - Store as `GroupedMedia[]` for rendering.

### Hook & Toast Integration

```typescript
export const useMediaSliderService = () => {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = async (): Promise<MediaAsset[]> => {
    const { data } = await api.get('/edmedia/pmedia');
    return (data?.data || []).map(mapToDto);
  };

  const deleteAsset = async (asset: MediaAsset) => {
    await api.delete(`/edmedia/asset/${asset.id}`);
    toast.success('Successfully deleted asset');
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadService.uploadImage(file, 'tasset');
      toast.success('Image uploaded');
      return response;
    } finally {
      setIsUploading(false);
    }
  };

  return { fetchAssets, deleteAsset, uploadImage, isUploading };
};
```

- `mapToDto` should call a helper that reads the tenant’s Cloudinary info (mirror Angular `AppLoadService` behaviour) to produce URLs like `https://res.cloudinary.com/{cloudName}/image/upload/{imgUrl}`.

### Layout & Navigation Coordination
- `AppShell` listens for the layout-change event:
  - When `mediaSlider` opens: store current nav pinning state, apply Tailwind class toggles (`lg:ml-0`, `xl:pr-[420px]`), set nav to folded.
  - When closing: restore stored nav state and remove spacing overrides.
- On mobile, add `overflow-hidden` to `<body>` while the slider is open to prevent background scroll.

### UX & Accessibility
- Focus trap inside the slider (`reach/portal` or custom hook), close on `Esc` via controller.
- Add skeleton loaders (`animate-pulse` cards) while assets load.
- Confirm deletion via shared modal before calling API; show backend errors via toast.
- Ensure uploads show progress; optional integration with existing global progress/snackbar system.

### Testing Checklist
1. **Layout reactions**: opening slider shrinks main content and folds nav; closing restores layout.
2. **API calls**: assets load on open, uploads refresh list, deletes remove item and show toast.
3. **Selection flow**: picking an image updates parent form and closes slider.
4. **Mobile UX**: slider overlays full screen, backdrop taps close, body scroll locked.
5. **Accessibility**: focus moves into panel on open, `Esc` closes, tab order contained.
6. **Service reuse**: register a second sidebar name to ensure controller scales (e.g., `filters`).

### Next Steps
- Implement optimistic UI for uploads (insert placeholder card until backend confirms).
- Extend `SidebarController` with breakpoint-aware widths or transitions per sidebar.
- Explore memoizing grouped rows to avoid reshuffling on every render.
- Replace random row sizing with deterministic layout if design requires consistency.
