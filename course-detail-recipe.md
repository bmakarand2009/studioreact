## Context

- Source logic: `BundleAddEditComponent` in the Angular admin app orchestrates both course/bundle creation and editing, including AI-assisted template generation, tag/category management, and payload submission.
- Target outcome: a React + Tailwind «Add/Edit Course» screen (`AddEditCoursePage`) that reuses the same backend contracts and validation/business rules while omitting the embedded GrapesJS editor (stub the editor hooks for later integration).

## Objective

Build a production-ready Add/Edit Course experience that:

- Loads existing course data when an `id` is present and initializes a two-step wizard (Basic Info → Sales Page Template).
- Mirrors the Angular form controls, validators, and derived state (tags, categories, author toggles, AI integrations).
- Saves data through the same `/snode/icategory` endpoints (create/update) and `/stemplate/page` template APIs.
- Provides Tailwind-based input layouts similar to the provided mockups (rounded inputs with inline icons, spacious grouping, responsive columns).
- Leaves GrapesJS/AI designer integration as callable stubs populated with placeholder data, so future work can plug in the real editor.
- Routes all user feedback through a shared toast system (no inline banners) so success/error/info messaging stays consistent across admin pages.

## Routing

- `AddEditCoursePage` is mounted for:
  - `/admin/courses/add` → create new course (no `id` param).
  - `/admin/courses/edit/:id` → edit existing course.
- After a successful create, update the URL to `/admin/courses/edit/{guId}` via `navigate(..., { replace: true })` so refreshes land on the edit path.
- Course list (`/admin/courses`) uses the new routes (`navigate('/admin/courses/add')` for the Add Course button and `/admin/courses/edit/${id}` for card clicks).

## Global Toast Notifications

- Wrap the application with `ToastProvider` (`src/components/ui/ToastProvider.tsx`) via the shared `Providers` component (`src/components/providers/Providers.tsx`).  
- Consume the `useToast()` hook inside `AddEditCoursePage` (and any other screen) to display notifications through `toast.success`, `toast.error`, `toast.info`, or `toast.warning`.  
- Toasts appear top-right, auto-dismiss after ~4 s, and can be manually dismissed. Avoid inline status banners—use the hook for all API, AI, and form feedback.

## Core Backend Contracts

- **Course CRUD**
  - `GET /snode/icategory/{guId}?include=details,template` – fetch existing course data and template payloads.
  - `POST /snode/icategory` – create a new course.
  - `PUT /snode/icategory/{guId}` – update an existing course.
  - `POST /snode/pbundle` / `PUT /snode/pbundle/{guId}` mirror bundle paths; keep them available if the React screen needs to support bundle types later.

- **Template persistence**
  - `POST /stemplate/page` – attach a new template payload.
  - `PUT /stemplate/page/{guId}` – update an existing template payload.

- **Reference data**
  - `GET /snode/contact?start=0&max=50&ctype=staff&search=` – hydrate the teacher/staff dropdown.
  - `GET /rest/productCategory?tid={tenantId}` – load available product categories.
  - `POST /rest/productCategory?tid={tenantId}` – create a new category from the flyout.

```101:287:v5byclasses/myapp/src/app/main/admin/products/services/product.service.ts
  public createProductBundle(payload: any) {
    return this._httpClient.post(`${environment.apiBaseUrl}/snode/pbundle`, payload);
  }
  public updateProductBundle(payload: any) {
    return this._httpClient.put(`${environment.apiBaseUrl}/snode/pbundle/${payload.guId}`, payload);
  }
  public getProductBundleDetails(guId) {
    return this._httpClient.get(`${environment.apiBaseUrl}/snode/pbundle/${guId}`);
  }
  public getCourseDetails(guId) {
    return this._httpClient.get(`${environment.apiBaseUrl}/snode/icategory/${guId}?include=details,template`);
  }
  addProduct(form: any) {
    return this._httpClient.post(`${environment.apiBaseUrl}/snode/icategory`, form);
  }
  updateProduct(form: any, guId: any) {
    return this._httpClient.put(`${environment.apiBaseUrl}/snode/icategory/${guId}`, form);
  }
  addUntemplateToProduct(form: any) {
    return this._httpClient.post(`${environment.apiBaseUrl}/stemplate/page`, form);
  }
  updateUntemplateToProduct(form: any, guId: any) {
    return this._httpClient.put(`${environment.apiBaseUrl}/stemplate/page/${guId}`, form);
  }
  getProductCategories(tenantId) {
    return this._httpClient.get(`${environment.apiBaseUrl}/rest/productCategory?tid=${tenantId}`);
  }
```

