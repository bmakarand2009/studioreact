import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Tag,
  User,
  UploadCloud,
  Wand2,
} from 'lucide-react';

import { Button } from '@/components/ui';
import appLoadService, { TenantDetails } from '@/app/core/app-load';
import {
  CourseCategory,
  CourseSavePayload,
  courseDetailService,
  StaffMember,
} from '@/services/courseDetailService';
import { courseAiService } from '@/services/courseAiService';
import { useToast } from '@/components/ui/ToastProvider';
import { MediaSliderLauncher } from '@/components/media-slider';

type Step = 0 | 1;

interface CourseFormState {
  name: string;
  shortDescription: string;
  longDescription: string;
  authorType: 'organization' | 'teacher';
  authorId: string;
  durationStr: string;
  image1: string;
  productTagList: string[];
  productCategoryId: string[];
  price?: string;
}

const PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/wajooba/image/upload/v1744785332/master/fbyufuhlihaqumx1yegb.svg';

const DURATION_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '360', label: '6 hours' },
  { value: '720', label: '12 hours' },
  { value: '1440', label: '1 day' },
  { value: '2880', label: '2 days' },
  { value: '8640', label: '6 days' },
  { value: '10080', label: '1 week' },
  { value: '20160', label: '2 weeks' },
  { value: '43200', label: '1 month' },
  { value: '129600', label: '3 months' },
  { value: '259200', label: '6 months' },
  { value: '525600', label: '1 year' },
];

const DEFAULT_TEMPLATE_HTML = `<section style="font-family: 'Inter', system-ui; max-width: 720px; margin: 0 auto; padding: 48px;">
  <h1 style="font-size: 36px; margin-bottom: 16px; color: #0f172a;">Your Course Headline</h1>
  <p style="font-size: 18px; color: #475569; line-height: 1.6;">
    Use this area to highlight the most compelling outcomes of your course. Explain who it's for, what they will accomplish, and why they should join now.
  </p>
  <ul style="margin-top: 24px; color: #334155;">
    <li>✔️ Structured lessons with guided practice</li>
    <li>✔️ Templates, worksheets, & support resources</li>
    <li>✔️ Expert instructor feedback on milestones</li>
  </ul>
</section>`;

const initialFormState: CourseFormState = {
  name: '',
  shortDescription: '',
  longDescription: '',
  authorType: 'organization',
  authorId: '',
  durationStr: '30',
  image1: '',
  productTagList: [],
  productCategoryId: [],
  price: '',
};

const sparkleStyles = `
@keyframes sparkle-burst {
  0%, 100% {
    transform: scale(0.5);
    opacity: 0;
  }
  45% {
    transform: scale(1);
    opacity: 1;
  }
  70% {
    transform: scale(0.8);
    opacity: 0.6;
  }
}

.sparkle-star {
  position: absolute;
  width: 8px;
  height: 8px;
  opacity: 0;
}

.sparkle-star polygon {
  fill: currentColor;
}
`;