- **Tenant/config helpers**
  - Use `AppLoadService` to get `tenantConfig` (cloudName, org name, tenantId) for building Cloudinary URLs and author defaults.
  - `AppUtilsService.buildCloudinaryImageUrl` helps transform a Cloudinary public ID into a usable URL.

## Data Flow Overview

1. **Initialization**
   - Show a blocking spinner while reading query params, detecting `productGuId`, fetching course/bundle details, template data, staff list, and categories.
   - Once data is ready, call `bindForm` to hydrate the reactive form and sync auxiliary arrays (`productTags`, `productCategories`).
   - Prefill AI sidebar context with `shortDescription` and course metadata so the assistant suggestions match the basic info step.
   - On errors (API load, missing tenant configuration) surface feedback with `toast.error(...)` instead of rendering inline banners.

```127:240:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  ngOnInit(): void {
    this.isLoading = true;
    this._spinner.show();
    this.isEditMode = !!this.productGuId;
    of(this.productGuId)
      .pipe(
        switchMap(productGuId => {
          if (productGuId) {
            return this.productType == 'bundle'
              ? this._productsService.getProductBundleDetails(productGuId)
              : this._productsService.getCourseDetails(productGuId);
          }
          return of(null);
        }),
      )
      .subscribe({
        next: result => {
          if (result) {
            this.productBundleDetails = this.productType == 'bundle' ? result : result.data;
            this._productType = AppConstants.CATEGORY_PRODUCT_TYPE_MAP.get(result.categoryType);
            this.getQrImage(result?.url);
            this.getProductTemplate();
            this.getSprefValues();
          }
        },
        complete: () => {
          this.productTypeCheck();
          this.getStaff();
          this.getExistingCategories();
          this.bindForm();
          this._spinner.hide();
          this.isLoading = false;
        },
      });
    this.setupAIResultSubscription();
    this.setupAICloseSubscription();
    this._aiSidebarService.set('shortDescription', ['course']);
    this.loadLLMTenantData();
  }
```

2. **Form binding**
   - Reactive form fields include `name`, `authorType`, `authorId`, `shortDescription`, `longDescription`, `productTagList`, `durationStr`, and `productCategoryId`. Required validators apply to `name`, `shortDescription`, and conditionally to `authorId` when the author type is `teacher`.
   - Local arrays keep chips/selections in sync and push updates back to the form group.

```181:240:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  private bindForm() {
    this.basicInfoForm = this._formBuilder.group({
      name: [this.productBundleDetails?.name, Validators.required],
      authorType: [this.productBundleDetails?.wemail?.authorType || 'organization', Validators.required],
      authorId: [this.productBundleDetails?.wemail?.authorId || null],
      shortDescription: [this.productBundleDetails?.shortDescription || '', Validators.required],
      longDescription: [this.productBundleDetails?.wemail?.longDescription || ''],
      productTagList: [this.productBundleDetails?.wemail?.productTagList || []],
      durationStr: [this.productBundleDetails?.wemail?.durationStr || '30'],
      productCategoryId: [this.productBundleDetails?.productCategoryList || this.productBundleDetails?.productCategory || []],
    });
    this.productTags = Array.isArray(this.productBundleDetails?.wemail?.productTagList)
      ? [...this.productBundleDetails?.wemail?.productTagList]
      : [];
    this.basicInfoForm.get('productTagList').setValue(this.productTags);
    const existingCategories = this.productBundleDetails?.productCategoryList || this.productBundleDetails?.productCategory || [];
    if (Array.isArray(existingCategories)) {
      this.productCategories = existingCategories.map(category =>
        typeof category === 'object' ? category.id || category.guId : category,
      );
    } else {
      this.productCategories = [];
    }
    this.basicInfoForm.get('productCategoryId').setValue(this.productCategories);
    this.basicInfoForm.controls.authorType.valueChanges.subscribe(result => {
      const authorId = this.basicInfoForm.controls.authorId;
      result == 'teacher' ? authorId.setValidators(Validators.required) : authorId.clearValidators();
      authorId.updateValueAndValidity();
    });
    this.setupFormChangeSubscriptions();
    this.setBannerImage(this.productBundleDetails?.image1);
  }
```

3. **Submit cycle**
   - Assemble a payload via `generatePayload`, map `authorId` to `teacherId` when applicable, and call `createProduct` or `updateProduct` based on `guId` presence.
   - On success call `toast.success('Course details saved successfully.')`; on errors call `toast.error(...)`.
   - On fresh courses, optionally trigger `sendFlyerPrompt` after template save (stub this for now).

```337:842:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  private generatePayload(): BundleType | CourseType {
    const { productCategoryId, ...formValue } = this.basicInfoForm.value || {};
    return {
      ...payload,
      ...formValue,
      productCategory: productCategoryId,
    };
  }
  public submit() {
    const payload: BundleType | CourseType = this.generatePayload();
    if (payload.authorType == 'organization') {
      payload.teacherId = null;
    } else {
      payload.teacherId = payload.authorId;
    }
    if (this.productBundleDetails?.guId) {
      payload.guId = this.productBundleDetails?.guId;
      this.updateProduct(payload);
    } else {
      this.createProduct(payload);
    }
  }
```

4. **Content enrichment**
   - `buildCourseDataPayload` composes the metadata needed by AI features and template generators (course name, descriptions, author info, duration, image, price).
   - `generateLongDescription` triggers an AI call when a short description exists but the long description is empty; on success it populates the form and continues submission.

```247:288:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  private buildCourseDataPayload(): ProductDetails {
    const courseName = this.basicInfoForm.get('name')?.value || 'Course Name';
    const shortDescription = this.basicInfoForm.get('shortDescription')?.value || 'No description provided';
    const longDescription = this.basicInfoForm.get('longDescription')?.value || '';
    const authorType = this.basicInfoForm.get('authorType')?.value;
    const authorName = authorType === 'teacher'
      ? this.staffList?.find(s => s.guId === this.basicInfoForm.get('authorId')?.value)?.name
      : this.tenantConfig?.name || 'Organization';
    const duration = this.basicInfoForm.get('durationStr')?.value;
    const durationText = duration ? `${duration} sec` : '30 sec';
    const imagePublicId = this.basicInfoForm.get('image1')?.value || '';
    const courseImage = this.buildImage(imagePublicId);
    const price = this.basicInfoForm.get('price')?.value;
    const coursePrice = price ? `$${price}` : 'Free';
    const registrationLink = this.buildRegistrationLink(this.productBundleDetails?.url);
    return {
      type: 'course',
      courseName,
      longDescription,
      authorName: authorName || 'Course Instructor',
      durationText,
      coursePrice,
      authorType: authorType === 'teacher' ? 'teacher' : 'organization',
      registrationLink,
      courseImage,
      eventDescription: shortDescription,
    };
  }
```

```965:1037:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  private generateLongDescription(): void {
    this.spinnerMessage = 'Generating long description...';
    this._spinner.show();
    const courseName = this.basicInfoForm.get('name')?.value || 'Course';
    const shortDescription = this.basicInfoForm.get('shortDescription')?.value || '';
    if (!shortDescription || shortDescription.trim().length === 0) {
      this._toastr.error('Description is required to generate a long description.');
      this._spinner.hide();
      return;
    }
    const authorType = this.basicInfoForm.get('authorType')?.value;
    const authorName = authorType === 'teacher'
      ? this.staffList?.find(s => s.guId === this.basicInfoForm.get('authorId')?.value)?.name
      : this.tenantConfig?.name || 'Organization';
    const duration = this.basicInfoForm.get('durationStr')?.value || '30';
    const durationText = this.getDurationText(duration);
    const descriptionPrompt = `Based on the following short description...`;
    this._aiTemplateService.sendAiPrompt(descriptionPrompt, ['course']).subscribe({
      next: (result: any) => {
        if (result?.result) {
          let generatedDescription = result.result.trim();
          generatedDescription = generatedDescription.replace(/^"|"$/g, '');
          generatedDescription = generatedDescription.replace(/^```.*\n?|\n?```$/g, '');
          this._aiSidebarService.pushChatMessage({ role: 'ai', text: generatedDescription });
          this.basicInfoForm.get('longDescription').setValue(generatedDescription);
          this._toastr.success('Long description generated successfully!');
          this.submit();
        } else {
          this._toastr.error('Failed to generate long description');
          this.submit();
        }
      },
      error: () => {
        this._toastr.error('Failed to generate long description');
        this._spinner.hide();
        this.submit();
      },
    });
  }
```