const AddEditCoursePage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [formState, setFormState] = useState<CourseFormState>(initialFormState);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [existingCategories, setExistingCategories] = useState<CourseCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CourseCategory[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDescription, setNewCategoryDescription] = useState<string>('');

  const [activeStep, setActiveStep] = useState<Step>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTemplateSaving, setIsTemplateSaving] = useState<boolean>(false);
  const [aiLoadingField, setAiLoadingField] = useState<'name' | 'shortDescription' | 'longDescription' | null>(null);

  const [courseData, setCourseData] = useState<any>(null);
  const [templateState, setTemplateState] = useState<{
    html: string;
    json: Record<string, any>;
    templateId?: string;
  }>({
    html: DEFAULT_TEMPLATE_HTML,
    json: {},
    templateId: undefined,
  });

  const courseGuId = useMemo(() => {
    if (id) {
      return id;
    }
    if (courseData?.guId) {
      return courseData.guId;
    }
    return null;
  }, [courseData, id]);

  const isExistingCourse = Boolean(courseGuId);

  const setFormValues = useCallback((values: Partial<CourseFormState>) => {
    setFormState((prev) => ({ ...prev, ...values }));
  }, []);

  const durationLabel = useCallback((value: string) => {
    const match = DURATION_OPTIONS.find((option) => option.value === value);
    return match ? match.label : `${value} minutes`;
  }, []);

  const handleImageSelect = useCallback(
    (publicId: string) => {
      // Directly use the public ID received from media slider (matches Angular pattern)
      setFormValues({ image1: publicId });
    },
    [setFormValues],
  );

  const bannerImageUrl = useMemo(() => {
    if (!formState.image1) {
      return PLACEHOLDER_IMAGE;
    }
    if (formState.image1.startsWith('http')) {
      return formState.image1;
    }
    if (tenantDetails?.cloudName) {
      return `https://res.cloudinary.com/${tenantDetails.cloudName}/image/upload/c_fill,h_320,w_480/${formState.image1}`;
    }
    return PLACEHOLDER_IMAGE;
  }, [formState.image1, tenantDetails]);

  const aiContext = useMemo(() => {
    const instructorName =
      formState.authorType === 'teacher'
        ? staffList.find((staff) => staff.guId === formState.authorId)?.name || 'Course Instructor'
        : tenantDetails?.name || 'Organization';

    return {
      courseName: formState.name || 'Course Name',
      shortDescription: formState.shortDescription || '',
      longDescription: formState.longDescription || '',
      authorName: instructorName,
      durationText: durationLabel(formState.durationStr),
      priceText: formState.price ? `$${formState.price}` : 'Free',
    };
  }, [durationLabel, formState, staffList, tenantDetails]);

  useEffect(() => {
    setFilteredCategories((prev) => {
      if (!categorySearchQuery) {
        return [...existingCategories];
      }
      const lower = categorySearchQuery.toLowerCase();
      return existingCategories.filter((category) =>
        category.name.toLowerCase().includes(lower),
      );
    });
  }, [categorySearchQuery, existingCategories]);

  const hydrateFormFromCourse = useCallback(
    (course: any) => {
      if (!course) {
        return;
      }

      const wemail = course?.wemail || {};
      const existingTags =
        Array.isArray(wemail?.productTagList) && wemail.productTagList.length
          ? wemail.productTagList
          : Array.isArray(course?.productTagList)
          ? course.productTagList
          : [];

      const existingCategoriesIds: string[] = Array.isArray(course?.productCategoryList)
        ? course.productCategoryList.map((category: any) => category?.id || category?.guId || category)
        : Array.isArray(course?.productCategory)
        ? course.productCategory.map((category: any) => category?.id || category?.guId || category)
        : [];

      setFormState({
        name: course?.name || '',
        shortDescription: course?.shortDescription || '',
        longDescription: wemail?.longDescription || course?.longDescription || '',
        authorType: wemail?.authorType || course?.authorType || 'organization',
        authorId: wemail?.authorId || course?.authorId || '',
        durationStr: wemail?.durationStr || course?.durationStr || '30',
        image1: course?.image1 || '',
        productTagList: existingTags,
        productCategoryId: existingCategoriesIds,
        price: course?.price || '',
      });

      setProductTags(existingTags);
      setProductCategories(existingCategoriesIds);
    },
    [],
  );

  const loadInitialData = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const tenant = await appLoadService.initAppConfig();
      setTenantDetails(tenant);

      const [staff, categories] = await Promise.all([
        courseDetailService.getStaffList(),
        tenant?.tenantId ? courseDetailService.getCategories(tenant.tenantId) : Promise.resolve([]),
      ]);

      setStaffList(staff);
      setExistingCategories(categories);
      setFilteredCategories(categories);

      if (id) {
        const response = await courseDetailService.getCourseDetail(id);
        const course = response?.data || response;
        setCourseData(course);
        hydrateFormFromCourse(course);

        const template =
          response?.template ||
          course?.template ||
          response?.data?.template ||
          null;

        if (template) {
          setTemplateState({
            html: template?.unhtml || DEFAULT_TEMPLATE_HTML,
            json: template?.unjson || {},
            templateId: template?._id || template?.id,
          });
        }
      }
    } catch (error: any) {
      console.error('[AddEditCoursePage] Initialization failed', error);
      toast.error(error?.message || 'Failed to load course details.');
    } finally {
      setIsPageLoading(false);
    }
  }, [hydrateFormFromCourse, id, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'course-detail-sparkle-keyframes';
    styleEl.innerHTML = sparkleStyles;
    document.head.appendChild(styleEl);
    return () => {
      if (styleEl.parentElement) {
        styleEl.parentElement.removeChild(styleEl);
      }
    };
  }, []);

  const validateStepOne = useCallback(() => {
    const validationErrors: Record<string, string> = {};
    if (!formState.name.trim()) {
      validationErrors.name = 'Course name is required.';
    }
    if (!formState.shortDescription.trim()) {
      validationErrors.shortDescription = 'Short description is required.';
    }
    if (formState.authorType === 'teacher' && !formState.authorId) {
      validationErrors.authorId = 'Please select a teacher.';
    }
    if (!productCategories.length) {
      validationErrors.productCategoryId = 'Select at least one category.';
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formState, productCategories.length]);

  const buildCoursePayload = useCallback((): CourseSavePayload => {
    const isTeacher = formState.authorType === 'teacher';
    const existing = courseData || {};

    const base: CourseSavePayload = {
      categoryType: existing.categoryType || 'SERVICE',
      descriptionEditor: existing.descriptionEditor || '',
      donationId: existing.donationId || '',
      externalLink: existing.externalLink || '',
      guId: courseGuId || existing.guId,
      host: existing.host || '',
      image2: existing.image2 || '',
      image3: existing.image3 || '',
      imageOrVideoRadio: existing.imageOrVideoRadio || 'image',
      isAllowDemoChapters: existing.isAllowDemoChapters || false,
      isCOPPACompliant: existing.isCOPPACompliant || false,
      isFranchiseCourse: existing.isFranchiseCourse || false,
      isMandatory: existing.isMandatory || false,
      isTeacher,
      longDescription: formState.longDescription,
      membershipType: existing.membershipType || '',
      seoKeywords: existing.seoKeywords || '',
      teacherId: isTeacher ? formState.authorId : null,
      title: formState.name,
      videoUrl: existing.videoUrl || '',
      authorId: isTeacher ? formState.authorId : null,
      authorType: formState.authorType,
      classColor: existing.classColor || '',
      image1: formState.image1,
      name: formState.name,
      shortDescription: formState.shortDescription,
      paymentType: existing.paymentType || 'FREE',
      memberships: existing.memberships || [],
      highlightsList: existing.highlightsList || [],
      registrationFormId: existing.registrationFormId || '',
      productTagList: [...formState.productTagList],
      durationStr: formState.durationStr,
      productCategoryId: [...formState.productCategoryId],
      productCategory: [...formState.productCategoryId],
      wemail: {
        ...(existing.wemail || {}),
        authorType: formState.authorType,
        authorId: isTeacher ? formState.authorId : null,
        longDescription: formState.longDescription,
        shortDescription: formState.shortDescription,
        productTagList: [...formState.productTagList],
        durationStr: formState.durationStr,
      },
    };

    if (formState.price !== undefined) {
      base.price = formState.price;
    }

    return base;
  }, [courseData, courseGuId, formState]);

  const handleNextStep = useCallback(async () => {
    if (!validateStepOne()) {
      return;
    }

    // Auto-generate long description if empty but short description exists.
    if (!formState.longDescription.trim() && formState.shortDescription.trim()) {
      try {
        setAiLoadingField('longDescription');
        const generated = await courseAiService.generateField('longDescription', aiContext);
        setFormValues({ longDescription: generated });
      } catch (error: any) {
        console.error('[AddEditCoursePage] Failed to generate long description', error);
        toast.error(error?.message || 'Unable to generate a long description.');
        setAiLoadingField(null);
        return;
      } finally {
        setAiLoadingField(null);
      }
    }

    try {
      setIsSaving(true);
      const payload = buildCoursePayload();
      const response = isExistingCourse && courseGuId
        ? await courseDetailService.updateCourse(courseGuId, payload)
        : await courseDetailService.createCourse(payload);

      const saved = response?.data || response;
      setCourseData(saved);
      if (!id && saved?.guId) {
        navigate(`/admin/courses/edit/${saved.guId}`, { replace: true });
      }
      toast.success('Course details saved successfully.');
      setActiveStep(1);
    } catch (error: any) {
      console.error('[AddEditCoursePage] Failed to save course', error);
      toast.error(error?.message || 'Failed to save course information.');
    } finally {
      setIsSaving(false);
    }
  }, [
    aiContext,
    buildCoursePayload,
    courseGuId,
    formState.longDescription,
    formState.shortDescription,
    id,
    isExistingCourse,
    navigate,
    toast,
    setFormValues,
    validateStepOne,
  ]);

  const handleTemplateSave = useCallback(
    async (redirectAfterSave = false) => {
      if (!tenantDetails?.orgId) {
        toast.error('Tenant configuration is required before saving templates.');
        return;
      }

      if (!courseGuId) {
        toast.error('Save the course information before updating the template.');
        return;
      }

      try {
        setIsTemplateSaving(true);
        const result = await courseDetailService.saveTemplate({
          courseGuId: courseGuId,
          name: formState.name || courseData?.name || 'Course',
          orgId: tenantDetails.orgId,
          url: courseData?.url || '',
          unhtml: templateState.html,
          unjson: templateState.json,
          templateId: templateState.templateId,
        });

        const updatedTemplate = result?.data || result;
        if (updatedTemplate?._id || updatedTemplate?.id) {
          setTemplateState((prev) => ({
            ...prev,
            templateId: updatedTemplate?._id || updatedTemplate?.id,
          }));
        }

        toast.success('Template saved successfully.');

        if (redirectAfterSave) {
          navigate('/admin/courses');
        }
      } catch (error: any) {
        console.error('[AddEditCoursePage] Failed to save template', error);
        toast.error(error?.message || 'Failed to save template.');
      } finally {
        setIsTemplateSaving(false);
      }
    },
    [
      courseData?.name,
      courseData?.url,
      courseGuId,
      formState.name,
      navigate,
      toast,
      templateState.html,
      templateState.json,
      templateState.templateId,
      tenantDetails?.orgId,
    ],
  );

  const handleAiGenerate = useCallback(
    async (field: 'name' | 'shortDescription') => {
      try {
        setAiLoadingField(field);
        const generated = await courseAiService.generateField(field, aiContext);
        setFormValues({ [field]: generated } as Partial<CourseFormState>);
        if (field === 'shortDescription' && !formState.longDescription) {
          setFormValues({ longDescription: generated });
        }
        toast.success(`AI suggestion applied to ${field === 'name' ? 'course name' : 'short description'}.`);
      } catch (error: any) {
        console.error('[AddEditCoursePage] AI generation failed', error);
        toast.error(error?.message || 'Unable to generate content with AI.');
      } finally {
        setAiLoadingField(null);
      }
    },
    [aiContext, formState.longDescription, setFormValues, toast],
  );

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    const value = event.currentTarget.value.trim();
    if (!value || productTags.includes(value)) {
      event.preventDefault();
      event.currentTarget.value = '';
      return;
    }
    const updated = [...productTags, value];
    setProductTags(updated);
    setFormValues({ productTagList: updated });
    event.preventDefault();
    event.currentTarget.value = '';
  };

  const removeTag = (tag: string) => {
    const updated = productTags.filter((existing) => existing !== tag);
    setProductTags(updated);
    setFormValues({ productTagList: updated });
  };

  const toggleCategorySelection = (categoryId: string) => {
    const updated = productCategories.includes(categoryId)
      ? productCategories.filter((id) => id !== categoryId)
      : [...productCategories, categoryId];
    setProductCategories(updated);
    setFormValues({ productCategoryId: updated });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.productCategoryId;
      return next;
    });
  };

  const handleAddCategory = async () => {
    if (!tenantDetails?.tenantId) {
      toast.error('Tenant configuration is missing.');
      return;
    }
    if (!newCategoryName.trim()) {
      return;
    }
    try {
      const created = await courseDetailService.createCategory(tenantDetails.tenantId, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });

      setExistingCategories((prev) => [...prev, created]);
      setFilteredCategories((prev) => [...prev, created]);
      toggleCategorySelection(created.id);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsAddCategoryOpen(false);
      toast.success('Category added successfully.');
    } catch (error: any) {
      console.error('[AddEditCoursePage] Failed to create category', error);
      toast.error(error?.message || 'Failed to create category.');
    }
  };

  const renderTagChips = () => (
    <div className="flex flex-wrap gap-2">
      {productTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        >
          {tag}
          <button
            type="button"
            className="text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-100"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );

  const renderCategoryChips = () => (
    <div className="flex flex-wrap gap-2">
      {productCategories.map((categoryId) => {
        const category = existingCategories.find((item) => item.id === categoryId);
        return (
          <span
            key={categoryId}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            {category?.name || categoryId}
            <button
              type="button"
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
              onClick={() => toggleCategorySelection(categoryId)}
              aria-label={`Remove ${category?.name || categoryId}`}
            >
              ×
            </button>
          </span>
        );
      })}
    </div>
  );

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              onClick={() => navigate('/admin/courses')}
              aria-label="Back to courses"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Course Details
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                activeStep === 0
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              {activeStep === 0 ? 'Step 1 of 2 · Basic Info' : 'Step 2 of 2 · Sales Page'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl px-6 lg:px-8">
        <div className="space-y-8">
          {activeStep === 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Course Name
                      </label>
                      <button
                        type="button"
                        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-primary-300 disabled:cursor-not-allowed"
                        onClick={() => handleAiGenerate('name')}
                        disabled={aiLoadingField === 'name'}
                        aria-label="Generate course name with AI"
                      >
                        {aiLoadingField === 'name' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="relative flex items-center justify-center">
                            <Wand2 className="h-4 w-4 drop-shadow-sm" />
                            <svg
                              className="sparkle-star"
                              style={{ top: '-14px', right: '-2px', animation: 'sparkle-burst 2.2s ease-in-out infinite' }}
                              viewBox="0 0 10 10"
                            >
                              <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                            </svg>
                            <svg
                              className="sparkle-star"
                              style={{ bottom: '-14px', left: '-2px', animation: 'sparkle-burst 2.5s ease-in-out infinite 0.8s' }}
                              viewBox="0 0 10 10"
                            >
                              <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                            </svg>
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                       <input
                        type="text"
                        value={formState.name}
                        onChange={(event) => setFormValues({ name: event.target.value })}
                        placeholder="Enter course name"
                        className={`w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 ${
                          errors.name ? 'border-red-400 focus:ring-red-200' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Short Description
                      </label>
                      <button
                        type="button"
                        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:text-primary-300 disabled:cursor-not-allowed"
                        onClick={() => handleAiGenerate('shortDescription')}
                        disabled={aiLoadingField === 'shortDescription'}
                        aria-label="Generate short description with AI"
                      >
                        {aiLoadingField === 'shortDescription' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="relative flex items-center justify-center">
                            <Wand2 className="h-4 w-4 drop-shadow-sm" />
                            <svg
                              className="sparkle-star"
                              style={{ top: '-14px', left: '-2px', animation: 'sparkle-burst 2.1s ease-in-out infinite 0.3s' }}
                              viewBox="0 0 10 10"
                            >
                              <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                            </svg>
                            <svg
                              className="sparkle-star"
                              style={{ bottom: '-14px', right: '-2px', animation: 'sparkle-burst 2.6s ease-in-out infinite 1s' }}
                              viewBox="0 0 10 10"
                            >
                              <polygon points="5 0 6.5 3.5 10 5 6.5 6.5 5 10 3.5 6.5 0 5 3.5 3.5" />
                            </svg>
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      <textarea
                        value={formState.shortDescription}
                        onChange={(event) => setFormValues({ shortDescription: event.target.value })}
                        placeholder="Describe your course in a short, engaging way."
                        maxLength={600}
                        rows={4}
                        className="w-full rounded-lg border-0 bg-transparent px-4 py-3 text-sm text-slate-900 focus:ring-0 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span className={formState.shortDescription.length > 255 ? 'text-red-500' : ''}>
                        {formState.shortDescription.length}/255 characters
                      </span>
                      {errors.shortDescription && (
                        <span className="text-red-500">{errors.shortDescription}</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Author
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Choose whether this course is hosted by the organization or a teacher.
                    </p>
                    <div className="mt-4 inline-flex rounded-full bg-white p-1 shadow-inner dark:bg-slate-900">
                      {(['organization', 'teacher'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormValues({ authorType: option, authorId: '' })}
                          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                            formState.authorType === option
                              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          {option === 'organization' ? 'Organization' : 'Teacher'}
                        </button>
                      ))}
                    </div>

                    {formState.authorType === 'teacher' && (
                      <div className="mt-4 space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Select Teacher
                        </label>
                        <div className="relative">
                          <select
                            value={formState.authorId}
                            onChange={(event) => setFormValues({ authorId: event.target.value })}
                            className={`w-full appearance-none rounded-lg border bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-900 shadow-sm transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
                              errors.authorId ? 'border-red-400 focus:ring-red-200' : ''
                            }`}
                          >
                            <option value="">Select teacher</option>
                            {staffList.map((staff) => (
                              <option key={staff.guId} value={staff.guId}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                        {errors.authorId && (
                          <p className="text-xs font-medium text-red-500">{errors.authorId}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Product Tags
                    </label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <Tag className="h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Add tag and press Enter"
                          onKeyDown={handleTagKeyDown}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="mt-4">{renderTagChips()}</div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-8">
                  <div className="rounded-3xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <img
                        src={bannerImageUrl}
                        alt="Course banner"
                        className="h-48 w-full rounded-2xl object-cover"
                        onError={(event) => {
                          event.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-4">
                        <p className="text-sm font-semibold text-white">Course Banner</p>
                        <p className="text-xs text-slate-200">Recommended ratio 3:2</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <MediaSliderLauncher
                        variant="secondary"
                        className="flex-1 justify-center rounded-xl bg-white text-slate-600 shadow-sm hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        onSelect={handleImageSelect}
                        title="Select Course Banner"
                        description="Choose an image from your media library or upload a new one"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Change Image
                      </MediaSliderLauncher>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Duration
                    </label>
                    <div className="relative">
                      <select
                        value={formState.durationStr}
                        onChange={(event) => setFormValues({ durationStr: event.target.value })}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-900 shadow-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Product Categories
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                        aria-expanded={categoryDropdownOpen}
                      >
                        <span className="truncate">
                          {productCategories.length ? `${productCategories.length} selected` : 'Select categories'}
                        </span>
                      </button>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        {categoryDropdownOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                      {categoryDropdownOpen && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-700">
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearchQuery}
                              onChange={(event) => setCategorySearchQuery(event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto px-4 py-3">
                            {filteredCategories.length === 0 ? (
                              <p className="text-xs text-slate-400">No categories found.</p>
                            ) : (
                              filteredCategories.map((category) => (
                                <label
                                  key={category.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                                    checked={productCategories.includes(category.id)}
                                    onChange={() => toggleCategorySelection(category.id)}
                                  />
                                  <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-100">
                                      {category.name}
                                    </p>
                                    {category.description && (
                                      <p className="text-xs text-slate-400">{category.description}</p>
                                    )}
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                          <div className="flex border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                            <Button
                              variant="secondary"
                              className="w-full justify-center rounded-xl border border-dashed border-primary-400 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                              onClick={() => setIsAddCategoryOpen(true)}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add New Category
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 space-y-2">
                        {renderCategoryChips()}
                        {errors.productCategoryId && (
                          <p className="text-xs font-medium text-red-500">
                            {errors.productCategoryId}
                          </p>
                        )}
                      </div>
                  </div>

                </aside>
              </div>

              <div className="mt-10 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => navigate('/admin/courses')}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                  onClick={handleNextStep}
                  disabled={isSaving || aiLoadingField === 'longDescription'}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save & Continue'
                  )}
                </Button>
              </div>
            </section>
          )}

          {activeStep === 1 && (
            <section className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
                <header className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Sales Page
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      Template Preview
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Customize the course landing page content. Editor integration will be added soon.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setActiveStep(0)}
                    >
                      Back to Basic Info
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                      onClick={async () => {
                        toast.info('Template regeneration is coming soon. Using placeholder template for now.');
                        setTemplateState({
                          html: DEFAULT_TEMPLATE_HTML,
                          json: {},
                          templateId: templateState.templateId,
                        });
                      }}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Regenerate Template
                    </Button>
                  </div>
                </header>

                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/60">
                  <textarea
                    value={templateState.html}
                    onChange={(event) =>
                      setTemplateState((prev) => ({ ...prev, html: event.target.value }))
                    }
                    rows={14}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Paste or compose HTML template here..."
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Use this area as a temporary editor until the GrapesJS designer is integrated.
                  </p>
                </div>

                <div className="mt-6">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Template Metadata (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(templateState.json, null, 2)}
                    onChange={(event) => {
                      try {
                        const parsed = JSON.parse(event.target.value);
                        setTemplateState((prev) => ({ ...prev, json: parsed }));
                        toast.success('Template structure updated.');
                      } catch (error) {
                        toast.error('Invalid JSON structure.');
                      }
                    }}
                    rows={6}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="{ }"
                  />
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setActiveStep(0)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-xl border border-primary-200 bg-primary-50 px-6 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                    onClick={() => handleTemplateSave(false)}
                    disabled={isTemplateSaving}
                  >
                    {isTemplateSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button
                    className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                    onClick={() => handleTemplateSave(true)}
                    disabled={isTemplateSaving}
                  >
                    {isTemplateSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing...
                      </span>
                    ) : (
                      'Submit Course'
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  What happens next?
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>
                    We’ll integrate the full GrapesJS experience in this panel. The save/submit buttons already call the real template APIs so your data model is in place.
                  </li>
                  <li>
                    When the designer is ready, plug the HTML and JSON outputs into the same state setter used above.
                  </li>
                  <li>
                    You can revisit the basic information at any time by using the “Back to Basic Info” button.
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>

      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Add Category</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Create a category to keep related courses grouped together.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Description <span className="text-xs text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(event) => setNewCategoryDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                onClick={handleAddCategory}
              >
                Save Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditCoursePage;