## UI & Interaction Blueprint

### Step 1 – Basic Information

- **Layout**: two-column responsive grid (70/30 split on ≥1024px) or stacked on mobile. Wrap the form in a rounded card with subtle shadow and white background, mimicking the mockup.
- **Fields & behaviors**
  - Course Name (required text input) with AI “Generate name” icon button.
  - Short Description (required textarea, 255-char guidance & counter) with AI optimize action. Display a warning color when the count exceeds 255.
  - Author toggle (organization vs teacher). When `teacher`, show a `select` bound to `staffList` and mark it required.
  - Banner image preview (3:2 ratio), “Choose image” button hooking into media slider (stub with a modal or file picker for now).
  - Duration select (minutes/hours/days) using the same values as Angular (`5`, `30`, `60`, … `525600`).
  - Product Tags chips: enter on `Enter`, deduplicate, allow removal.
  - Product Categories multi-select with inline search, chips for selected values, and “Add new category” button launching a dialog; upon adding, list should refresh.
- **Buttons**: “Cancel” (return to course list) and “Next” (validate + call `checkSummary`). If the long description is missing but short description exists, trigger the AI generation flow before advancing.

- **Tailwind scaffolding suggestion**

```html
<form class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 space-y-8">
  <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div class="space-y-6">
      <!-- Text inputs, author toggle, tags -->
    </div>
    <aside class="space-y-6">
      <!-- Image picker, duration select, categories -->
    </aside>
  </div>
  <div class="flex justify-end gap-3">
    <button type="button" class="px-4 py-2 rounded-lg border border-slate-200">Cancel</button>
    <button type="submit" class="px-6 py-2 rounded-lg bg-primary-600 text-white">Next</button>
  </div>
</form>
```

### Step 2 – Sales Page Template

- Show template actions (Regenerate AI Template, Previous, Save, Submit). Disable regeneration while the editor stub is unavailable.
- Embed an `app-admin-shared-grapejs-template` equivalent as a placeholder component that accepts the same props (`productData`, `template`) and exposes callbacks for `sendEditorUpdates`, `saveEmitter`, `dirtyCountEmitter`.
- Provide skeleton or preview area with dummy HTML while the real editor is pending.
- Buttons should call the stubbed `setProductUntemplate(false|true)` to persist template data; keep them wired so once the editor is real the save path already works.

## Business Logic Checklist

- **Cloudinary helpers**: replicate `buildImage` logic to resolve placeholders for empty banners.
- **Author derivation**: default to organization name unless author type is `teacher` and a staff record is selected.
- **Registration link**: reuse `buildRegistrationLink` to surface a preview link (course slug appended to tenant host).
- **Tags**: push/pop from local array and keep the hidden `productTagList` field synchronized.
- **Category search**: maintain `searchQuery`, filter `existingCategories`, and allow removal of chips via `removeCategory`.

```619:786:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  public addTagInput(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !this.productTags.includes(value)) {
      this.productTags.push(value);
      this.basicInfoForm.get('productTagList').setValue(this.productTags);
    }
    input.value = '';
    event.preventDefault();
  }
  public removeTag(tag: string): void {
    const index = this.productTags.indexOf(tag);
    if (index >= 0) {
      this.productTags.splice(index, 1);
      this.basicInfoForm.get('productTagList').setValue(this.productTags);
    }
  }
  public onCategorySelectionChange(event: any): void {
    const selectedCategoryIds = event.value || [];
    this.productCategories = selectedCategoryIds;
    this.basicInfoForm.get('productCategoryId').setValue(this.productCategories);
  }
  public onCategorySearch(event: any): void {
    this.searchQuery = event.target.value;
    this.filteredCategories = this.searchQuery.trim() === ''
      ? [...this.existingCategories]
      : this.existingCategories.filter(category =>
          category.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
        );
  }
```

- **Long description guard**: call `generateLongDescription` when leaving step 1 if `longDescription` is empty but `shortDescription` exists.
- **Template save**: when no editor is mounted, call `sendFlyerPrompt()` only after the initial create to bootstrap AI-generated templates.
- **Polling control**: `pollForAIResult` loops up to 12 times (5-second interval) and updates spinner messages; provide the same cancellation hooks to avoid memory leaks.

```1068:1219:v5byclasses/myapp/src/app/main/admin/product-bundle/bundle-add-edit/bundle-add-edit.component.ts
  public sendFlyerPrompt(): void {
    if (!this.editor) {
      this._toastr.warning('Editor is still initializing. Please wait a moment and try again.');
      return;
    }
    this.spinnerMessage = 'Generating AI Flyer...';
    this._spinner.show();
    const courseData = this.buildCourseDataPayload();
    this._aiTemplateService.sendFlyerPrompt('Generate a professional course flyer based on the provided course details.', ['designer'], courseData)
      .subscribe({
        next: (result: any) => {
          if (result?.sessionId) {
            this.spinnerMessage = 'Generating AI Flyer...';
            this.pollForAIResult(result.sessionId);
          } else {
            this._toastr.error('Invalid response from AI service');
            this._spinner.hide();
          }
        },
        error: () => {
          this._toastr.error('Failed to send AI prompt');
          this._spinner.hide();
        },
      });
  }
```

## AI & Editor Stubs

- Implement a context/service that mirrors `_aiSidebarService` and `_aiTemplateService` contracts:
  - `set(targetField, features)` to configure suggestions.
  - `open()` / `close()` to control sidebar visibility.
  - `updateProductDetails(productDetails)` to refresh AI context on every form change.
  - `sendAiPrompt(prompt, genres)` returning a mocked response until the real AI endpoint is wired.
  - `sendFlyerPrompt` + `checkAIStatus` stubbed with canned JSON to let the polling flow exercise success and failure branches.
- Keep editor-related callbacks (`getEditor`, `setProductUntemplate`, `loadHtmlIntoEditor`) as noop/dummy implementations that resolve immediately with sample HTML so the rest of the save cycle can be tested without GrapesJS.

## Suggested File Structure (React)

- `src/app/admin/courses/[id]/page.tsx` – `AddEditCoursePage` container hooking into router params and orchestrating loading state, stepper navigation, and submission.
- `src/components/courses/CourseDetailsForm.tsx` – Tailwind form for Step 1.
- `src/components/courses/CourseTemplatePanel.tsx` – placeholder for Step 2 actions and future editor.
- `src/services/courseDetailService.ts` – wraps product APIs (`getCourseDetails`, `createCourse`, `updateCourse`, `saveTemplate`, `getCategories`, `createCategory`, `getStaff`).
- `src/services/courseAiService.ts` – facade around AI prompt stubs.
- `src/hooks/useCourseDetail.ts` – encapsulates state machine, form initialization, tag/category helpers, and AI interactions.

## Testing & QA Checklist

1. **Data loading**
   - Existing course fetch populates all fields, including tags/categories and image preview.
   - New course flow shows empty form with organization author preselected.

2. **Form validation**
   - Required fields block submission with inline errors.
   - Switching to teacher author enforces teacher selection.
   - Tag/category chips stay in sync with form values.

3. **AI assistants (stubs)**
   - AI sidebar receives updated product details whenever the form changes.
   - Invoking “Generate description” populates the long description field with stub content and resumes submission.

4. **Template actions**
   - Save/Submit buttons call template save stubs and show success notifications.
   - Regenerate button triggers dummy polling and shows spinner messages.

5. **Navigation & UX**
   - Cancel returns to course list without unsaved warnings when form is clean.
   - Stepper prevents advancing when validation fails.
   - Character counter flips to warning style above 255 characters.
   - Responsive layout matches the Tailwind mockups for desktop/tablet/mobile.

6. **API payloads**
   - Create payload includes `productCategory` array of IDs, `productTagList`, duration, descriptions, author data, and `image1` Cloudinary public ID.
   - Update payload carries the existing `guId`.
   - Template payload posts `unhtml` & `unjson` (even when using placeholder editor data) together with org metadata.

7. **Error handling**
   - Spinner hides and toasts display helpful errors when API calls fail.
   - Polling timeout surfaces a retry message.

## Notes & Next Steps

- Once GrapesJS integration is prioritized, replace the stubs with the real editor component and wire `sendEditorUpdates`, `loadHtmlIntoEditor`, and `getDirtyCount` callbacks.
- Consider extracting AI prompt builders into reusable utilities so bundles/courses/events share the same tone.
- Align toast/spinner utilities with the broader React app (e.g., use a global `useToast` hook instead of direct Toastr calls).


